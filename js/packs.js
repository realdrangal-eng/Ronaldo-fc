/* ============================================================
   RONALDO FC — pack opening sequence
   A tap-gated timeline: charge -> burst -> per-card reveal -> summary.
   ============================================================ */

/* ---------------- tiny WebAudio SFX (no asset files) ---------------- */
const SFX = (() => {
  let ctx = null, muted = false;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, gain, slideTo) {
    const c = ac(); if (!c || muted) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain || 0.15, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur + 0.05);
  }
  function noise(dur, gain) {
    const c = ac(); if (!c || muted) return;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = gain || 0.2;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  }
  return {
    toggle() { muted = !muted; return muted; },
    isMuted() { return muted; },
    charge() { tone(120, 1.0, 'sawtooth', 0.09, 900); },
    burst()  { noise(0.55, 0.28); tone(90, 0.4, 'square', 0.12, 40); },
    whoosh() { noise(0.3, 0.1); },
    flip()   { tone(520, 0.12, 'triangle', 0.12); },
    reveal(tier) {
      const roots = { rare:[392,494], epic:[440,554,659], icon:[523,659,784], legendary:[587,740,880,1109], ultimate:[659,831,988,1319,1568] };
      const set = roots[tier] || roots.rare;
      set.forEach((f, i) => setTimeout(() => tone(f, 0.9, 'triangle', 0.1), i * 70));
    },
    coin()   { tone(880, 0.08, 'square', 0.1); setTimeout(() => tone(1320, 0.1, 'square', 0.09), 70); },
    tap()    { tone(660, 0.05, 'sine', 0.06); }
  };
})();

/* ---------------- timeline helpers ---------------- */

const sleep = ms => new Promise(r => setTimeout(r, ms));

let tapResolvers = [];
let pendingTap = 0;
const TAP_BUFFER = 900;   /* ms a slightly-early tap stays valid */

/* A tap that lands while nothing is waiting is remembered briefly, so an
   eager player's tap isn't swallowed by an animation still finishing. */
function fireTap() {
  if (tapResolvers.length) {
    const rs = tapResolvers; tapResolvers = [];
    rs.forEach(r => r());
  } else {
    pendingTap = performance.now();
  }
}
/* Drop any buffered tap — used at points where an early tap should NOT
   carry over and skip the next beat. */
function clearTap() { pendingTap = 0; }

function onceTap() {
  if (pendingTap && performance.now() - pendingTap < TAP_BUFFER) {
    pendingTap = 0;
    return Promise.resolve();
  }
  pendingTap = 0;
  return new Promise(resolve => tapResolvers.push(resolve));
}
/* Waits `ms`, but a tap cuts it short — impatient players can skip the drama.
   Whichever side loses is unregistered: a leftover tap listener would eat the
   next tap and stall the sequence. */
function sleepOrTap(ms) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const i = tapResolvers.indexOf(finish);
      if (i >= 0) tapResolvers.splice(i, 1);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    tapResolvers.push(finish);
  });
}

function buzz(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

/* ---------------- DOM refs ---------------- */
const PS = {};
function initPackScene() {
  PS.scene   = document.getElementById('packScene');
  PS.pack    = document.getElementById('psPack');
  PS.packName= document.getElementById('psPackName');
  PS.packStg = document.getElementById('psPackStage');
  PS.cardStg = document.getElementById('psCardStage');
  PS.card    = document.getElementById('psCard');
  PS.cardImg = document.getElementById('psCardImg');
  PS.info    = document.getElementById('psInfo');
  PS.ovr     = document.getElementById('psOvr');
  PS.pos     = document.getElementById('psPos');
  PS.title   = document.getElementById('psTitle');
  PS.stats   = document.getElementById('psStats');
  PS.badge   = document.getElementById('psBadge');
  PS.hint    = document.getElementById('psHint');
  PS.flash   = document.getElementById('psFlash');
  PS.parts   = document.getElementById('psParticles');
  PS.conf    = document.getElementById('psConfetti');
  PS.counter = document.getElementById('psCounter');
  PS.walkout = document.getElementById('psWalkout');
  PS.summary = document.getElementById('psSummary');
  PS.sumGrid = document.getElementById('psSumGrid');
  PS.sumRew  = document.getElementById('psSumReward');
  PS.done    = document.getElementById('psDone');

  PS.scene.addEventListener('pointerdown', e => {
    if (e.target.closest('.ps-summary')) return;   /* summary has its own button */
    fireTap();
  });
}

/* ---------------- visual effects ---------------- */

/* '#rrggbb' + alpha -> 'rgba(r,g,b,a)'. CSS can't append alpha to a var(). */
function rgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function setTierVars(tier) {
  const t = TIERS[tier];
  const st = PS.scene.style;
  st.setProperty('--t1', t.c1);
  st.setProperty('--t2', t.c2);
  st.setProperty('--tglow', t.glow);
  st.setProperty('--ray1',   rgba(t.c1, 0.38));
  st.setProperty('--ray2',   rgba(t.c2, 0.30));
  st.setProperty('--bgGlow', rgba(t.glow, 0.22));
  st.setProperty('--beamA',  rgba(t.glow, 0.16));
  st.setProperty('--beamB',  rgba(t.glow, 0.07));
  st.setProperty('--halo',   rgba(t.glow, 0.38));
  st.setProperty('--ovrGlow',rgba(t.glow, 0.50));
  PS.scene.dataset.tier = tier;
}

function spawnParticles(n, tier) {
  PS.parts.innerHTML = '';
  const t = TIERS[tier] || TIERS.epic;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    const ang = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 330;
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    p.style.setProperty('--d', `${Math.random() * 0.22}s`);
    p.style.setProperty('--sz', `${3 + Math.random() * 7}px`);
    p.style.background = Math.random() > 0.5 ? t.c1 : t.c2;
    PS.parts.appendChild(p);
  }
  setTimeout(() => { PS.parts.innerHTML = ''; }, 1600);
}

function spawnConfetti(n, tier) {
  if (!n) return;
  PS.conf.innerHTML = '';
  const t = TIERS[tier];
  const palette = [t.c1, t.c2, '#ffffff', '#ffd76a'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.style.setProperty('--x', `${Math.random() * 100}%`);
    c.style.setProperty('--d', `${Math.random() * 1.6}s`);
    c.style.setProperty('--dur', `${2.2 + Math.random() * 2}s`);
    c.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    c.style.setProperty('--w', `${5 + Math.random() * 6}px`);
    c.style.setProperty('--h', `${9 + Math.random() * 12}px`);
    c.style.background = palette[i % palette.length];
    PS.conf.appendChild(c);
  }
  setTimeout(() => { PS.conf.innerHTML = ''; }, 5200);
}

function flash(strength) {
  PS.scene.style.setProperty('--fl', strength);
  PS.flash.classList.remove('is-on');
  void PS.flash.offsetWidth;
  PS.flash.classList.add('is-on');
}

function shake(cls) {
  PS.scene.classList.remove('shake-s', 'shake-m', 'shake-l');
  void PS.scene.offsetWidth;
  PS.scene.classList.add(cls);
  setTimeout(() => PS.scene.classList.remove(cls), 900);
}

function countUp(el, to, ms) {
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = to;
  }
  requestAnimationFrame(step);
}

/* ---------------- the sequence ---------------- */

let packBusy = false;
function isPackBusy() { return packBusy; }

async function openPack(pack) {
  if (packBusy) return;
  packBusy = true;

  const ids = rollPack(pack);
  const results = [];

  PS.scene.classList.add('is-open');
  PS.scene.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');

  /* ---- phase 1: the pack sits there, daring you ---- */
  PS.summary.classList.remove('is-on');
  PS.cardStg.className = 'ps-cardstage';
  PS.packStg.className = 'ps-packstage is-in';
  PS.packName.textContent = pack.name;
  PS.scene.style.setProperty('--p1', pack.color);
  PS.scene.style.setProperty('--p2', pack.color2);
  PS.scene.style.setProperty('--packGlow', rgba(pack.color2, 0.45));
  setTierVars('epic');
  PS.counter.textContent = '';
  PS.hint.textContent = 'TAP TO OPEN';
  PS.hint.classList.add('is-on');

  await sleep(450);
  await onceTap();

  /* ---- phase 2: charge ---- */
  PS.hint.classList.remove('is-on');
  PS.packStg.classList.add('is-charging');
  PS.scene.classList.add('is-charging');
  SFX.charge();
  buzz(30);
  await sleep(950);

  /* ---- phase 3: burst ---- */
  SFX.burst();
  buzz([0, 40, 30, 60]);
  flash(0.95);
  shake('shake-l');
  spawnParticles(90, 'epic');
  PS.packStg.classList.add('is-burst');
  await sleep(420);
  PS.packStg.className = 'ps-packstage';
  PS.scene.classList.remove('is-charging');

  /* ---- phase 4: reveal each card ---- */
  for (let i = 0; i < ids.length; i++) {
    const card = CARD_BY_ID[ids[i]];
    const grant = grantCard(card.id);
    results.push({ card, grant });
    PS.counter.textContent = ids.length > 1 ? `${i + 1} / ${ids.length}` : '';
    await revealCard(card, grant, i === ids.length - 1);
  }

  /* ---- phase 5: summary ---- */
  S.packsOpened++;
  saveState();
  await showSummary(pack, results);

  PS.scene.classList.remove('is-open');
  PS.scene.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  PS.counter.textContent = '';
  packBusy = false;
  refreshAll();
}

async function revealCard(card, grant, isLast) {
  const tier = TIERS[card.tier];
  setTierVars(card.tier);
  clearTap();

  /* reset the stage */
  PS.cardStg.className = 'ps-cardstage';
  PS.info.classList.remove('is-on');
  PS.walkout.classList.remove('is-on');
  PS.ovr.textContent = '0';
  PS.stats.innerHTML = '';
  PS.badge.className = 'ps-badge';
  void PS.cardStg.offsetWidth;

  /* card back flies in, face down */
  PS.cardImg.src = card.img;
  PS.cardStg.classList.add('is-in');
  SFX.whoosh();
  await sleep(520);

  /* suspense: rays wind up, the longer the better the card */
  PS.cardStg.classList.add('is-suspense');
  if (tier.walkout) {
    PS.cardStg.classList.add('is-walkout');
    PS.walkout.textContent = tier.label + '!';
    PS.walkout.classList.add('is-on');
    buzz(20);
  }
  PS.hint.textContent = 'TAP TO REVEAL';
  PS.hint.classList.add('is-on');
  await sleepOrTap(tier.suspense);
  PS.hint.classList.remove('is-on');

  /* the flip */
  SFX.flip();
  PS.cardStg.classList.add('is-flipping');
  await sleep(340);          /* halfway: front face becomes visible */
  flash(tier.walkout ? 0.85 : 0.5);
  shake(tier.walkout ? 'shake-m' : 'shake-s');
  spawnParticles(tier.walkout ? 70 : 34, card.tier);
  SFX.reveal(card.tier);
  buzz(tier.walkout ? [0, 60, 40, 90] : 40);
  await sleep(360);

  /* landed — show the numbers */
  PS.cardStg.classList.add('is-revealed');
  PS.walkout.classList.remove('is-on');
  spawnConfetti(tier.confetti, card.tier);

  PS.pos.textContent = card.pos;
  PS.title.textContent = card.title.toUpperCase();
  countUp(PS.ovr, card.ovr, 700);

  const order = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  PS.stats.innerHTML = order.map((k, i) =>
    `<div class="pstat" style="--i:${i}"><span>${k}</span><b>${card.stats[k]}</b></div>`
  ).join('');
  PS.info.classList.add('is-on');
  clearTap();

  if (grant.isNew) {
    PS.badge.textContent = 'NEW CARD!';
    PS.badge.className = 'ps-badge is-on is-new';
  } else if (grant.starred) {
    PS.badge.textContent = `TRAINED  ${'★'.repeat(grant.stars)}  +${grant.stars} OVR`;
    PS.badge.className = 'ps-badge is-on is-star';
    SFX.coin();
  } else {
    PS.badge.textContent = `MAX TRAINED  +${grant.coins.toLocaleString()} COINS`;
    PS.badge.className = 'ps-badge is-on is-dupe';
    SFX.coin();
  }

  await sleep(700);
  PS.hint.textContent = isLast ? 'TAP TO FINISH' : 'TAP FOR NEXT CARD';
  PS.hint.classList.add('is-on');
  await onceTap();
  SFX.tap();
  PS.hint.classList.remove('is-on');

  /* card exits stage left */
  PS.cardStg.classList.add('is-out');
  PS.info.classList.remove('is-on');
  await sleep(340);
}

function showSummary(pack, results) {
  return new Promise(resolve => {
    const best = results.reduce((a, b) => (b.card.ovr > a.card.ovr ? b : a));
    PS.sumGrid.innerHTML = results.map(r => `
      <div class="sum-card tier-${r.card.tier}">
        <img src="${r.card.img}" alt="${r.card.ovr} Ronaldo">
        <div class="sum-ovr">${r.card.ovr}</div>
        <div class="sum-tag">${r.grant.isNew ? 'NEW' : (r.grant.starred ? '★ +1' : 'DUPE')}</div>
      </div>`).join('');

    const coins = results.reduce((n, r) => n + (r.grant.coins || 0), 0);
    const news = results.filter(r => r.grant.isNew).length;
    PS.sumRew.innerHTML =
      `<span>BEST PULL <b>${best.card.ovr} ${TIERS[best.card.tier].label}</b></span>` +
      (news ? `<span>NEW CARDS <b>${news}</b></span>` : '') +
      (coins ? `<span>DUPE COINS <b>+${coins.toLocaleString()}</b></span>` : '');

    PS.summary.classList.add('is-on');
    const done = () => { PS.done.removeEventListener('click', done); PS.summary.classList.remove('is-on'); SFX.tap(); resolve(); };
    PS.done.addEventListener('click', done);
  });
}
