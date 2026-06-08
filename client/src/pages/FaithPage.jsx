import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// ─── Static Data ────────────────────────────────────────────────────────────

const RABBI_QA = [
  {
    q: 'מה ההבדל בין שבת לבין יום טוב?',
    a: 'שבת היא יום המנוחה השביעי שנקבע בתורה, ואסורות בה כל ל״ט מלאכות. יום טוב הוא חג שנקבע על פי לוח השנה העברי — מותרת בו הכנת אוכל לצורך האכילה, אך אסורות מלאכות אחרות כבשבת.'
  },
  {
    q: 'האם מותר לאכול שרימפס לפי ההלכה?',
    a: 'לא. שרימפס (ושאר בעלי חיים ימיים שאין להם סנפיר וקשקשת) אינם כשרים לפי ההלכה, שנאמר: "את זה תאכלו מכל אשר במים — כל אשר לו סנפיר וקשקשת" (ויקרא י״א).'
  },
  {
    q: 'מתי מתחילה ומסתיימת שבת?',
    a: 'שבת מתחילה בשקיעת החמה ביום שישי ומסתיימת במוצאי שבת, כשיוצאים שלושה כוכבים בשמים. בפועל נוהגים להוסיף כמה דקות משני הצדדים לבטחון ("תוספת שבת").'
  },
  {
    q: 'מה המשמעות של ברית מילה?',
    a: 'ברית מילה היא הסימן הגופני של הברית שכרת הקב"ה עם אברהם אבינו ועם זרעו לדורות, שנאמר: "וּנְמַלְתֶּם אֵת בְּשַׂר עָרְלַתְכֶם וְהָיָה לְאוֹת בְּרִית בֵּינִי וּבֵינֵיכֶם" (בראשית י״ז).'
  },
  {
    q: 'מה ההלכה לגבי כיסוי ראש לנשים?',
    a: 'לפי ההלכה, אשה נשואה חייבת לכסות את שערה. הדבר נלמד מהתורה ומדברי חכמים. הסוברים לכסות בפאה נכרית, מטפחת או כובע — כל אחד לפי מנהג עדתו ופסיקת רבו.'
  },
  {
    q: 'מה פירוש המילה "כשר"?',
    a: '"כשר" פירושו "ראוי" — דהיינו מזון שהוכן לפי דיני כשרות: בשר שחוט כהלכה, ללא דם, ללא בשר וחלב יחד, ממינים מותרים בלבד. הסימן בבהמות: פרסות שסועות ומעלות גרה.'
  },
  {
    q: 'האם מותר לנוצרי להיכנס לבית כנסת?',
    a: 'מעיקר הדין מותר לבני אמות העולם להיכנס לבית כנסת בכבוד ובצניעות. בפועל, נוהגים רבים לקבלם בברכה, ובלבד שלא ייכנסו לקדש הקדשים ולא יפריעו לתפילה.'
  },
  {
    q: 'מה הם עשרת הדיברות?',
    a: 'עשרת הדיברות הם: (א) אנכי ה׳ אלוהיך, (ב) לא יהיה לך אלוהים אחרים, (ג) לא תישא את שם ה׳ לשווא, (ד) זכור את יום השבת, (ה) כבד את אביך ואמך, (ו) לא תרצח, (ז) לא תנאף, (ח) לא תגנוב, (ט) לא תענה עד שקר, (י) לא תחמוד.'
  },
  {
    q: 'מה ההבדל בין תורה שבכתב לתורה שבעל פה?',
    a: 'תורה שבכתב היא חמשת חומשי משה (בראשית, שמות, ויקרא, במדבר, דברים). תורה שבעל פה היא הפרשנות והביאור שנמסרו בעל פה מדור לדור, ונכתבו לבסוף במשנה ובתלמוד.'
  },
  {
    q: 'מה חשיבות הכותל המערבי?',
    a: 'הכותל המערבי הוא השריד היחיד שנותר מחומות בית המקדש השני, שנחרב בשנת 70 לספה"נ. הוא מסמל את הקשר הנצחי של עם ישראל לארצו ולמקדשו, ומהווה מקום תפילה מרכזי ומקודש.'
  }
];

const SHABBAT_TIMES = [
  { city: 'ירושלים', entry: '19:02', exit: '20:18' },
  { city: 'תל אביב', entry: '19:19', exit: '20:18' },
  { city: 'חיפה', entry: '19:14', exit: '20:18' },
  { city: 'באר שבע', entry: '19:21', exit: '20:18' },
  { city: 'אילת', entry: '19:20', exit: '20:16' },
  { city: 'נתניה', entry: '19:19', exit: '20:18' },
  { city: 'אשדוד', entry: '19:19', exit: '20:18' },
  { city: 'רחובות', entry: '19:19', exit: '20:18' },
  { city: 'פתח תקווה', entry: '19:19', exit: '20:18' },
  { city: 'רמת גן', entry: '19:18', exit: '20:18' }
];

const HALACHOT = [
  {
    title: 'נטילת ידיים שחרית',
    text: 'בשחר, כשאדם קם משנתו, חייב ליטול ידיו שלוש פעמים לסירוגין — ימין ושמאל — לפני שנוגע בעיניו, פיו או אפו. הנטילה נועדה לסלק את "רוח רעה" השורה על הידיים בלילה.'
  },
  {
    title: 'קריאת שמע',
    text: 'מצוות קריאת שמע מן התורה היא פעמיים ביום: שחרית וערבית. זמן קריאת שמע בבוקר הוא עד סוף שלוש שעות זמניות מהנץ החמה. המאחר — יצא ידי חובה בדיעבד עד חצות היום.'
  },
  {
    title: 'ברכת המזון',
    text: 'מי שאכל לחם (כזית ומעלה), חייב בברכת המזון מן התורה. על מאכלים אחרים מברכים "מעין שלוש" (ברכה מקוצרת). על שתייה (חוץ מיין) ועל פירות שאינם משבעת המינים — ברכה אחרונה.'
  },
  {
    title: 'הפרשת חלה',
    text: 'בעת לישת בצק של יותר מ-1.666 ק"ג קמח, יש להפריש חלה ולברך. בחו"ל — שורפים אותה או עוטפים ומשליכים. בארץ ישראל — נהגו להפרישה ולשרפה, לזכר תרומות שניתנו לכהנים.'
  },
  {
    title: 'כיבוד אב ואם',
    text: 'מצוות כיבוד אב ואם כוללת: לספק להם מאכל, שתייה ולבוש, לסייע להם בקימה וישיבה, ולא להכעיסם. האיסור חמור: "מקלל אביו ואמו מות יומת". הכיבוד חל גם לאחר פטירתם.'
  },
  {
    title: 'צדקה',
    text: 'מצוות צדקה היא מן התורה. חייבים לתת לפחות עשרה אחוזים מהכנסתו לצדקה (מעשר כספים). המקסימום המומלץ — עשרים אחוז, שלא ייעשה עצמו עני. עדיפות: קרובי משפחה, ואחר כך עניי עירו.'
  },
  {
    title: 'שמירת הלשון',
    text: 'איסורי לשון הרע ורכילות הם מן החמורים בהלכה. לשון הרע — סיפור דברים שליליים על אדם, אפילו אמת. רכילות — הולך ומספר מה שאמר זה על זה. האיסור חל גם על הכותב, השומע, ואפילו המרמז.'
  }
];

const BIBLE_EXAMPLE_QUESTIONS = [
  'מי כתב את ספר בראשית?',
  'כמה שנים חי מתושלח?',
  'מה המשמעות של שם יעקב?',
  'מה הם עשרת המכות?',
  'מי היתה רות המואביה?'
];

// ─── Styles (CSS-in-JS) ──────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a2e 0%, #16062b 40%, #0d0420 100%)',
    color: '#e8d5a3',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    direction: 'rtl',
    padding: '0 0 40px 0'
  },
  header: {
    textAlign: 'center',
    padding: '32px 16px 8px',
    borderBottom: '1px solid rgba(212,175,55,0.2)'
  },
  headerTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#d4af37',
    margin: 0,
    letterSpacing: '2px',
    textShadow: '0 0 20px rgba(212,175,55,0.4)'
  },
  headerSub: {
    color: '#a88cc0',
    fontSize: '0.95rem',
    marginTop: '6px'
  },
  tabBar: {
    display: 'flex',
    overflowX: 'auto',
    gap: '4px',
    padding: '12px 12px 0',
    borderBottom: '2px solid rgba(212,175,55,0.15)',
    scrollbarWidth: 'none'
  },
  tab: (active) => ({
    padding: '10px 18px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    fontWeight: active ? 700 : 400,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    background: active
      ? 'linear-gradient(180deg, #3d1a6e 0%, #2a0f50 100%)'
      : 'rgba(255,255,255,0.04)',
    color: active ? '#d4af37' : '#9b7ec8',
    borderBottom: active ? '2px solid #d4af37' : '2px solid transparent',
    boxShadow: active ? '0 -2px 12px rgba(212,175,55,0.15)' : 'none'
  }),
  content: {
    maxWidth: '820px',
    margin: '0 auto',
    padding: '24px 16px'
  },
  // Chat
  chatWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  chatWindow: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: '12px',
    height: '420px',
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  chatMsg: {
    background: 'rgba(61,26,110,0.4)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.92rem',
    borderRight: '3px solid #d4af37'
  },
  chatMsgMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  chatUsername: {
    color: '#d4af37',
    fontWeight: 700,
    fontSize: '0.82rem'
  },
  chatTime: {
    color: '#7a5fa0',
    fontSize: '0.75rem'
  },
  chatText: {
    color: '#e8d5a3',
    lineHeight: 1.5
  },
  chatForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  chatUsernameRow: {
    display: 'flex',
    gap: '8px'
  },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: '8px',
    color: '#e8d5a3',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    padding: '10px 14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    direction: 'rtl',
    width: '100%',
    boxSizing: 'border-box'
  },
  inputSmall: {
    width: '160px',
    flexShrink: 0
  },
  textarea: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: '8px',
    color: '#e8d5a3',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    padding: '10px 14px',
    outline: 'none',
    resize: 'none',
    direction: 'rtl',
    width: '100%',
    boxSizing: 'border-box',
    height: '72px'
  },
  charCount: (near) => ({
    fontSize: '0.75rem',
    color: near ? '#e74c3c' : '#7a5fa0',
    textAlign: 'left'
  }),
  btnPrimary: {
    background: 'linear-gradient(135deg, #d4af37 0%, #b8940a 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#1a0a2e',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: '0.95rem',
    padding: '10px 24px',
    transition: 'opacity 0.2s, transform 0.1s',
    alignSelf: 'flex-end'
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed'
  },
  emptyChat: {
    textAlign: 'center',
    color: '#7a5fa0',
    margin: 'auto',
    fontSize: '0.9rem'
  },
  // Bible
  bibleWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  bibleInputRow: {
    display: 'flex',
    gap: '8px'
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  chip: {
    background: 'rgba(212,175,55,0.12)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: '20px',
    color: '#d4af37',
    cursor: 'pointer',
    fontSize: '0.82rem',
    padding: '5px 14px',
    transition: 'background 0.2s'
  },
  answerBox: {
    background: 'rgba(61,26,110,0.35)',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: '12px',
    padding: '18px',
    lineHeight: 1.8
  },
  answerLabel: {
    color: '#d4af37',
    fontWeight: 700,
    marginBottom: '8px',
    fontSize: '0.88rem'
  },
  answerText: {
    color: '#e8d5a3',
    fontSize: '0.97rem'
  },
  sourceTag: {
    marginTop: '12px',
    color: '#9b7ec8',
    fontSize: '0.78rem',
    borderTop: '1px solid rgba(212,175,55,0.1)',
    paddingTop: '8px'
  },
  spinner: {
    display: 'inline-block',
    width: '22px',
    height: '22px',
    border: '3px solid rgba(212,175,55,0.2)',
    borderTop: '3px solid #d4af37',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  spinnerWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#9b7ec8',
    fontSize: '0.9rem'
  },
  // QA
  qaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  qaItem: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(212,175,55,0.15)',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  qaQuestion: {
    background: 'rgba(61,26,110,0.5)',
    padding: '12px 16px',
    color: '#d4af37',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.97rem',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  qaAnswer: {
    padding: '14px 16px',
    color: '#e8d5a3',
    lineHeight: 1.7,
    fontSize: '0.93rem',
    borderTop: '1px solid rgba(212,175,55,0.1)'
  },
  // Shabbat
  shabbatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px'
  },
  shabbatCard: {
    background: 'rgba(61,26,110,0.35)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center'
  },
  shabbatCity: {
    color: '#d4af37',
    fontWeight: 700,
    fontSize: '1.05rem',
    marginBottom: '10px'
  },
  shabbatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.88rem',
    marginBottom: '4px'
  },
  shabbatLabel: { color: '#9b7ec8' },
  shabbatTime: { color: '#e8d5a3', fontWeight: 600 },
  shabbatNote: {
    textAlign: 'center',
    color: '#7a5fa0',
    fontSize: '0.8rem',
    marginTop: '16px'
  },
  // Halacha
  halachaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  halachaCard: (active) => ({
    background: active
      ? 'rgba(61,26,110,0.6)'
      : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.12)'}`,
    borderRadius: '10px',
    padding: '16px',
    transition: 'all 0.2s'
  }),
  halachaTitle: {
    color: '#d4af37',
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  halachaBadge: {
    background: '#d4af37',
    color: '#1a0a2e',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '2px 10px'
  },
  halachaText: {
    color: '#e8d5a3',
    lineHeight: 1.75,
    fontSize: '0.93rem'
  },
  sectionTitle: {
    color: '#d4af37',
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '12px',
    borderBottom: '1px solid rgba(212,175,55,0.2)',
    paddingBottom: '8px'
  }
};

// ─── Keyframe injection ──────────────────────────────────────────────────────

if (typeof document !== 'undefined' && !document.getElementById('faith-keyframes')) {
  const style = document.createElement('style');
  style.id = 'faith-keyframes';
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .faith-input:focus { border-color: #d4af37 !important; }
    .faith-chip:hover { background: rgba(212,175,55,0.25) !important; }
    .faith-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
    .faith-btn:active:not(:disabled) { transform: translateY(0); }
    .faith-qa-q:hover { background: rgba(90,40,160,0.6) !important; }
    .faith-halacha:hover { border-color: rgba(212,175,55,0.3) !important; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 3px; }
  `;
  document.head.appendChild(style);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FaithChat() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const windowRef = useRef(null);

  useEffect(() => {
    const socket = io('/faith', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('history', (msgs) => {
      setMessages(Array.isArray(msgs) ? msgs.slice(-50) : []);
    });

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev.slice(-49), msg]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) { setError('לא ניתן לשלוח הודעה ריקה'); return; }
    if (!username.trim()) { setError('נא להזין שם משתמש'); return; }
    if (trimmed.length > 200) { setError('הודעה ארוכה מדי (מקסימום 200 תווים)'); return; }
    setError('');
    socketRef.current?.emit('message', {
      username: username.trim(),
      text: trimmed
    });
    setText('');
  }, [text, username]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  return (
    <div style={styles.chatWrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: connected ? '#2ecc71' : '#e74c3c',
          boxShadow: connected ? '0 0 8px #2ecc71' : 'none'
        }} />
        <span style={{ color: '#9b7ec8', fontSize: '0.82rem' }}>
          {connected ? 'מחובר לצ\'אט אמונה' : 'מנסה להתחבר...'}
        </span>
      </div>

      <div ref={windowRef} style={styles.chatWindow}>
        {messages.length === 0 ? (
          <div style={styles.emptyChat}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✡</div>
            <div>ברוכים הבאים לצ׳אט האמונה</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>שתפו מחשבות, שאלות, וחוויות רוחניות</div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={styles.chatMsg}>
              <div style={styles.chatMsgMeta}>
                <span style={styles.chatUsername}>{msg.username || 'אנונימי'}</span>
                <span style={styles.chatTime}>{formatTime(msg.timestamp)}</span>
              </div>
              <div style={styles.chatText}>{msg.text}</div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div style={{ color: '#e74c3c', fontSize: '0.83rem', textAlign: 'right' }}>{error}</div>
      )}

      <div style={styles.chatForm}>
        <div style={styles.chatUsernameRow}>
          <input
            className="faith-input"
            style={{ ...styles.input, ...styles.inputSmall }}
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
          />
          <textarea
            className="faith-input"
            style={{ ...styles.textarea, flex: 1, height: '44px' }}
            placeholder="כתוב הודעה... (מקסימום 200 תווים)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={styles.charCount(text.length > 180)}>{text.length}/200</span>
          <button
            className="faith-btn"
            style={{
              ...styles.btnPrimary,
              ...((!text.trim() || !username.trim()) ? styles.btnDisabled : {})
            }}
            onClick={send}
            disabled={!text.trim() || !username.trim()}
          >
            שלח ✉
          </button>
        </div>
      </div>
    </div>
  );
}

function BibleQA() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async (q) => {
    const trimmed = (q || question).trim();
    if (!trimmed) return;
    setLoading(true);
    setAnswer(null);
    setError('');
    try {
      const res = await fetch('/api/knowledge-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, topic: 'bible' })
      });
      if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
      const data = await res.json();
      setAnswer(data);
    } catch (err) {
      setError(`שגיאה: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (q) => {
    setQuestion(q);
    ask(q);
  };

  return (
    <div style={styles.bibleWrap}>
      <div style={styles.sectionTitle}>שאל שאלה על התנ"ך</div>

      <div style={styles.bibleInputRow}>
        <input
          className="faith-input"
          style={{ ...styles.input, flex: 1 }}
          placeholder='שאל שאלה על התנ"ך...'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
        />
        <button
          className="faith-btn"
          style={{
            ...styles.btnPrimary,
            ...(loading || !question.trim() ? styles.btnDisabled : {})
          }}
          onClick={() => ask()}
          disabled={loading || !question.trim()}
        >
          שאל
        </button>
      </div>

      <div>
        <div style={{ color: '#9b7ec8', fontSize: '0.82rem', marginBottom: '8px' }}>שאלות לדוגמה:</div>
        <div style={styles.chips}>
          {BIBLE_EXAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              className="faith-chip"
              style={styles.chip}
              onClick={() => handleChip(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={styles.spinnerWrap}>
          <div style={styles.spinner} />
          <span>מחפש תשובה בכתבי הקודש...</span>
        </div>
      )}

      {error && (
        <div style={{ color: '#e74c3c', fontSize: '0.88rem', padding: '10px' }}>{error}</div>
      )}

      {answer && !loading && (
        <div style={styles.answerBox}>
          <div style={styles.answerLabel}>תשובה:</div>
          <div style={styles.answerText}>
            {answer.answer || answer.text || answer.response || JSON.stringify(answer)}
          </div>
          {(answer.source || answer.reference) && (
            <div style={styles.sourceTag}>
              מקור: {answer.source || answer.reference}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RabbiQA() {
  const [open, setOpen] = useState(null);

  return (
    <div>
      <div style={styles.sectionTitle}>שאלות ותשובות — הרב עונה</div>
      <div style={styles.qaList}>
        {RABBI_QA.map((item, i) => (
          <div key={i} style={styles.qaItem}>
            <div
              className="faith-qa-q"
              style={styles.qaQuestion}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span>{item.q}</span>
              <span style={{ fontSize: '0.85rem', color: '#a88cc0' }}>{open === i ? '▲' : '▼'}</span>
            </div>
            {open === i && (
              <div style={styles.qaAnswer}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShabbatTimes() {
  const today = new Date();
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dayOfWeek = today.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + (dayOfWeek === 5 ? 0 : daysUntilFriday));

  return (
    <div>
      <div style={styles.sectionTitle}>
        זמני שבת — ערים מרכזיות בישראל
      </div>
      <div style={{ color: '#9b7ec8', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
        שבת פרשת השבוע |{' '}
        {nextFriday.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      <div style={styles.shabbatGrid}>
        {SHABBAT_TIMES.map((item, i) => (
          <div key={i} style={styles.shabbatCard}>
            <div style={styles.shabbatCity}>{item.city}</div>
            <div style={styles.shabbatRow}>
              <span style={styles.shabbatLabel}>כניסת שבת:</span>
              <span style={styles.shabbatTime}>{item.entry}</span>
            </div>
            <div style={styles.shabbatRow}>
              <span style={styles.shabbatLabel}>צאת שבת:</span>
              <span style={styles.shabbatTime}>{item.exit}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.shabbatNote}>
        * הזמנים הם קירוב לשבוע הנוכחי. לזמנים מדויקים עיין בלוח זמנים הלכתי.
      </div>
    </div>
  );
}

function DailyHalacha() {
  const dayOfWeek = new Date().getDay();
  const todayIndex = dayOfWeek % HALACHOT.length;

  return (
    <div>
      <div style={styles.sectionTitle}>הלכה יומית</div>
      <div style={{ color: '#9b7ec8', fontSize: '0.85rem', marginBottom: '16px' }}>
        לימוד הלכה קצר לכל יום — "תלמוד תורה כנגד כולם"
      </div>
      <div style={styles.halachaList}>
        {HALACHOT.map((item, i) => (
          <div
            key={i}
            className="faith-halacha"
            style={styles.halachaCard(i === todayIndex)}
          >
            <div style={styles.halachaTitle}>
              <span>{item.title}</span>
              {i === todayIndex && <span style={styles.halachaBadge}>היום</span>}
            </div>
            <div style={styles.halachaText}>{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'chat', label: "צ'אט אמונה" },
  { id: 'bible', label: 'שאל את התנ"ך' },
  { id: 'qa', label: 'שאלות ותשובות' },
  { id: 'shabbat', label: 'זמני שבת' },
  { id: 'halacha', label: 'הלכה יומית' }
];

export default function FaithPage() {
  const [activeTab, setActiveTab] = useState('chat');

  const renderTab = () => {
    switch (activeTab) {
      case 'chat': return <FaithChat />;
      case 'bible': return <BibleQA />;
      case 'qa': return <RabbiQA />;
      case 'shabbat': return <ShabbatTimes />;
      case 'halacha': return <DailyHalacha />;
      default: return null;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>✡ פינת האמונה ✡</h1>
        <div style={styles.headerSub}>תורה, תפילה ויהדות — במרחב אחד</div>
      </div>

      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={styles.tab(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {renderTab()}
      </div>
    </div>
  );
}
