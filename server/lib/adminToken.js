import crypto from 'crypto';

const SECRET = process.env.OMG_ADMIN_PASSWORD ?? '';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function sign(payload) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
}

export function createToken(username) {
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const signature = sign(payload);
  const raw = `${payload}:${signature}`;
  return Buffer.from(raw).toString('base64url');
}

export function verifyToken(token) {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const lastColon = raw.lastIndexOf(':');
    if (lastColon === -1) return { valid: false };

    const payload = raw.slice(0, lastColon);
    const signature = raw.slice(lastColon + 1);

    const expected = sign(payload);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return { valid: false };
    }

    const firstColon = payload.indexOf(':');
    if (firstColon === -1) return { valid: false };

    const username = payload.slice(0, firstColon);
    const timestamp = parseInt(payload.slice(firstColon + 1), 10);

    if (Number.isNaN(timestamp)) return { valid: false };
    if (Date.now() - timestamp > TOKEN_TTL_MS) return { valid: false };

    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

export function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] ?? '';
  const token =
    authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.query?.adminToken ?? '');

  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.adminUser = result.username;
  next();
}
