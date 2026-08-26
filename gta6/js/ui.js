/* ============================================================
   GTA VI — input, HUD, minimap and menus
   ============================================================ */

const Input = {
  axes: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  aimActive: false,
  fire: false,
  enter: false,
  brake: false,
  keys: Object.create(null)
};

const UI = {
  game: null,
  el: {},
  mini: null,
  miniCtx: null,
  touch: false,
  stick: { id: null, cx: 0, cy: 0, dx: 0, dy: 0 },

  init(game) {
    this.game = game;
    const id = s => document.getElementById(s);
    this.el = {
      hud: id('hud'),
      cash: id('cash'),
      stars: id('stars'),
      health: id('healthFill'),
      armor: id('armorFill'),
      armorWrap: id('armorWrap'),
      speed: id('speed'),
      speedWrap: id('speedWrap'),
      mission: id('mission'),
      missionTitle: id('missionTitle'),
      missionDesc: id('missionDesc'),
      missionTimer: id('missionTimer'),
      toast: id('toast'),
      title: id('title'),
      wasted: id('wasted'),
      wastedStats: id('wastedStats'),
      pause: id('pause'),
      touchUi: id('touchUi'),
      stickBase: id('stickBase'),
      stickNub: id('stickNub')
    };
    this.mini = id('minimap');
    this.miniCtx = this.mini.getContext('2d');

    this.bindKeys();
    this.bindMouse();
    this.bindTouch();
    this.bindButtons();

    // Touch devices get the on-screen pad.
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (this.touch) this.el.touchUi.classList.add('on');
  },

  bindKeys() {
    const down = e => {
      Input.keys[e.code] = true;
      if (e.code === 'KeyF' || e.code === 'KeyE') Input.enter = true;
      if (e.code === 'Space') { Input.brake = true; e.preventDefault(); }
      if (e.code === 'Escape') this.togglePause();
      if (e.code === 'Enter' && this.game.state === 'title') this.start();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.readKeys();
    };
    const up = e => {
      Input.keys[e.code] = false;
      if (e.code === 'Space') Input.brake = false;
      this.readKeys();
    };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', () => { Input.keys = Object.create(null); this.readKeys(); });
  },

  readKeys() {
    if (this.touch && this.stick.id !== null) return;
    const k = Input.keys;
    let x = 0, y = 0;
    if (k.KeyA || k.ArrowLeft) x -= 1;
    if (k.KeyD || k.ArrowRight) x += 1;
    if (k.KeyW || k.ArrowUp) y -= 1;
    if (k.KeyS || k.ArrowDown) y += 1;
    Input.axes.x = x;
    Input.axes.y = y;
  },

  bindMouse() {
    const canvas = this.game.canvas;
    const toWorld = e => {
      const r = canvas.getBoundingClientRect();
      const g = this.game;
      return {
        x: g.camX + (e.clientX - r.left - r.width / 2) / g.scale,
        y: g.camY + (e.clientY - r.top - r.height / 2) / g.scale
      };
    };
    canvas.addEventListener('mousemove', e => {
      if (this.touch) return;
      const w = toWorld(e);
      Input.aim.x = w.x;
      Input.aim.y = w.y;
      Input.aimActive = this.game.player ? this.game.player.onFoot : false;
    });
    canvas.addEventListener('mousedown', e => {
      if (this.touch) return;
      if (e.button === 0) Input.fire = true;
    });
    addEventListener('mouseup', e => { if (e.button === 0) Input.fire = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  },

  bindTouch() {
    const base = this.el.stickBase;
    const setNub = (dx, dy) => {
      this.el.stickNub.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    base.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      const r = base.getBoundingClientRect();
      this.stick.id = t.identifier;
      this.stick.cx = r.left + r.width / 2;
      this.stick.cy = r.top + r.height / 2;
      e.preventDefault();
    }, { passive: false });

    const move = e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== this.stick.id) continue;
        const dx = t.clientX - this.stick.cx;
        const dy = t.clientY - this.stick.cy;
        const max = 46;
        const d = Math.hypot(dx, dy) || 1;
        const cd = Math.min(d, max);
        const nx = (dx / d) * cd, ny = (dy / d) * cd;
        setNub(nx, ny);
        Input.axes.x = nx / max;
        Input.axes.y = ny / max;
        e.preventDefault();
      }
    };
    const end = e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== this.stick.id) continue;
        this.stick.id = null;
        setNub(0, 0);
        Input.axes.x = 0;
        Input.axes.y = 0;
      }
    };
    addEventListener('touchmove', move, { passive: false });
    addEventListener('touchend', end);
    addEventListener('touchcancel', end);

    const hold = (elId, on, off) => {
      const b = document.getElementById(elId);
      if (!b) return;
      const start = e => { on(); e.preventDefault(); };
      const stop = e => { if (off) off(); e.preventDefault(); };
      b.addEventListener('touchstart', start, { passive: false });
      b.addEventListener('touchend', stop);
      b.addEventListener('touchcancel', stop);
      b.addEventListener('mousedown', start);
      b.addEventListener('mouseup', stop);
    };
    hold('btnFire', () => { Input.fire = true; }, () => { Input.fire = false; });
    hold('btnBrake', () => { Input.brake = true; }, () => { Input.brake = false; });
    hold('btnEnter', () => { Input.enter = true; });
  },

  bindButtons() {
    const on = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    };
    on('btnPlay', () => this.start());
    on('btnRespawn', () => { this.el.wasted.classList.remove('on'); this.game.respawn(); });
    on('btnResume', () => this.togglePause());
    on('btnPause', () => this.togglePause());
    on('btnQuit', () => {
      this.el.pause.classList.remove('on');
      this.el.title.classList.add('on');
      this.el.hud.classList.remove('on');
      this.game.state = 'title';
    });
  },

  start() {
    this.el.title.classList.remove('on');
    this.el.hud.classList.add('on');
    this.game.reset();
    this.game.state = 'play';
    this.game.last = performance.now();
    this.game.say('Find the yellow marker to start a job', 4200);
  },

  togglePause() {
    const g = this.game;
    if (g.state === 'play') {
      g.state = 'paused';
      this.el.pause.classList.add('on');
    } else if (g.state === 'paused') {
      g.state = 'play';
      g.last = performance.now();
      this.el.pause.classList.remove('on');
    }
  },

  showWasted() {
    const g = this.game;
    this.el.wastedStats.textContent =
      `${fmtMoney(g.player.cash)} in hand · ${g.stats.kills} takedowns`;
    this.el.wasted.classList.add('on');
  },

  /* ----------------------------------------------------------- per-frame -- */

  sync() {
    const g = this.game;
    if (g.state === 'title') return;
    const p = g.player;

    this.el.cash.textContent = fmtMoney(p.cash);

    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < g.wanted ? '★' : '☆';
    this.el.stars.textContent = stars;
    this.el.stars.classList.toggle('hot', g.wanted > 0);

    this.el.health.style.width = clamp(p.hp, 0, 100) + '%';
    this.el.armor.style.width = clamp(p.armor, 0, 100) + '%';
    this.el.armorWrap.style.opacity = p.armor > 0 ? '1' : '.25';

    if (!p.onFoot && p.vehicle) {
      this.el.speedWrap.classList.add('on');
      this.el.speed.textContent = Math.round(p.vehicle.kmh);
    } else {
      this.el.speedWrap.classList.remove('on');
    }

    const m = g.mission;
    if (m) {
      this.el.mission.classList.add('on');
      this.el.missionTitle.textContent = m.title;
      this.el.missionDesc.textContent = m.type === 'rampage'
        ? `Targets ${m.done}/${m.need}`
        : m.type === 'delivery'
          ? `Drop ${m.at + 1} of ${m.stops.length}`
          : m.desc;
      const s = Math.max(0, Math.ceil(m.timer));
      this.el.missionTimer.textContent =
        String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    } else {
      this.el.mission.classList.remove('on');
    }

    if (g.toast && g.time < g.toast.until) {
      this.el.toast.textContent = g.toast.text;
      this.el.toast.classList.add('on');
    } else {
      this.el.toast.classList.remove('on');
    }

    this.drawMinimap();
  },

  drawMinimap() {
    const g = this.game;
    const c = this.miniCtx;
    const size = this.mini.width;
    const range = 900;                 // world units shown across the map
    const k = size / (range * 2);
    const px = g.player.x, py = g.player.y;

    c.clearRect(0, 0, size, size);
    c.save();
    c.beginPath();
    c.arc(size / 2, size / 2, size / 2, 0, TAU);
    c.clip();

    c.fillStyle = '#241f30';          // city blocks
    c.fillRect(0, 0, size, size);

    const toMap = (x, y) => ({ x: size / 2 + (x - px) * k, y: size / 2 + (y - py) * k });

    // Water
    if (px + range > SEA_X) {
      const s = toMap(SEA_X, 0);
      c.fillStyle = '#1b7fa8';
      c.fillRect(s.x, 0, size, size);
    }
    if (px + range > SHORE_X) {
      const s = toMap(SHORE_X, 0);
      const e = toMap(SEA_X, 0);
      c.fillStyle = '#e8d3a9';
      c.fillRect(s.x, 0, e.x - s.x, size);
    }

    // Road grid
    c.strokeStyle = '#8b82a6';
    c.lineWidth = Math.max(1.5, ROAD_W * k);
    c.beginPath();
    const c0 = Math.floor((px - range) / BLOCK), c1 = Math.ceil((px + range) / BLOCK);
    const r0 = Math.floor((py - range) / BLOCK), r1 = Math.ceil((py + range) / BLOCK);
    for (let i = c0; i <= c1; i++) {
      if (i < 0 || i > COLS) continue;
      const m = toMap(i * BLOCK, 0);
      c.moveTo(m.x, 0); c.lineTo(m.x, size);
    }
    for (let j = r0; j <= r1; j++) {
      if (j < 0 || j > ROWS) continue;
      const m = toMap(0, j * BLOCK);
      c.moveTo(0, m.y); c.lineTo(size, m.y);
    }
    c.stroke();

    // Mission markers
    const spots = [];
    if (g.missionMarker) spots.push({ p: g.missionMarker, c: '#f5e04b' });
    if (g.mission && g.mission.type === 'delivery' && g.mission.stops[g.mission.at]) {
      spots.push({ p: g.mission.stops[g.mission.at], c: '#35d0d6' });
    }
    for (const s of spots) {
      const m = toMap(s.p.x, s.p.y);
      const cx = clamp(m.x, 6, size - 6), cy = clamp(m.y, 6, size - 6);
      c.fillStyle = s.c;
      c.beginPath();
      c.arc(cx, cy, 4.5, 0, TAU);
      c.fill();
    }

    // Police
    c.fillStyle = '#ff3b47';
    for (const v of g.vehicles) {
      if (v.driver !== 'cop' || v.dead) continue;
      const m = toMap(v.x, v.y);
      c.beginPath();
      c.arc(m.x, m.y, 3, 0, TAU);
      c.fill();
    }

    // Player arrow
    c.save();
    c.translate(size / 2, size / 2);
    c.rotate(g.player.angle + Math.PI / 2);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(0, -6);
    c.lineTo(4.5, 5);
    c.lineTo(0, 2.5);
    c.lineTo(-4.5, 5);
    c.closePath();
    c.fill();
    c.restore();

    c.restore();
  }
};
