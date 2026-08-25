/* ============================================================
   RONALDO FC — finishing drill
   Stop the marker in the green zone. The green zone grows with
   your best Ronaldo's shooting, so better cards genuinely help.
   ============================================================ */

const MATCH = {
  phase: 'idle',            /* idle | aiming | result | done */
  shot: 0, shots: 5, goals: 0, earned: 0,
  raf: null, pos: 0, dir: 1, speed: 1.15,
  perfect: 8, ok: 21, cooldown: false,
  sho: 90, ovr: 90
};

function renderMatch() {
  const wrap = document.getElementById('matchWrap');
  const best = bestCard();

  if (!best) {
    wrap.innerHTML = `
      <div class="mt-empty">
        <p>You need at least one Ronaldo in the club before you can shoot.</p>
        <button class="btn btn-primary" data-go="store">GO TO THE PACK STORE</button>
      </div>`;
    return;
  }

  const ovr = effectiveOvr(best.id);
  const sho = Math.min(120, best.stats.SHO + (ovr - best.ovr));
  MATCH.ovr = ovr; MATCH.sho = sho;

  wrap.innerHTML = `
    <div class="mt-striker">
      <img src="${best.img}" alt="${ovr} rated Ronaldo card">
      <div class="mt-striker-i">
        <div class="mt-striker-n">${ovr} &middot; ${escapeHtml(best.title.toUpperCase())}</div>
        <div class="mt-striker-s">SHOOTING <b>${sho}</b> &mdash; higher shooting, wider green zone</div>
      </div>
    </div>

    <div class="mt-board">
      <div class="mt-line"><span id="mtShot">SHOT 1 / ${MATCH.shots}</span><span id="mtGoals">GOALS 0</span></div>
      <div class="mt-pitch">
        <div class="mt-goal">
          <div class="mt-net"></div>
          <div class="mt-keeper" id="mtKeeper"></div>
          <div class="mt-shout" id="mtShout">SIUUU!</div>
        </div>
        <div class="mt-grass"></div>
        <div class="mt-ball" id="mtBall"></div>
      </div>
      <div class="mt-bar" id="mtBar">
        <div class="mt-zone mt-zone-ok" id="mtZoneOk"></div>
        <div class="mt-zone mt-zone-perfect" id="mtZonePerfect"></div>
        <div class="mt-marker" id="mtMarker"></div>
      </div>
      <button class="btn btn-primary btn-wide" id="mtBtn">SHOOT</button>
      <div class="mt-result" id="mtResult">Tap SHOOT to start the drill.</div>
    </div>`;

  MATCH.phase = 'idle';
  MATCH.shot = 0; MATCH.goals = 0; MATCH.earned = 0; MATCH.cooldown = false;
  cancelAnimationFrame(MATCH.raf);
  sizeZones(sho);

  /* one handler, dispatched on phase — no stacked listeners */
  document.getElementById('mtBtn').addEventListener('click', onMatchButton);
}

function onMatchButton() {
  if (MATCH.cooldown) return;
  switch (MATCH.phase) {
    case 'idle':   startDrill(); break;
    case 'aiming': takeShot();   break;
    case 'result': (MATCH.shot >= MATCH.shots) ? endDrill() : nextShot(); break;
    case 'done':   renderMatch(); break;
  }
}

function sizeZones(sho) {
  /* perfect zone ~6% at SHO 88, ~16% at SHO 120; ok zone is 2.6x wider */
  const perfect = Math.max(6, Math.min(16, 6 + (sho - 88) * 0.31));
  const ok = perfect * 2.6;
  const zp = document.getElementById('mtZonePerfect');
  const zo = document.getElementById('mtZoneOk');
  if (!zp) return;
  zp.style.left = (50 - perfect / 2) + '%'; zp.style.width = perfect + '%';
  zo.style.left = (50 - ok / 2) + '%';      zo.style.width = ok + '%';
  MATCH.perfect = perfect; MATCH.ok = ok;
}

function startDrill() {
  MATCH.shot = 0; MATCH.goals = 0; MATCH.earned = 0;
  document.getElementById('mtResult').textContent = 'Stop the marker in the green.';
  nextShot();
}

function nextShot() {
  MATCH.shot++;
  MATCH.phase = 'aiming';
  MATCH.pos = Math.random() * 100;
  MATCH.dir = Math.random() > 0.5 ? 1 : -1;
  MATCH.speed = 0.95 + MATCH.shot * 0.16;   /* it gets meaner as you go */

  document.getElementById('mtShot').textContent = `SHOT ${MATCH.shot} / ${MATCH.shots}`;
  document.getElementById('mtBtn').textContent = 'SHOOT';

  const ball = document.getElementById('mtBall');
  ball.className = 'mt-ball';
  ball.style.removeProperty('--aim');

  const marker = document.getElementById('mtMarker');
  const keeper = document.getElementById('mtKeeper');
  keeper.className = 'mt-keeper';

  cancelAnimationFrame(MATCH.raf);
  let t = 0;
  const loop = () => {
    MATCH.pos += MATCH.dir * MATCH.speed;
    if (MATCH.pos >= 100) { MATCH.pos = 100; MATCH.dir = -1; }
    if (MATCH.pos <= 0)   { MATCH.pos = 0;   MATCH.dir = 1;  }
    marker.style.left = MATCH.pos + '%';
    t += 0.03;
    keeper.style.left = (50 + Math.sin(t) * 22) + '%';
    MATCH.raf = requestAnimationFrame(loop);
  };
  MATCH.raf = requestAnimationFrame(loop);
}

function takeShot() {
  MATCH.phase = 'result';
  MATCH.cooldown = true;
  cancelAnimationFrame(MATCH.raf);

  const dist = Math.abs(MATCH.pos - 50);
  const isPerfect = dist <= MATCH.perfect / 2;
  const isGoal = dist <= MATCH.ok / 2;

  const ball   = document.getElementById('mtBall');
  const keeper = document.getElementById('mtKeeper');
  const shout  = document.getElementById('mtShout');
  const res    = document.getElementById('mtResult');

  ball.style.setProperty('--aim', (50 + (MATCH.pos - 50) * 0.85) + '%');

  if (isGoal) {
    MATCH.goals++;
    S.goals++;
    const coins = (isPerfect ? 900 : 450) + Math.round(MATCH.ovr * 4);
    MATCH.earned += coins;
    addCoins(coins);
    ball.classList.add('is-goal');
    keeper.classList.add('is-dive');
    shout.textContent = isPerfect ? 'SIUUU!' : 'GOAL!';
    shout.classList.add('is-on');
    SFX.reveal(isPerfect ? 'legendary' : 'epic');
    if (navigator.vibrate) { try { navigator.vibrate(isPerfect ? [0, 50, 40, 80] : 40); } catch (e) {} }
    res.innerHTML = isPerfect
      ? `<b class="ok">TOP CORNER.</b> +${coins.toLocaleString()} coins`
      : `<b class="ok">GOAL.</b> +${coins.toLocaleString()} coins`;
  } else {
    ball.classList.add('is-miss');
    keeper.classList.add('is-save');
    SFX.whoosh();
    res.innerHTML = dist < 34
      ? `<b class="bad">OFF THE POST.</b> Inches.`
      : `<b class="bad">WIDE.</b> Even he misses sometimes.`;
  }

  document.getElementById('mtGoals').textContent = `GOALS ${MATCH.goals}`;
  document.getElementById('mtBtn').textContent = MATCH.shot >= MATCH.shots ? 'FINISH' : 'NEXT SHOT';
  saveState();
  refreshCurrency();

  setTimeout(() => {
    MATCH.cooldown = false;
    shout.classList.remove('is-on');
  }, 850);
}

function endDrill() {
  MATCH.phase = 'done';
  S.matchesPlayed++;
  let bonus = '';
  if (MATCH.goals === MATCH.shots) {
    addGems(25);
    bonus = ' Perfect drill bonus: <b>+25 gems</b>.';
  }
  saveState();
  document.getElementById('mtResult').innerHTML =
    `Drill over: <b>${MATCH.goals}/${MATCH.shots}</b> scored for <b>+${MATCH.earned.toLocaleString()}</b> coins.${bonus}`;
  document.getElementById('mtBtn').textContent = 'DRILL AGAIN';
  refreshAll();
}
