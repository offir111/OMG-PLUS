/** מכסת שאלות AI מוביל — פתוח ללא הגבלה (ללא חסימה/תשלום). */

export const AI_LED_PACK_SIZE = 5;
export const AI_LED_BLOCK_MS = 0;

const LS_PREFIX = 'omg_ai_led_quota:';

function normUser(u) {
  return String(u || '').trim().toLowerCase();
}

function defaultQuota() {
  return { usedCount: 0, paidPacks: 0, blockFreeUntilMs: 0 };
}

/** קריאה + פקיעת חלון חסימה (אז איפוס שימוש חינמי) */
export function readAiLedQuota(username) {
  const u = normUser(username);
  if (!u) return defaultQuota();
  try {
    const raw = localStorage.getItem(LS_PREFIX + u);
    if (!raw) return defaultQuota();
    let q = { ...defaultQuota(), ...JSON.parse(raw) };
    q.usedCount = Math.max(0, Number(q.usedCount) || 0);
    q.paidPacks = Math.max(0, Number(q.paidPacks) || 0);
    q.blockFreeUntilMs = Math.max(0, Number(q.blockFreeUntilMs) || 0);
    if (q.blockFreeUntilMs > 0 && Date.now() >= q.blockFreeUntilMs) {
      q = { usedCount: 0, paidPacks: q.paidPacks, blockFreeUntilMs: 0 };
      localStorage.setItem(LS_PREFIX + u, JSON.stringify(q));
    }
    return q;
  } catch {
    return defaultQuota();
  }
}

export function writeAiLedQuota(username, next) {
  const u = normUser(username);
  if (!u) return;
  const q = {
    usedCount: Math.max(0, Number(next.usedCount) || 0),
    paidPacks: Math.max(0, Number(next.paidPacks) || 0),
    blockFreeUntilMs: Math.max(0, Number(next.blockFreeUntilMs) || 0),
  };
  localStorage.setItem(LS_PREFIX + u, JSON.stringify(q));
}

export function aiLedEffectiveLimit() {
  return Number.POSITIVE_INFINITY;
}

/** אחרי תשובת AI מוצגת — מעלה מונה בלבד (ללא חסימה). */
export function recordAiLedReplyConsumed(username, prevUsed, sessionPaidPacks) {
  const u = normUser(username);
  const newUsed = Math.max(0, Number(prevUsed) || 0) + 1;
  if (!u) return newUsed;
  const cur = readAiLedQuota(u);
  const paid = Math.max(cur.paidPacks, Number(sessionPaidPacks) || 0);
  writeAiLedQuota(u, {
    usedCount: newUsed,
    paidPacks: paid,
    blockFreeUntilMs: 0,
  });
  return newUsed;
}

/** סנכרון לפני יציאה משיחה — שומר מונה וחבילות, שומר חסימת 24ש׳ אם הוגדרה */
export function persistAiLedSessionSnapshot(username, usedCount, sessionPaidPacks) {
  const u = normUser(username);
  if (!u) return;
  const cur = readAiLedQuota(u);
  writeAiLedQuota(u, {
    usedCount: Math.max(0, Number(usedCount) || 0),
    paidPacks: Math.max(cur.paidPacks, Number(sessionPaidPacks) || 0),
    blockFreeUntilMs: cur.blockFreeUntilMs,
  });
}

export function incrementStoredPaidPacks(username) {
  const u = normUser(username);
  if (!u) return 0;
  const cur = readAiLedQuota(u);
  const paidPacks = cur.paidPacks;
  writeAiLedQuota(u, {
    usedCount: cur.usedCount,
    paidPacks,
    blockFreeUntilMs: 0,
  });
  return paidPacks;
}
