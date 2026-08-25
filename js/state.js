/* ============================================================
   RONALDO FC — persistent state
   ============================================================ */

const SAVE_KEY = 'ronaldofc.save.v1';

const DEFAULT_STATE = {
  coins: 4000,
  gems: 60,
  packsOpened: 0,
  goals: 0,
  matchesPlayed: 0,
  /* collection: { cardId: { count, stars } } */
  collection: {},
  lastDaily: 0,
  dailyStreak: 0
};

let S = null;

function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { raw = null; }
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      S = Object.assign({}, DEFAULT_STATE, parsed);
      S.collection = parsed.collection || {};
      return S;
    } catch (e) { /* corrupt save — fall through to a fresh one */ }
  }
  S = JSON.parse(JSON.stringify(DEFAULT_STATE));
  return S;
}

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* private mode: play on, don't persist */ }
}

function resetState() {
  S = JSON.parse(JSON.stringify(DEFAULT_STATE));
  saveState();
}

/* ---------------- currency ---------------- */

function canAfford(cost) {
  if (cost.coins && S.coins < cost.coins) return false;
  if (cost.gems && S.gems < cost.gems) return false;
  return true;
}

function spend(cost) {
  if (!canAfford(cost)) return false;
  if (cost.coins) S.coins -= cost.coins;
  if (cost.gems) S.gems -= cost.gems;
  saveState();
  return true;
}

function addCoins(n) { S.coins += n; saveState(); }
function addGems(n)  { S.gems  += n; saveState(); }

/* ---------------- collection ---------------- */

function owned(id) { return !!S.collection[id]; }
function ownedCount() { return Object.keys(S.collection).length; }

function entryFor(id) { return S.collection[id] || null; }

/* Effective overall including training stars. */
function effectiveOvr(id) {
  const base = CARD_BY_ID[id].ovr;
  const e = S.collection[id];
  return base + (e ? e.stars : 0);
}

/* Returns { isNew, stars, maxed, coins } describing what the pull did. */
function grantCard(id) {
  const card = CARD_BY_ID[id];
  let e = S.collection[id];
  if (!e) {
    S.collection[id] = { count: 1, stars: 0 };
    saveState();
    return { isNew: true, stars: 0, maxed: false, coins: 0 };
  }
  e.count++;
  let coins = 0, starred = false;
  if (e.stars < MAX_STARS) { e.stars++; starred = true; }
  else { coins = DUPE_COINS[card.tier] || 500; S.coins += coins; }
  saveState();
  return { isNew: false, stars: e.stars, starred, maxed: e.stars >= MAX_STARS, coins };
}

/* Best card currently owned, by effective overall. */
function bestCard() {
  let best = null, bestOvr = -1;
  for (const id of Object.keys(S.collection)) {
    const o = effectiveOvr(id);
    if (o > bestOvr) { bestOvr = o; best = CARD_BY_ID[id]; }
  }
  return best;
}

/* Club level: a soft progression number from collection strength. */
function clubLevel() {
  let pts = 0;
  for (const id of Object.keys(S.collection)) pts += effectiveOvr(id);
  return Math.max(1, Math.floor(pts / 120) + 1);
}

/* ---------------- pack pulling ---------------- */

function weightedPick(odds) {
  let total = 0;
  for (const k in odds) total += odds[k];
  let r = Math.random() * total;
  for (const k in odds) {
    r -= odds[k];
    if (r <= 0) return k;
  }
  return Object.keys(odds)[0];
}

/* Pull `pulls` cards, then enforce the pack's guarantee by upgrading
   the weakest pull if nothing met the floor. */
function rollPack(pack) {
  const ids = [];
  for (let i = 0; i < pack.pulls; i++) ids.push(weightedPick(pack.odds));

  if (pack.guarantee) {
    const meets = ids.some(id => CARD_BY_ID[id].ovr >= pack.guarantee);
    if (!meets) {
      const eligible = Object.keys(pack.odds).filter(id => CARD_BY_ID[id].ovr >= pack.guarantee);
      if (eligible.length) {
        const sub = {};
        for (const id of eligible) sub[id] = pack.odds[id];
        /* replace the weakest pull so the guarantee is felt, not wasted */
        let worstIdx = 0;
        for (let i = 1; i < ids.length; i++) {
          if (CARD_BY_ID[ids[i]].ovr < CARD_BY_ID[ids[worstIdx]].ovr) worstIdx = i;
        }
        ids[worstIdx] = weightedPick(sub);
      }
    }
  }

  /* Best card last — the reveal order should build, like FC Mobile. */
  ids.sort((a, b) => CARD_BY_ID[a].ovr - CARD_BY_ID[b].ovr);
  return ids;
}

/* ---------------- daily bonus ---------------- */

const DAY = 24 * 60 * 60 * 1000;

function dailyReady() {
  return Date.now() - (S.lastDaily || 0) >= DAY;
}

function claimDaily() {
  if (!dailyReady()) return null;
  const sinceLast = Date.now() - (S.lastDaily || 0);
  S.dailyStreak = sinceLast < 2 * DAY ? (S.dailyStreak || 0) + 1 : 1;
  const streak = Math.min(S.dailyStreak, 7);
  const coins = 1500 + (streak - 1) * 500;
  const gems = streak >= 7 ? 50 : (streak >= 4 ? 15 : 5);
  S.coins += coins;
  S.gems += gems;
  S.lastDaily = Date.now();
  saveState();
  return { coins, gems, streak };
}

function dailyIn() {
  const ms = DAY - (Date.now() - (S.lastDaily || 0));
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
