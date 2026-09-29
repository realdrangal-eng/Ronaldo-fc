/* ============================================================
   GTA VI — чит-клиент: модули и Click GUI
   ------------------------------------------------------------
   Отдельная сборка. В чистом APK этот файл и css/cheats.css
   вырезаются на этапе сборки (APP_STRIP в android/apps/*.conf),
   поэтому весь остальной код обращается к Cheats только через
   защищённые проверки.
   ============================================================ */

const CHEAT_CATEGORIES = [
  { id: 'visuals',  name: 'Визуалы',  icon: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M12 9a3 3 0 100 6 3 3 0 000-6z' },
  { id: 'combat',   name: 'Бой',      icon: 'M4 20l7-7 M14 4l6 6-9 9-6-6z M3 15l6 6' },
  { id: 'movement', name: 'Движение', icon: 'M13 3l-8 10h6l-2 8 8-10h-6z' },
  { id: 'player',   name: 'Игрок',    icon: 'M12 3a4 4 0 100 8 4 4 0 000-8z M4 21a8 8 0 0116 0z' },
  { id: 'world',    name: 'Мир',      icon: 'M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3a14 14 0 000 18 14 14 0 000-18z' }
];

const CHEAT_THEMES = [
  '#e6b45a', '#f08a8a', '#9ed36a', '#6aa9e8', '#4fd0c0',
  '#b07ce8', '#f07ab0', '#7fa3d8', '#e0913a', '#5fc47a'
];

/** Описание модулей. Порядок внутри категории = порядок в колонках. */
const CHEAT_MODULES = [
  /* ---------------------------------------------------------- визуалы -- */
  { id: 'esp', name: 'ESP', cat: 'visuals', settings: [
    { id: 'peds',  name: 'Прохожие',  type: 'bool', value: true },
    { id: 'cars',  name: 'Машины',    type: 'bool', value: true },
    { id: 'cops',  name: 'Полиция',   type: 'bool', value: true },
    { id: 'range', name: 'Радиус',    type: 'slider', min: 50, max: 900, step: 10, value: 500 },
    { id: 'mode',  name: 'Режим',     type: 'mode', options: ['Рамка', 'Точка'], value: 'Рамка' }
  ]},
  { id: 'tracers', name: 'Трейсеры', cat: 'visuals', settings: [
    { id: 'range', name: 'Радиус', type: 'slider', min: 50, max: 900, step: 10, value: 450 },
    { id: 'width', name: 'Толщина', type: 'slider', min: 0.5, max: 4, step: 0.5, value: 1.5 }
  ]},
  { id: 'colorworld', name: 'Цветной мир', cat: 'visuals', settings: [
    { id: 'tint',   name: 'Цвет',        type: 'color', h: 285, s: 0.75, v: 1 },
    { id: 'power',  name: 'Сила тинта',  type: 'slider', min: 0, max: 1, step: 0.01, value: 0.24 },
    { id: 'bright', name: 'Яркость',     type: 'slider', min: -0.6, max: 0.6, step: 0.02, value: 0 },
    { id: 'vig',    name: 'Виньетка',    type: 'bool', value: true }
  ]},
  { id: 'crosshair', name: 'Прицел', cat: 'visuals', settings: [
    { id: 'mode', name: 'Режим', type: 'mode', options: ['Точка', 'Кружочек', 'Крест'], value: 'Крест' },
    { id: 'size', name: 'Размер', type: 'slider', min: 2, max: 20, step: 1, value: 8 }
  ]},
  { id: 'watermark', name: 'Инфо панель', cat: 'visuals', on: true, settings: [
    { id: 'fps',    name: 'FPS',      type: 'bool', value: true },
    { id: 'coords', name: 'Коорды',   type: 'bool', value: true },
    { id: 'entity', name: 'Счётчики', type: 'bool', value: true }
  ]},

  /* -------------------------------------------------------------- бой -- */
  { id: 'aimbot', name: 'Аимбот', cat: 'combat', settings: [
    { id: 'target', name: 'Цель',  type: 'mode', options: ['Все', 'Преступники', 'Копы'], value: 'Все' },
    { id: 'fov',    name: 'Угол',  type: 'slider', min: 10, max: 180, step: 5, value: 90 },
    { id: 'range',  name: 'Радиус', type: 'slider', min: 50, max: 700, step: 10, value: 350 },
    { id: 'auto',   name: 'Авто-огонь', type: 'bool', value: false }
  ]},
  { id: 'rapidfire', name: 'Быстрая стрельба', cat: 'combat', settings: [
    { id: 'rate', name: 'Задержка', type: 'slider', min: 0.02, max: 0.14, step: 0.01, value: 0.04 }
  ]},
  { id: 'damage', name: 'Урон', cat: 'combat', settings: [
    { id: 'mult', name: 'Множитель', type: 'slider', min: 1, max: 20, step: 0.5, value: 5 }
  ]},
  { id: 'multishot', name: 'Мульти-выстрел', cat: 'combat', settings: [
    { id: 'count',  name: 'Пуль',   type: 'slider', min: 2, max: 12, step: 1, value: 5 },
    { id: 'spread', name: 'Разброс', type: 'slider', min: 0, max: 0.6, step: 0.02, value: 0.18 }
  ]},

  /* --------------------------------------------------------- движение -- */
  { id: 'speed', name: 'Скорость', cat: 'movement', settings: [
    { id: 'foot', name: 'Пешком', type: 'slider', min: 1, max: 6, step: 0.1, value: 2.2 },
    { id: 'car',  name: 'В машине', type: 'slider', min: 1, max: 4, step: 0.1, value: 1.8 }
  ]},
  { id: 'noclip', name: 'Без стен', cat: 'movement', settings: [] },
  { id: 'teleport', name: 'Телепорт (ПКМ)', cat: 'movement', settings: [] },
  { id: 'grip', name: 'Прилипание', cat: 'movement', settings: [
    { id: 'power', name: 'Сцепление', type: 'slider', min: 0, max: 1, step: 0.05, value: 0.8 }
  ]},

  /* ------------------------------------------------------------ игрок -- */
  { id: 'godmode', name: 'Бессмертие', cat: 'player', settings: [] },
  { id: 'autoheal', name: 'Авто-лечение', cat: 'player', settings: [
    { id: 'rate', name: 'Скорость', type: 'slider', min: 1, max: 60, step: 1, value: 25 }
  ]},
  { id: 'nowanted', name: 'Нет розыска', cat: 'player', settings: [] },
  { id: 'money', name: 'Деньги', cat: 'player', settings: [
    { id: 'amount', name: 'Сумма', type: 'slider', min: 1000, max: 500000, step: 1000, value: 50000 },
    { id: 'give',   name: 'Выдать', type: 'button', label: 'ВЫДАТЬ' },
    { id: 'drip',   name: 'Пассивный доход', type: 'bool', value: false }
  ]},

  /* -------------------------------------------------------------- мир -- */
  { id: 'spawner', name: 'Спавн машин', cat: 'world', settings: [
    { id: 'type',  name: 'Тип',  type: 'mode',
      options: ['sports', 'police', 'suv', 'van', 'taxi', 'bike'], value: 'sports' },
    { id: 'spawn', name: 'Создать', type: 'button', label: 'СПАВН' }
  ]},
  { id: 'freeze', name: 'Заморозить NPC', cat: 'world', settings: [] },
  { id: 'chaos', name: 'Хаос', cat: 'world', settings: [] },
  { id: 'traffic', name: 'Плотность трафика', cat: 'world', settings: [
    { id: 'cap', name: 'Машин', type: 'slider', min: 0, max: 80, step: 1, value: 40 }
  ]}
];

const Cheats = {
  game: null,
  root: null,
  open: false,
  cat: 'visuals',
  search: '',
  accent: '#b07ce8',
  map: Object.create(null),
  fps: 60,
  _fpsT: 0,
  _fpsN: 0,

  /* ------------------------------------------------------------- API --- */

  /** Включён ли модуль. */
  on(id) {
    const m = this.map[id];
    return !!(m && m.on);
  },

  /** Значение настройки модуля (или fallback, если её нет). */
  val(id, settingId, fallback) {
    const m = this.map[id];
    if (!m) return fallback;
    const s = m.settings.find(x => x.id === settingId);
    return s ? s.value : fallback;
  },

  /** Цвет настройки типа color в виде css-строки. */
  css(id, settingId, alpha) {
    const m = this.map[id];
    const s = m && m.settings.find(x => x.id === settingId);
    if (!s) return 'rgba(255,255,255,' + (alpha == null ? 1 : alpha) + ')';
    return hsvToCss(s.h, s.s, s.v, alpha);
  },

  /* ------------------------------------------------------------ init --- */

  init(game) {
    this.game = game;
    for (const m of CHEAT_MODULES) {
      m.on = !!m.on;
      m.key = m.key || 'n/a';
      this.map[m.id] = m;
    }
    this.build();
    this.bind();
  },

  bind() {
    addEventListener('keydown', e => {
      if (e.code === 'ShiftRight' || e.code === 'Backquote') {
        this.toggle();
        e.preventDefault();
      } else if (e.code === 'Escape' && this.open) {
        this.toggle();
        e.stopPropagation();
      }
    }, true);

    // Кнопку создаём здесь, а не в index.html: в чистой сборке этот файл
    // вырезан, и мёртвой кнопки на экране не остаётся.
    const btn = document.createElement('button');
    btn.id = 'btnCheat';
    btn.className = 'cheat-open';
    btn.setAttribute('aria-label', 'Чит-меню');
    btn.textContent = '∞';
    const fire = e => { e.preventDefault(); e.stopPropagation(); this.toggle(); };
    btn.addEventListener('click', fire);
    btn.addEventListener('touchstart', fire, { passive: false });
    (document.getElementById('hud') || document.body).appendChild(btn);

    // Телепорт правой кнопкой.
    const canvas = this.game.canvas;
    canvas.addEventListener('contextmenu', e => {
      if (!this.on('teleport') || this.game.state !== 'play') return;
      const g = this.game;
      const r = canvas.getBoundingClientRect();
      const wx = g.camX + (e.clientX - r.left - r.width / 2) / g.scale;
      const wy = g.camY + (e.clientY - r.top - r.height / 2) / g.scale;
      const p = g.player;
      p.x = clamp(wx, 8, WORLD_W - 8);
      p.y = clamp(wy, 8, WORLD_H - 8);
      if (p.vehicle) { p.vehicle.x = p.x; p.vehicle.y = p.y; }
      g.say('Телепорт', 900);
      e.preventDefault();
    });
  },

  toggle() {
    this.open = !this.open;
    this.root.classList.toggle('on', this.open);
    if (this.open) {
      // Не оставляем зажатые клавиши/огонь при открытии меню.
      Input.axes.x = 0;
      Input.axes.y = 0;
      Input.fire = false;
      Input.brake = false;
      Input.keys = Object.create(null);
    }
  },

  /* ----------------------------------------------------------- вёрстка -- */

  build() {
    const root = document.createElement('div');
    root.className = 'cg';
    root.innerHTML = `
      <div class="cg-panel">
        <div class="cg-rail">
          <div class="cg-logo">∞</div>
          ${CHEAT_CATEGORIES.map(c => `
            <button class="cg-rail-btn" data-cat="${c.id}" title="${c.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="${c.icon}"></path>
              </svg>
            </button>`).join('')}
        </div>
        <div class="cg-main">
          <div class="cg-head">
            <div class="cg-tabs">
              <span class="cg-tab-label">Рендер</span>
              <span class="cg-tab" id="cgCatName">Визуалы</span>
            </div>
            <label class="cg-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>
              </svg>
              <input id="cgSearch" type="text" placeholder="Поиск" spellcheck="false">
            </label>
            <div class="cg-themes">
              ${CHEAT_THEMES.map(c => `<button class="cg-theme" data-c="${c}" style="background:${c}"></button>`).join('')}
            </div>
            <button class="cg-close" id="cgClose" aria-label="Закрыть">✕</button>
          </div>
          <div class="cg-cols" id="cgCols"></div>
        </div>
      </div>`;
    document.body.appendChild(root);
    this.root = root;

    root.addEventListener('click', e => {
      if (e.target === root) this.toggle();          // клик по фону закрывает
    });
    root.querySelectorAll('.cg-rail-btn').forEach(b => {
      b.addEventListener('click', () => { this.cat = b.dataset.cat; this.render(); });
    });
    root.querySelectorAll('.cg-theme').forEach(b => {
      b.addEventListener('click', () => {
        this.accent = b.dataset.c;
        this.root.style.setProperty('--cg-accent', this.accent);
        this.render();
      });
    });
    // Пока меню открыто, кнопка ∞ под оверлеем — закрываем отсюда.
    root.querySelector('#cgClose').addEventListener('click', () => this.toggle());

    const search = root.querySelector('#cgSearch');
    search.addEventListener('input', () => { this.search = search.value.trim().toLowerCase(); this.render(); });

    root.style.setProperty('--cg-accent', this.accent);

    let cols = 0;
    addEventListener('resize', () => {
      const n = innerWidth <= 560 ? 1 : innerWidth <= 860 ? 2 : 3;
      if (n !== cols) { cols = n; this.render(); }
    });

    this.render();
  },

  render() {
    const cols = this.root.querySelector('#cgCols');
    const catName = CHEAT_CATEGORIES.find(c => c.id === this.cat);
    this.root.querySelector('#cgCatName').textContent = catName ? catName.name : '';
    this.root.querySelectorAll('.cg-rail-btn').forEach(b =>
      b.classList.toggle('on', b.dataset.cat === this.cat));
    this.root.querySelectorAll('.cg-theme').forEach(b =>
      b.classList.toggle('on', b.dataset.c === this.accent));

    // Поиск ищет по всем категориям, иначе показываем текущую.
    const list = CHEAT_MODULES.filter(m => this.search
      ? m.name.toLowerCase().includes(this.search)
      : m.cat === this.cat);

    // Число колонок считаем здесь, а не прячем их в CSS: спрятанная
    // колонка унесла бы с собой каждый третий модуль.
    const n = innerWidth <= 560 ? 1 : innerWidth <= 860 ? 2 : 3;
    cols.innerHTML = '';
    const columns = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'cg-col';
      cols.appendChild(c);
      columns.push(c);
    }
    list.forEach((m, i) => columns[i % n].appendChild(this.card(m)));

    if (!list.length) {
      cols.innerHTML = '<p class="cg-empty">Ничего не найдено</p>';
    }
  },

  card(m) {
    const el = document.createElement('div');
    el.className = 'cg-card' + (m.on ? ' on' : '');

    const head = document.createElement('div');
    head.className = 'cg-card-head';
    head.innerHTML = `<span class="cg-name">${m.name}</span>
      <span class="cg-key">${m.key}</span>
      <span class="cg-switch"></span>`;
    head.addEventListener('click', () => {
      m.on = !m.on;
      el.classList.toggle('on', m.on);
      this.onToggle(m);
    });
    el.appendChild(head);

    if (m.settings.length) {
      const body = document.createElement('div');
      body.className = 'cg-body';
      for (const s of m.settings) body.appendChild(this.setting(m, s));
      el.appendChild(body);
    }
    return el;
  },

  setting(m, s) {
    const row = document.createElement('div');
    row.className = 'cg-row cg-' + s.type;

    if (s.type === 'slider') {
      const dec = s.step < 1 ? (s.step < 0.1 ? 2 : 2) : 0;
      row.innerHTML = `<span class="cg-label">${s.name}</span>
        <span class="cg-value">${s.value.toFixed(dec)}</span>
        <span class="cg-track"><i class="cg-fill"></i><i class="cg-knob"></i></span>`;
      const track = row.querySelector('.cg-track');
      const fill = row.querySelector('.cg-fill');
      const knob = row.querySelector('.cg-knob');
      const value = row.querySelector('.cg-value');
      const paint = () => {
        const t = (s.value - s.min) / (s.max - s.min);
        fill.style.width = (t * 100) + '%';
        knob.style.left = (t * 100) + '%';
        value.textContent = s.value.toFixed(dec);
      };
      dragTrack(track, t => {
        const raw = s.min + t * (s.max - s.min);
        s.value = clamp(Math.round(raw / s.step) * s.step, s.min, s.max);
        paint();
        this.onChange(m, s);
      });
      paint();

    } else if (s.type === 'bool') {
      row.innerHTML = `<span class="cg-label">${s.name}</span>
        <span class="cg-check">${s.value ? '✓' : '✕'}</span>`;
      const box = row.querySelector('.cg-check');
      row.classList.toggle('yes', s.value);
      row.addEventListener('click', () => {
        s.value = !s.value;
        box.textContent = s.value ? '✓' : '✕';
        row.classList.toggle('yes', s.value);
        this.onChange(m, s);
      });

    } else if (s.type === 'mode') {
      row.innerHTML = `<span class="cg-label">${s.name}</span>
        <span class="cg-value">${s.value}</span>
        <span class="cg-modes"></span>`;
      const wrap = row.querySelector('.cg-modes');
      const value = row.querySelector('.cg-value');
      for (const opt of s.options) {
        const b = document.createElement('button');
        b.className = 'cg-mode' + (opt === s.value ? ' on' : '');
        b.textContent = opt;
        b.addEventListener('click', () => {
          s.value = opt;
          value.textContent = opt;
          wrap.querySelectorAll('.cg-mode').forEach(x => x.classList.toggle('on', x === b));
          this.onChange(m, s);
        });
        wrap.appendChild(b);
      }

    } else if (s.type === 'color') {
      row.innerHTML = `<span class="cg-label">${s.name}</span>
        <span class="cg-swatch"></span>
        <span class="cg-bars">
          <span class="cg-track cg-hue"><i class="cg-knob"></i></span>
          <span class="cg-track cg-sat"><i class="cg-knob"></i></span>
          <span class="cg-track cg-val"><i class="cg-knob"></i></span>
        </span>`;
      const swatch = row.querySelector('.cg-swatch');
      const hue = row.querySelector('.cg-hue');
      const sat = row.querySelector('.cg-sat');
      const val = row.querySelector('.cg-val');
      const paint = () => {
        swatch.style.background = hsvToCss(s.h, s.s, s.v);
        hue.querySelector('.cg-knob').style.left = (s.h / 360 * 100) + '%';
        sat.querySelector('.cg-knob').style.left = (s.s * 100) + '%';
        val.querySelector('.cg-knob').style.left = (s.v * 100) + '%';
        sat.style.backgroundImage = `linear-gradient(90deg, #808080, ${hsvToCss(s.h, 1, s.v)})`;
        val.style.backgroundImage = `linear-gradient(90deg, #000, ${hsvToCss(s.h, s.s, 1)})`;
      };
      dragTrack(hue, t => { s.h = t * 360; paint(); this.onChange(m, s); });
      dragTrack(sat, t => { s.s = t; paint(); this.onChange(m, s); });
      dragTrack(val, t => { s.v = t; paint(); this.onChange(m, s); });
      paint();

    } else if (s.type === 'button') {
      row.innerHTML = `<button class="cg-btn">${s.label}</button>`;
      row.querySelector('.cg-btn').addEventListener('click', () => this.action(m, s));
    }

    return row;
  },

  /* ---------------------------------------------------------- действия -- */

  onToggle(m) {
    const g = this.game;
    if (m.id === 'traffic' && !m.on) g.trafficCap = null;
    g.say((m.on ? '+ ' : '- ') + m.name, 1100);
  },

  onChange() { /* значения читаются напрямую из модулей */ },

  action(m, s) {
    const g = this.game;
    if (m.id === 'money' && s.id === 'give') {
      const amount = this.val('money', 'amount', 10000);
      g.player.cash += amount;
      g.stats.earned += amount;
      g.say('+' + fmtMoney(amount), 1600);
    } else if (m.id === 'spawner' && s.id === 'spawn') {
      const type = this.val('spawner', 'type', 'sports');
      const p = g.player;
      const a = p.angle + Math.PI / 2;
      const v = new Vehicle(p.x + Math.cos(a) * 46, p.y + Math.sin(a) * 46, p.angle, type);
      g.vehicles.push(v);
      g.say('Заспавнен ' + v.def.name, 1600);
    }
  },

  /* ------------------------------------------------------------- тики -- */

  /** Вызывается из Game.update каждый кадр. */
  update(dt) {
    const g = this.game;
    const p = g.player;

    if (this.on('godmode')) {
      p.hp = p.maxHp;
      if (p.vehicle) p.vehicle.hp = p.vehicle.maxHp;
    } else if (this.on('autoheal')) {
      p.hp = Math.min(p.maxHp, p.hp + this.val('autoheal', 'rate', 25) * dt);
    }

    if (this.on('nowanted') && g.wanted > 0) {
      g.wanted = 0;
      g.vehicles = g.vehicles.filter(v => v.driver !== 'cop');
      g.peds = g.peds.filter(q => !q.isCop);
    }

    if (this.on('money') && this.val('money', 'drip', false)) {
      p.cash += 2500 * dt;
      g.stats.earned += 2500 * dt;
    }

    if (this.on('chaos')) g.panic = 3;

    g.trafficCap = this.on('traffic') ? this.val('traffic', 'cap', 40) : null;

    if (this.on('grip') && p.vehicle) {
      const k = this.val('grip', 'power', 0.8);
      const v = p.vehicle;
      const fx = Math.cos(v.angle), fy = Math.sin(v.angle);
      const fwd = v.vx * fx + v.vy * fy;
      let lat = -v.vx * fy + v.vy * fx;
      lat *= (1 - k);
      v.vx = fx * fwd - fy * lat;
      v.vy = fy * fwd + fx * lat;
    }

    this.aim(dt);
  },

  /** Аимбот: наводит игрока на ближайшую цель в секторе. */
  aim() {
    const g = this.game;
    const p = g.player;
    if (!this.on('aimbot') || !p.onFoot) return;

    const filter = this.val('aimbot', 'target', 'Все');
    const fov = this.val('aimbot', 'fov', 90) * Math.PI / 180 / 2;
    const range = this.val('aimbot', 'range', 350);

    let best = null, bd = range * range;
    for (const q of g.peds) {
      if (q.dead) continue;
      if (filter === 'Преступники' && !q.criminal) continue;
      if (filter === 'Копы' && !q.isCop) continue;
      const d = dist2(q.x, q.y, p.x, p.y);
      if (d > bd) continue;
      const a = Math.atan2(q.y - p.y, q.x - p.x);
      if (Math.abs(angleDelta(p.angle, a)) > fov) continue;
      bd = d;
      best = q;
    }
    if (!best) return;

    p.angle = Math.atan2(best.y - p.y, best.x - p.x);
    this.aimLock = best;
    if (this.val('aimbot', 'auto', false)) Input.fire = true;
  },

  /* ---------------------------------------------------------- отрисовка -- */

  /** В мировых координатах, внутри трансформации камеры. */
  drawWorld(ctx) {
    const g = this.game;
    const p = g.player;

    if (this.on('esp')) {
      const range = this.val('esp', 'range', 500);
      const dot = this.val('esp', 'mode', 'Рамка') === 'Точка';
      const showPeds = this.val('esp', 'peds', true);
      const showCops = this.val('esp', 'cops', true);

      for (const q of g.peds) {
        if (q.dead) continue;
        if (q.isCop ? !showCops : !showPeds) continue;
        if (dist2(q.x, q.y, p.x, p.y) > range * range) continue;
        const col = q.isCop ? '#4f8bff' : q.criminal ? '#ff3b47' : '#6ef2a0';
        this.box(ctx, q.x, q.y, 11, 15, col, dot);
      }
      if (this.val('esp', 'cars', true)) {
        for (const v of g.vehicles) {
          if (v.dead || v.driver === 'player') continue;
          if (dist2(v.x, v.y, p.x, p.y) > range * range) continue;
          this.box(ctx, v.x, v.y, v.w * 0.75, v.h * 1.5,
                   v.driver === 'cop' ? '#4f8bff' : '#e8e04b', dot);
        }
      }
    }

    if (this.on('tracers')) {
      const range = this.val('tracers', 'range', 450);
      ctx.save();
      ctx.lineWidth = this.val('tracers', 'width', 1.5);
      ctx.globalAlpha = 0.6;
      for (const q of g.peds) {
        if (q.dead || dist2(q.x, q.y, p.x, p.y) > range * range) continue;
        ctx.strokeStyle = q.isCop ? '#4f8bff' : q.criminal ? '#ff3b47' : '#6ef2a0';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  box(ctx, x, y, w, h, color, dot) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if (dot) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, TAU);
      ctx.fill();
    } else {
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    }
    ctx.restore();
  },

  /** Поверх всего, в экранных координатах. */
  drawScreen(ctx, dt) {
    const g = this.game;

    this._fpsN++;
    this._fpsT += dt;
    if (this._fpsT >= 0.5) {
      this.fps = Math.round(this._fpsN / this._fpsT);
      this._fpsN = 0;
      this._fpsT = 0;
    }

    if (this.on('colorworld')) {
      const power = this.val('colorworld', 'power', 0.24);
      if (power > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = this.css('colorworld', 'tint', power);
        ctx.fillRect(0, 0, g.w, g.h);
        ctx.restore();
      }
      const bright = this.val('colorworld', 'bright', 0);
      if (bright !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = bright > 0 ? 'lighter' : 'source-over';
        ctx.fillStyle = bright > 0
          ? `rgba(255,255,255,${bright})`
          : `rgba(0,0,0,${-bright})`;
        ctx.fillRect(0, 0, g.w, g.h);
        ctx.restore();
      }
      if (this.val('colorworld', 'vig', true)) {
        const grad = ctx.createRadialGradient(g.w / 2, g.h / 2, Math.min(g.w, g.h) * 0.3,
                                              g.w / 2, g.h / 2, Math.max(g.w, g.h) * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,.55)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, g.w, g.h);
      }
    }

    if (this.on('crosshair')) {
      const mode = this.val('crosshair', 'mode', 'Крест');
      const size = this.val('crosshair', 'size', 8);
      const cx = g.w / 2, cy = g.h / 2;
      ctx.save();
      ctx.strokeStyle = this.accent;
      ctx.fillStyle = this.accent;
      ctx.lineWidth = 1.6;
      if (mode === 'Точка') {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1.5, size / 4), 0, TAU);
        ctx.fill();
      } else if (mode === 'Кружочек') {
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, TAU);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx - size, cy); ctx.lineTo(cx - size / 3, cy);
        ctx.moveTo(cx + size / 3, cy); ctx.lineTo(cx + size, cy);
        ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy - size / 3);
        ctx.moveTo(cx, cy + size / 3); ctx.lineTo(cx, cy + size);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.on('watermark')) {
      const lines = [];
      if (this.val('watermark', 'fps', true)) lines.push(this.fps + ' fps');
      if (this.val('watermark', 'coords', true)) {
        lines.push(Math.round(g.player.x) + ' / ' + Math.round(g.player.y));
      }
      if (this.val('watermark', 'entity', true)) {
        lines.push(g.vehicles.length + ' авто · ' + g.peds.length + ' NPC');
      }
      if (lines.length) {
        ctx.save();
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        const text = lines.join('   ');
        const w = ctx.measureText(text).width + 22;
        ctx.fillStyle = 'rgba(14,11,24,.72)';
        roundRect(ctx, g.w / 2 - w / 2, 8, w, 24, 8);
        ctx.fill();
        ctx.fillStyle = this.accent;
        ctx.fillText('∞', g.w / 2 - w / 2 + 9, 21);
        ctx.fillStyle = '#e8e4ef';
        ctx.fillText(text, g.w / 2 - w / 2 + 22, 21);
        ctx.restore();
      }
    }
  }
};

/* -------------------------------------------------------------- утилиты -- */

function hsvToCss(h, s, v, alpha) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = n => Math.round((n + m) * 255);
  return alpha == null
    ? `rgb(${to(r)},${to(g)},${to(b)})`
    : `rgba(${to(r)},${to(g)},${to(b)},${alpha})`;
}

/** Общий drag для всех полосок: мышь и палец, значение 0..1. */
function dragTrack(el, onValue) {
  let dragging = false;
  const emit = clientX => {
    const r = el.getBoundingClientRect();
    onValue(clamp((clientX - r.left) / r.width, 0, 1));
  };
  const down = e => {
    dragging = true;
    emit(e.touches ? e.touches[0].clientX : e.clientX);
    e.preventDefault();
    e.stopPropagation();
  };
  const move = e => {
    if (!dragging) return;
    emit(e.touches ? e.touches[0].clientX : e.clientX);
    e.preventDefault();
  };
  const up = () => { dragging = false; };

  el.addEventListener('mousedown', down);
  el.addEventListener('touchstart', down, { passive: false });
  addEventListener('mousemove', move);
  addEventListener('touchmove', move, { passive: false });
  addEventListener('mouseup', up);
  addEventListener('touchend', up);
  addEventListener('touchcancel', up);
}
