/* ============================================================
   RONALDO FC — screens, rendering, boot
   ============================================================ */

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function fmt(n) { return n.toLocaleString('en-US'); }

/* ---------------- navigation ---------------- */

function go(name) {
  document.querySelectorAll('.screen').forEach(s =>
    s.classList.toggle('is-active', s.dataset.screen === name));
  document.querySelectorAll('.nav-b').forEach(b =>
    b.classList.toggle('is-active', b.dataset.go === name));
  document.querySelector('.screens').scrollTop = 0;
  if (name === 'match') renderMatch();
  if (name === 'collection') renderCollection();
  if (name === 'store') renderStore();
}

/* ---------------- toast ---------------- */

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
}

/* ---------------- currency / header ---------------- */

function refreshCurrency() {
  document.getElementById('coinVal').textContent = fmt(S.coins);
  document.getElementById('gemVal').textContent  = fmt(S.gems);
  document.getElementById('tbSub').textContent   = 'Club Level ' + clubLevel();
}

/* ---------------- home ---------------- */

function renderHome() {
  const best = bestCard();
  const hero = document.getElementById('heroCard');
  const meta = document.getElementById('heroMeta');

  if (best) {
    const ovr = effectiveOvr(best.id);
    const e = entryFor(best.id);
    hero.className = 'hero-card tier-' + best.tier;
    hero.innerHTML = `<img src="${best.img}" alt="${ovr} rated Ronaldo card">`;
    meta.innerHTML = `
      <div class="hm-ovr">${ovr}<span>OVR</span></div>
      <div class="hm-t">${escapeHtml(best.title.toUpperCase())}</div>
      <div class="hm-c">${escapeHtml(best.club)} &middot; ${TIERS[best.tier].label}</div>
      <div class="hm-stars">${starRow(e.stars)}</div>
      <div class="hm-note">&ldquo;${escapeHtml(best.note)}&rdquo;</div>`;
  } else {
    hero.className = 'hero-card is-empty';
    hero.innerHTML = `<div class="hero-empty"><span>CR</span><b>7</b><p>NO CARDS YET</p></div>`;
    meta.innerHTML = `<div class="hm-t">Your club is empty</div>
      <div class="hm-c">Open a pack to sign your first Ronaldo.</div>`;
  }

  document.getElementById('statOwned').textContent = ownedCount();
  document.getElementById('statTotal').textContent = CARDS.length;
  document.getElementById('statPacks').textContent = S.packsOpened;
  document.getElementById('statGoals').textContent = S.goals;

  renderDaily();
}

function starRow(stars) {
  let out = '';
  for (let i = 0; i < MAX_STARS; i++) out += `<i class="${i < stars ? 'on' : ''}">★</i>`;
  return out;
}

function renderDaily() {
  const btn = document.getElementById('dailyBtn');
  const txt = document.getElementById('dailyText');
  const card = document.getElementById('dailyCard');
  if (dailyReady()) {
    const streak = Math.min((S.dailyStreak || 0) + 1, 7);
    txt.textContent = `Day ${streak} reward ready to claim`;
    btn.textContent = 'CLAIM';
    btn.disabled = false;
    card.classList.add('is-ready');
  } else {
    txt.textContent = `Next bonus in ${dailyIn()}`;
    btn.textContent = 'CLAIMED';
    btn.disabled = true;
    card.classList.remove('is-ready');
  }
}

/* ---------------- store ---------------- */

function renderStore() {
  const list = document.getElementById('packList');
  list.innerHTML = PACKS.map(p => {
    const cost = p.cost.gems ? `${fmt(p.cost.gems)} <i class="ic ic-gem"></i>` : `${fmt(p.cost.coins)} <i class="ic ic-coin"></i>`;
    const afford = canAfford(p.cost);
    const top = topOdds(p);
    return `
      <article class="packcard ${p.premium ? 'is-premium' : ''} ${afford ? '' : 'is-locked'}"
               style="--p1:${p.color};--p2:${p.color2}">
        <div class="pc-art">
          <div class="pc-shine"></div>
          <div class="pc-crest"><span>CR</span><b>7</b></div>
          <div class="pc-pulls">${p.pulls} CARD${p.pulls > 1 ? 'S' : ''}</div>
        </div>
        <div class="pc-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="pc-tag">${escapeHtml(p.tagline)}</p>
          <div class="pc-odds">
            <span class="pc-guar">GUARANTEED ${p.guarantee}+</span>
            <span class="pc-top">${escapeHtml(top)}</span>
          </div>
          <button class="btn btn-buy" data-pack="${p.id}" ${afford ? '' : 'disabled'}>
            ${afford ? cost : 'NOT ENOUGH'}
          </button>
        </div>
      </article>`;
  }).join('');
}

/* Human-readable line for the best card's chance in a pack. */
function topOdds(p) {
  let total = 0;
  for (const k in p.odds) total += p.odds[k];
  const best = Object.keys(p.odds).sort((a, b) => CARD_BY_ID[b].ovr - CARD_BY_ID[a].ovr)[0];
  const pct = (p.odds[best] / total) * 100;
  const shown = pct < 0.1 ? pct.toFixed(3) : (pct < 1 ? pct.toFixed(2) : pct.toFixed(1));
  return `${CARD_BY_ID[best].ovr} SIUUU  ${shown}%`;
}

/* ---------------- collection ---------------- */

function renderCollection() {
  const grid = document.getElementById('cardGrid');
  grid.innerHTML = CARDS.map(c => {
    const e = entryFor(c.id);
    if (!e) {
      return `
        <div class="gcard is-locked">
          <div class="gc-art"><img src="${c.img}" alt="Locked Ronaldo card"></div>
          <div class="gc-lock">?</div>
          <div class="gc-foot"><b>${c.ovr}</b><span>LOCKED</span></div>
        </div>`;
    }
    const ovr = effectiveOvr(c.id);
    return `
      <div class="gcard tier-${c.tier}" data-card="${c.id}">
        <div class="gc-art"><img src="${c.img}" alt="${ovr} rated Ronaldo card"></div>
        ${e.count > 1 ? `<div class="gc-count">x${e.count}</div>` : ''}
        <div class="gc-foot">
          <b>${ovr}</b>
          <span>${escapeHtml(c.title)}</span>
          <div class="gc-stars">${starRow(e.stars)}</div>
        </div>
      </div>`;
  }).join('');

  const pct = Math.round((ownedCount() / CARDS.length) * 100);
  document.getElementById('collProgFill').style.width = pct + '%';
  document.getElementById('collTxt').textContent = `${ownedCount()} / ${CARDS.length}  (${pct}%)`;
}

/* ---------------- global refresh ---------------- */

function refreshAll() {
  refreshCurrency();
  renderHome();
  const active = document.querySelector('.screen.is-active');
  if (!active) return;
  if (active.dataset.screen === 'store') renderStore();
  if (active.dataset.screen === 'collection') renderCollection();
}

/* ---------------- boot ---------------- */

function boot() {
  loadState();
  initPackScene();
  refreshCurrency();
  renderHome();
  renderStore();

  /* nav + any [data-go] button anywhere */
  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-go]');
    if (nav) { go(nav.dataset.go); return; }

    const buy = e.target.closest('[data-pack]');
    if (buy && !buy.disabled) {
      if (isPackBusy()) return;                    /* never charge for an open we'd drop */
      const pack = PACK_BY_ID[buy.dataset.pack];
      if (!canAfford(pack.cost)) { toast('Not enough — go score some goals.'); return; }
      spend(pack.cost);
      refreshCurrency();
      openPack(pack);
    }
  });

  document.getElementById('soundBtn').addEventListener('click', e => {
    const muted = SFX.toggle();
    e.currentTarget.classList.toggle('is-muted', muted);
    e.currentTarget.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    if (!muted) SFX.tap();
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Wipe your club and start again from zero? This cannot be undone.')) return;
    resetState();
    go('home');
    refreshAll();
    toast('Club reset. Time to sign him all over again.');
  });

  document.getElementById('dailyBtn').addEventListener('click', () => {
    const r = claimDaily();
    if (!r) return;
    SFX.coin();
    toast(`Day ${r.streak}: +${fmt(r.coins)} coins, +${r.gems} gems`);
    refreshAll();
  });

  /* keep the daily timer honest while the tab stays open */
  setInterval(renderDaily, 60000);

  /* stop iOS double-tap zoom killing the tap-to-reveal feel */
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
}

/* Works whether this script runs during parsing or after the DOM is ready. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
