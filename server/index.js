import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'omg-plus-secret-change-in-prod';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SNAPSHOT_PATH = path.join(__dirname, 'store-snapshot.json');

const ALLOWED_ORIGINS = [
  'https://omg-plus.vercel.app',
  'https://omg-plus-d5ic0tbqi-offir1.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

// ─── In-memory store ──────────────────────────────────────────────────────────
const users = new Map();              // socketId → { socketId, username, side, debateId, ... }
const registeredUsers = new Map();    // username → { passwordHash, score, voiceDebates, giftsReceived, side, createdAt }
const debates = new Map();            // debateId → debate object
const archivedDebates = [];           // Array of archived debate objects (capped at 200)
const queue = { believer: [], atheist: [] };
const blockedUsers = new Set();
const adminNotes = new Map();         // username → string[]

// ─── Snapshot persistence ─────────────────────────────────────────────────────
function saveSnapshot() {
  try {
    const data = {
      registeredUsers: Object.fromEntries(registeredUsers),
      archivedDebates: archivedDebates.slice(-200),
      blockedUsers: [...blockedUsers],
      adminNotes: Object.fromEntries(adminNotes),
    };
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[snapshot] write error:', err.message);
  }
}

function loadSnapshot() {
  try {
    if (!fs.existsSync(SNAPSHOT_PATH)) return;
    const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (data.registeredUsers) {
      for (const [k, v] of Object.entries(data.registeredUsers)) {
        registeredUsers.set(k, v);
      }
    }
    if (Array.isArray(data.archivedDebates)) {
      archivedDebates.push(...data.archivedDebates);
    }
    if (Array.isArray(data.blockedUsers)) {
      data.blockedUsers.forEach(u => blockedUsers.add(u));
    }
    if (data.adminNotes) {
      for (const [k, v] of Object.entries(data.adminNotes)) {
        adminNotes.set(k, v);
      }
    }
    console.log('[snapshot] loaded successfully');
  } catch (err) {
    console.error('[snapshot] load error:', err.message);
  }
}

loadSnapshot();
setInterval(saveSnapshot, 60_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: 'No token' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ ok: false, error: 'Invalid token' });
  }
}

function matchPlayers() {
  while (queue.believer.length > 0 && queue.atheist.length > 0) {
    const believerEntry = queue.believer.shift();
    const atheistEntry = queue.atheist.shift();

    const { socketId: bId, username: bName } = believerEntry;
    const { socketId: aId, username: aName } = atheistEntry;

    const bSocket = io.sockets.sockets.get(bId);
    const aSocket = io.sockets.sockets.get(aId);

    if (!bSocket || !aSocket) {
      if (!bSocket && aSocket) queue.atheist.unshift(atheistEntry);
      if (!aSocket && bSocket) queue.believer.unshift(believerEntry);
      continue;
    }

    const debateId = generateId();
    const debate = {
      id: debateId,
      believer: { socketId: bId, username: bName },
      atheist: { socketId: aId, username: aName },
      messages: [],
      spectators: [],
      startedAt: Date.now(),
    };
    debates.set(debateId, debate);

    const roomName = `debate:${debateId}`;
    bSocket.join(roomName);
    aSocket.join(roomName);

    if (users.has(bId)) users.get(bId).debateId = debateId;
    if (users.has(aId)) users.get(aId).debateId = debateId;

    bSocket.emit('debate_start', { debateId, opponent: aName, side: 'believer' });
    aSocket.emit('debate_start', { debateId, opponent: bName, side: 'atheist' });

    io.emit('stats_update', getStats());
    console.log(`[debate] started ${debateId}: ${bName} vs ${aName}`);
  }
}

function getStats() {
  return {
    registered: registeredUsers.size,
    online: users.size,
  };
}

function archiveDebate(debate) {
  const archived = {
    ...debate,
    endedAt: Date.now(),
    duration: Date.now() - debate.startedAt,
  };
  archivedDebates.push(archived);
  if (archivedDebates.length > 200) archivedDebates.splice(0, archivedDebates.length - 200);
  debates.delete(debate.id);
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// ─── REST routes ──────────────────────────────────────────────────────────────

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'OMG-PLUS' });
});

// Register
app.post('/api/register', (req, res) => {
  const { username, password, side } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'username and password required' });
  }
  if (username.length < 2 || username.length > 32) {
    return res.status(400).json({ ok: false, error: 'username must be 2–32 chars' });
  }
  if (registeredUsers.has(username)) {
    return res.status(409).json({ ok: false, error: 'username taken' });
  }
  const passwordHash = sha256(username.toLowerCase() + password);
  const user = {
    passwordHash,
    score: 0,
    voiceDebates: 0,
    giftsReceived: 0,
    side: side || 'believer',
    createdAt: Date.now(),
    blocked: false,
  };
  registeredUsers.set(username, user);
  console.log(`[register] new user: ${username} side: ${user.side}`);
  res.json({ ok: true, user: { username, side: user.side, score: 0, createdAt: user.createdAt } });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'username and password required' });
  }
  const user = registeredUsers.get(username);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'user not found' });
  }
  const hash = sha256(username.toLowerCase() + password);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ ok: false, error: 'wrong password' });
  }
  if (user.blocked) {
    return res.status(403).json({ ok: false, error: 'user is blocked' });
  }
  console.log(`[login] user: ${username}`);
  res.json({ ok: true, user: { username, side: user.side, score: user.score, createdAt: user.createdAt } });
});

// Stats
app.get('/api/stats', (_req, res) => {
  res.json(getStats());
});

// Leaderboard
app.get('/api/leaderboard', (_req, res) => {
  const entries = [...registeredUsers.entries()]
    .map(([username, data]) => ({
      username,
      score: data.score,
      voiceDebates: data.voiceDebates,
      giftsReceived: data.giftsReceived,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  res.json(entries);
});

// Archived debates list
app.get('/api/debates/archived', (_req, res) => {
  const list = archivedDebates
    .slice(-50)
    .reverse()
    .map(d => ({
      id: d.id,
      believer: d.believer?.username,
      atheist: d.atheist?.username,
      messageCount: d.messages?.length || 0,
      startedAt: d.startedAt,
      endedAt: d.endedAt,
      duration: d.duration,
    }));
  res.json(list);
});

// Single archived debate
app.get('/api/debates/archived/:id', (req, res) => {
  const debate = archivedDebates.find(d => d.id === req.params.id);
  if (!debate) return res.status(404).json({ error: 'not found' });
  res.json(debate);
});

// Knowledge ask (Groq AI)
app.post('/api/knowledge-ask', async (req, res) => {
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question required' });
  if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI not configured' });

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable assistant specializing in Bible studies, theology, and faith traditions. Answer questions thoughtfully and respectfully, citing relevant scripture when appropriate.',
          },
          { role: 'user', content: question },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[groq] error:', errText);
      return res.status(502).json({ error: 'AI request failed' });
    }

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content || '';
    res.json({ answer });
  } catch (err) {
    console.error('[groq] fetch error:', err.message);
    res.status(502).json({ error: 'AI request failed' });
  }
});

// Radio proxy (CORS bypass)
app.get('/api/radio-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const upstream = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'OMG-PLUS-Radio/1.0' },
    });
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    upstream.body.pipe(res);
  } catch (err) {
    console.error('[radio-proxy] error:', err.message);
    res.status(502).json({ error: 'proxy failed' });
  }
});

// Voice proxy (ElevenLabs)
app.post('/api/voice-proxy', async (req, res) => {
  const { text, voiceId } = req.body || {};
  if (!text || !voiceId) return res.status(400).json({ error: 'text and voiceId required' });
  if (!ELEVENLABS_API_KEY) return res.status(503).json({ error: 'Voice not configured' });

  try {
    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_v3',
          language_code: 'he',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!elRes.ok) {
      const errText = await elRes.text();
      console.error('[elevenlabs] error:', errText);
      return res.status(502).json({ error: 'Voice request failed' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    elRes.body.pipe(res);
  } catch (err) {
    console.error('[elevenlabs] fetch error:', err.message);
    res.status(502).json({ error: 'Voice request failed' });
  }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ ok: false, error: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ ok: true, token });
});

// Admin: list users
app.get('/api/admin/users', verifyAdmin, (_req, res) => {
  const list = [...registeredUsers.entries()].map(([username, data]) => ({
    username,
    score: data.score,
    voiceDebates: data.voiceDebates,
    giftsReceived: data.giftsReceived,
    createdAt: data.createdAt,
    blocked: blockedUsers.has(username),
    notes: adminNotes.get(username) || [],
  }));
  res.json(list);
});

// Admin: block user
app.post('/api/admin/block', verifyAdmin, (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ ok: false, error: 'username required' });
  blockedUsers.add(username);

  // Disconnect if currently online
  for (const [socketId, user] of users.entries()) {
    if (user.username === username) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.disconnect(true);
    }
  }

  console.log(`[admin] blocked: ${username}`);
  res.json({ ok: true });
});

// Admin: delete user
app.post('/api/admin/delete', verifyAdmin, (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ ok: false, error: 'username required' });
  registeredUsers.delete(username);
  blockedUsers.delete(username);
  adminNotes.delete(username);

  // Disconnect if currently online
  for (const [socketId, user] of users.entries()) {
    if (user.username === username) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.disconnect(true);
    }
  }

  console.log(`[admin] deleted: ${username}`);
  res.json({ ok: true });
});

// Admin: add note
app.post('/api/admin/note', verifyAdmin, (req, res) => {
  const { username, note } = req.body || {};
  if (!username || !note) return res.status(400).json({ ok: false, error: 'username and note required' });
  const notes = adminNotes.get(username) || [];
  notes.push({ text: note, at: Date.now() });
  adminNotes.set(username, notes);
  res.json({ ok: true });
});

// ─── HTTP server + Socket.IO ──────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 5e6, // 5 MB for voice audio
});

// ─── Default namespace (matchmaking + debates) ────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.emit('stats_update', getStats());

  // Join queue
  socket.on('join_queue', ({ username, side } = {}) => {
    if (!username || !['believer', 'atheist'].includes(side)) {
      return socket.emit('error', { message: 'invalid join_queue params' });
    }
    if (blockedUsers.has(username)) {
      return socket.emit('error', { message: 'account blocked' });
    }

    // Remove from any existing queue slot
    queue.believer = queue.believer.filter(e => e.socketId !== socket.id);
    queue.atheist = queue.atheist.filter(e => e.socketId !== socket.id);

    users.set(socket.id, { socketId: socket.id, username, side, debateId: null });
    queue[side].push({ socketId: socket.id, username });
    socket.emit('queue_joined', { side, position: queue[side].length });

    console.log(`[queue] ${username} joined as ${side}. Q: B=${queue.believer.length} A=${queue.atheist.length}`);
    matchPlayers();
    io.emit('stats_update', getStats());
  });

  // Leave queue
  socket.on('leave_queue', () => {
    queue.believer = queue.believer.filter(e => e.socketId !== socket.id);
    queue.atheist = queue.atheist.filter(e => e.socketId !== socket.id);
    socket.emit('queue_left');
    io.emit('stats_update', getStats());
  });

  // Send text message in debate
  socket.on('send_message', ({ debateId, text } = {}) => {
    if (!debateId || !text) return;
    const debate = debates.get(debateId);
    if (!debate) return;

    const user = users.get(socket.id);
    const username = user?.username || 'Unknown';
    const msg = { username, text, at: Date.now() };
    debate.messages.push(msg);

    io.to(`debate:${debateId}`).emit('new_message', { debateId, ...msg });

    // Update score
    if (registeredUsers.has(username)) {
      registeredUsers.get(username).score += 1;
    }
  });

  // Send voice audio in debate
  socket.on('send_voice', ({ debateId, audioData } = {}) => {
    if (!debateId || !audioData) return;
    const debate = debates.get(debateId);
    if (!debate) return;

    const user = users.get(socket.id);
    const username = user?.username || 'Unknown';

    socket.to(`debate:${debateId}`).emit('new_voice', { debateId, username, audioData, at: Date.now() });

    if (registeredUsers.has(username)) {
      registeredUsers.get(username).voiceDebates += 1;
      registeredUsers.get(username).score += 3;
    }
  });

  // End debate
  socket.on('end_debate', ({ debateId } = {}) => {
    const debate = debates.get(debateId);
    if (!debate) return;

    archiveDebate(debate);
    io.to(`debate:${debateId}`).emit('debate_ended', { debateId });

    // Cleanup room members
    const room = io.sockets.adapter.rooms.get(`debate:${debateId}`);
    if (room) {
      for (const sid of room) {
        const s = io.sockets.sockets.get(sid);
        if (s) s.leave(`debate:${debateId}`);
        if (users.has(sid)) users.get(sid).debateId = null;
      }
    }

    console.log(`[debate] ended: ${debateId}`);
    io.emit('stats_update', getStats());
  });

  // Spectate debate
  socket.on('join_spectate', ({ debateId } = {}) => {
    const debate = debates.get(debateId);
    if (!debate) return socket.emit('error', { message: 'debate not found' });

    socket.join(`debate:${debateId}`);
    debate.spectators.push(socket.id);
    socket.emit('spectate_joined', {
      debateId,
      believer: debate.believer.username,
      atheist: debate.atheist.username,
      messages: debate.messages,
    });
  });

  // Send gift
  socket.on('send_gift', ({ debateId, gift } = {}) => {
    if (!debateId || !gift) return;
    const debate = debates.get(debateId);
    if (!debate) return;

    const sender = users.get(socket.id);
    const senderName = sender?.username || 'Anonymous';

    // Credit gift to opponent
    const isBeliever = debate.believer.socketId === socket.id;
    const opponentUsername = isBeliever
      ? debate.atheist.username
      : debate.believer.username;

    if (registeredUsers.has(opponentUsername)) {
      registeredUsers.get(opponentUsername).giftsReceived += 1;
      registeredUsers.get(opponentUsername).score += 5;
    }

    io.to(`debate:${debateId}`).emit('gift_received', {
      debateId,
      from: senderName,
      to: opponentUsername,
      gift,
      at: Date.now(),
    });
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);

    // Remove from queue
    queue.believer = queue.believer.filter(e => e.socketId !== socket.id);
    queue.atheist = queue.atheist.filter(e => e.socketId !== socket.id);

    // End any active debate
    const user = users.get(socket.id);
    if (user?.debateId) {
      const debate = debates.get(user.debateId);
      if (debate) {
        archiveDebate(debate);
        io.to(`debate:${user.debateId}`).emit('debate_ended', {
          debateId: user.debateId,
          reason: 'opponent_disconnected',
        });
      }
    }

    users.delete(socket.id);
    io.emit('stats_update', getStats());
  });
});

// ─── Faith namespace ──────────────────────────────────────────────────────────
const faithNs = io.of('/faith');

faithNs.on('connection', (socket) => {
  console.log(`[faith] connected: ${socket.id}`);

  socket.on('faith_join', ({ username } = {}) => {
    if (!username) return;
    socket.data.username = username;
    faithNs.emit('faith_system', { text: `${username} joined`, at: Date.now() });
  });

  socket.on('faith_message', ({ username, text } = {}) => {
    if (!text) return;
    const name = username || socket.data.username || 'Anonymous';
    faithNs.emit('faith_message', { username: name, text, at: Date.now() });
  });

  socket.on('disconnect', () => {
    const username = socket.data.username;
    if (username) {
      faithNs.emit('faith_system', { text: `${username} left`, at: Date.now() });
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[server] OMG-PLUS running on port ${PORT}`);
});
