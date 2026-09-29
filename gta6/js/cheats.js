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
  { id: 'rainbow', name: 'Радуга', cat: 'visuals', settings: [
    { id: 'speed', name: 'Скорость', type: 'slider', min: 10, max: 200, step: 5, value: 60 }
  ]},
  { id: 'trail', name: 'Неоновый след', cat: 'visuals', settings: [
    { id: 'time', name: 'Длина', type: 'slider', min: 0.3, max: 2.5, step: 0.1, value: 1.2 },
    { id: 'mode', name: 'Цвет', type: 'mode', options: ['Тема', 'Радуга'], value: 'Радуга' }
  ]},
  { id: 'zoom', name: 'Зум камеры', cat: 'visuals', settings: [
    { id: 'factor', name: 'Приближение', type: 'slider', min: 0.5, max: 1.8, step: 0.05, value: 1 }
  ]},
  { id: 'cinema', name: 'Кино-режим', cat: 'visuals', settings: [
    { id: 'bars', name: 'Чёрные полосы', type: 'bool', value: true }
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
  { id: 'hitmarker', name: 'Хитмаркеры', cat: 'combat', settings: [
    { id: 'size', name: 'Размер', type: 'slider', min: 4, max: 16, step: 1, value: 8 }
  ]},
  { id: 'killaura', name: 'Kill Aura', cat: 'combat', settings: [
    { id: 'range',  name: 'Радиус',   type: 'slider', min: 40, max: 300, step: 5, value: 130 },
    { id: 'rate',   name: 'Интервал', type: 'slider', min: 0.1, max: 1.5, step: 0.05, value: 0.4 },
    { id: 'target', name: 'Цель', type: 'mode', options: ['Все', 'Преступники', 'Копы'], value: 'Все' }
  ]},

  /* --------------------------------------------------------- движение -- */
  { id: 'speed', name: 'Скорость', cat: 'movement', settings: [
    { id: 'foot', name: 'Пешком', type: 'slider', min: 1, max: 6, step: 0.1, value: 2.2 },
    { id: 'car',  name: 'В машине', type: 'slider', min: 1, max: 4, step: 0.1, value: 1.8 }
  ]},
  { id: 'noclip', name: 'Без стен', cat: 'movement', settings: [] },
  { id: 'teleport', name: 'Телепорт (ПКМ)', cat: 'movement', settings: [] },
  { id: 'autopilot', name: 'Автопилот', cat: 'movement', settings: [
    { id: 'speed', name: 'Крейсер', type: 'slider', min: 80, max: 260, step: 5, value: 170 }
  ]},
  { id: 'grip', name: 'Прилипание', cat: 'movement', settings: [
    { id: 'power', name: 'Сцепление', type: 'slider', min: 0, max: 1, step: 0.05, value: 0.8 }
  ]},

  /* ------------------------------------------------------------ игрок -- */
  { id: 'godmode', name: 'Бессмертие', cat: 'player', settings: [] },
  { id: 'autoheal', name: 'Авто-лечение', cat: 'player', settings: [
    { id: 'rate', name: 'Скорость', type: 'slider', min: 1, max: 60, step: 1, value: 25 }
  ]},
  { id: 'nowanted', name: 'Нет розыска', cat: 'player', settings: [] },
  { id: 'magnet', name: 'Магнит лута', cat: 'player', settings: [
    { id: 'range', name: 'Радиус', type: 'slider', min: 60, max: 600, step: 10, value: 260 }
  ]},
  { id: 'automoney', name: 'AutoMoney', cat: 'player', settings: [
    { id: 'speed', name: 'Скорость полёта', type: 'slider', min: 150, max: 900, step: 10, value: 450 },
    { id: 'rob',   name: 'Грабить прохожих', type: 'bool', value: true }
  ]},
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
  { id: 'rain', name: 'Дождь', cat: 'world', settings: [
    { id: 'power', name: 'Сила', type: 'slider', min: 0.2, max: 1, step: 0.05, value: 0.6 }
  ]},
  { id: 'daytime', name: 'Время суток', cat: 'world', settings: [
    { id: 'hour', name: 'Время', type: 'slider', min: 0, max: 24, step: 0.5, value: 19 },
    { id: 'auto', name: 'Идут часы', type: 'bool', value: false }
  ]},
  { id: 'slowmo', name: 'Слоумо', cat: 'world', settings: [
    { id: 'scale', name: 'Скорость мира', type: 'slider', min: 0.2, max: 1, step: 0.05, value: 0.5 }
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
    this.logo = new Image();
    this.logo.src = 'assets/nursultan.png';
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
    btn.setAttribute('aria-label', 'Nursultan Client');
    btn.innerHTML = '<img src="assets/nursultan.png" alt="N">';
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
          <div class="cg-logo" title="Nursultan Client"><img src="assets/nursultan.png" alt="Nursultan"></div>
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
              <span class="cg-brand">Nursultan</span>
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
    if (m.id === 'autopilot') this._apOn = false;
    if (m.id === 'cinema') {
      const hud = document.getElementById('hud');
      if (hud) hud.classList.toggle('cinema', m.on);
    }
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

    // --- зум камеры: масштаб пересчитывается от базового ---
    g.scale = g.baseScale * (this.on('zoom') ? this.val('zoom', 'factor', 1) : 1);

    // --- радуга: акцент клиента плывёт по кругу оттенков ---
    if (this.on('rainbow')) {
      if (this._rainbowSaved == null) this._rainbowSaved = this.accent;
      this._hue = ((this._hue || 0) + this.val('rainbow', 'speed', 60) * dt) % 360;
      this.accent = hsvToCss(this._hue, 0.65, 0.95);
      this.root.style.setProperty('--cg-accent', this.accent);
    } else if (this._rainbowSaved != null) {
      this.accent = this._rainbowSaved;
      this._rainbowSaved = null;
      this.root.style.setProperty('--cg-accent', this.accent);
    }

    // --- неоновый след за игроком или машиной ---
    if (this.on('trail')) {
      const t = this.val('trail', 'time', 1.2);
      this._trail = this._trail || [];
      const last = this._trail[this._trail.length - 1];
      if (!last || dist2(last.x, last.y, p.x, p.y) > 9) {
        this._trail.push({ x: p.x, y: p.y, at: g.time });
      }
      while (this._trail.length && g.time - this._trail[0].at > t) this._trail.shift();
    } else if (this._trail) {
      this._trail.length = 0;
    }

    // --- часы идут сами ---
    if (this.on('daytime') && this.val('daytime', 'auto', false)) {
      const m = this.map.daytime.settings.find(x => x.id === 'hour');
      m.value = (m.value + dt * 0.4) % 24;
    }

    // --- магнит лута: пикапы плывут к игроку ---
    if (this.on('magnet')) {
      const r = this.val('magnet', 'range', 260);
      for (const k of g.pickups) {
        const d = dist(k.x, k.y, p.x, p.y);
        if (d < 24 || d > r) continue;
        const pull = 340 * dt * (1 - d / (r * 1.4));
        k.x += (p.x - k.x) / d * pull * 60 * dt;
        k.y += (p.y - k.y) / d * pull * 60 * dt;
      }
    }

    this.killAura(dt);
    this.autoMoney(dt);
    this.aim(dt);
  },

  /**
   * Автопилот: машина едет как трафик — держит полосу, тормозит перед
   * помехами, сворачивает на перекрёстках. Возвращает true, когда ведёт.
   */
  autopilot(dt) {
    const g = this.game;
    const p = g.player;
    if (!this.on('autopilot') || p.onFoot || !p.vehicle) {
      this._apOn = false;
      return false;
    }
    const v = p.vehicle;
    if (!this._apOn) {
      this._apOn = true;
      // Ось и направление берём из текущего курса, полосу — из ближайшей дороги.
      const a = ((v.angle % TAU) + TAU) % TAU;
      const horiz = a < Math.PI / 4 || a > TAU - Math.PI / 4 || Math.abs(a - Math.PI) < Math.PI / 4;
      v.axis = horiz ? 'h' : 'v';
      v.dir = horiz ? (Math.cos(a) >= 0 ? 1 : -1) : (Math.sin(a) >= 0 ? 1 : -1);
      const across = horiz ? v.y : v.x;
      v.lane = City.snapToLane(across) + (v.dir > 0 ? 22 : -22);
      v.cool = 0.8;
    }
    v.cruise = this.val('autopilot', 'speed', 170);
    v.driveTraffic(dt, g);
    return true;
  },

  /** Отметка попадания — рисуется крестиком и тает. */
  hitmark(x, y) {
    if (!this.on('hitmarker')) return;
    this._marks = this._marks || [];
    this._marks.push({ x, y, life: 0.35 });
    if (this._marks.length > 40) this._marks.shift();
  },

  /** Kill Aura: раз в интервал бьёт ближайшую цель в радиусе. */
  killAura(dt) {
    this._kaCool = Math.max(0, (this._kaCool || 0) - dt);
    if (!this.on('killaura') || this._kaCool > 0) return;

    const g = this.game;
    const p = g.player;
    const range = this.val('killaura', 'range', 130);
    const filter = this.val('killaura', 'target', 'Все');

    let best = null, bd = range * range;
    for (const q of g.peds) {
      if (q.dead) continue;
      if (filter === 'Преступники' && !q.criminal) continue;
      if (filter === 'Копы' && !q.isCop) continue;
      const d = dist2(q.x, q.y, p.x, p.y);
      if (d < bd) { bd = d; best = q; }
    }
    if (!best) return;

    this._kaCool = this.val('killaura', 'rate', 0.4);
    p.angle = Math.atan2(best.y - p.y, best.x - p.x);
    best.hit(9999, g);
  },

  /**
   * AutoMoney: бот берёт управление и летает по карте — подбирает кэш,
   * грабит прохожих, между делом кружит по городу. Стены его не волнуют.
   */
  autoMoney(dt) {
    if (!this.on('automoney')) return;
    const g = this.game;
    const p = g.player;

    // Бот рулит сам — ручной ввод глушим.
    Input.axes.x = 0;
    Input.axes.y = 0;

    let tx = 0, ty = 0, mode = 'wander', mark = null;
    let bd = Infinity;
    for (const k of g.pickups) {
      if (k.kind !== 'cash') continue;
      const d = dist2(k.x, k.y, p.x, p.y);
      if (d < bd) { bd = d; tx = k.x; ty = k.y; mode = 'pickup'; }
    }
    if (mode === 'wander' && this.val('automoney', 'rob', true)) {
      bd = Infinity;
      for (const q of g.peds) {
        if (q.dead || q.isCop || q.cash <= 0) continue;
        const d = dist2(q.x, q.y, p.x, p.y);
        if (d < bd) { bd = d; mark = q; mode = 'rob'; }
      }
      if (mark) { tx = mark.x; ty = mark.y; }
    }
    if (mode === 'wander') {
      if (!this._amT || dist(p.x, p.y, this._amT.x, this._amT.y) < 60) {
        this._amT = { x: rand(120, SHORE_X - 120), y: rand(120, WORLD_H - 120) };
      }
      tx = this._amT.x;
      ty = this._amT.y;
    }

    const d = dist(p.x, p.y, tx, ty);
    const sp = this.val('automoney', 'speed', 450);
    if (d > 1) {
      const step = Math.min(sp * dt, d);
      p.angle = Math.atan2(ty - p.y, tx - p.x);
      p.x += Math.cos(p.angle) * step;
      p.y += Math.sin(p.angle) * step;
      p.walk += sp * dt * 0.12;
      if (chance(0.4)) {
        g.particles.push(new Particle(
          p.x - Math.cos(p.angle) * 10, p.y - Math.sin(p.angle) * 10,
          rand(-25, 25), rand(-25, 25), 0.3, '#6ef2a0', 2));
      }
    }
    // Машина, если сидим в ней, летит следом.
    if (p.vehicle) {
      const v = p.vehicle;
      v.x = p.x; v.y = p.y; v.vx = 0; v.vy = 0; v.angle = p.angle;
    }

    if (mode === 'rob' && mark && dist(p.x, p.y, mark.x, mark.y) < 26) {
      const take = mark.cash;
      mark.cash = 0;
      mark.state = 'flee';
      mark.timer = 2.5;
      p.cash += take;
      g.stats.earned += take;
      g.particles.push(new Particle(mark.x, mark.y, 0, -40, 0.5, '#6ef2a0', 3));
    }
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

    if (this._trail && this._trail.length > 1) {
      const tr = this._trail;
      const rainbow = this.val('trail', 'mode', 'Радуга') === 'Радуга';
      const dur = this.val('trail', 'time', 1.2);
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < tr.length; i++) {
        const age = (g.time - tr[i].at) / dur;
        ctx.strokeStyle = rainbow
          ? hsvToCss((i * 14 + performance.now() * 0.12) % 360, 0.8, 1)
          : this.accent;
        ctx.globalAlpha = clamp(1 - age, 0, 1) * 0.7;
        ctx.lineWidth = 2 + (1 - age) * 4;
        ctx.beginPath();
        ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this._marks && this._marks.length) {
      const size = this.val('hitmarker', 'size', 8);
      ctx.save();
      ctx.lineWidth = 2.2;
      for (const m of this._marks) {
        m.life -= g.dt;
        const k = clamp(m.life / 0.35, 0, 1);
        const r = size * (1.6 - k * 0.6);
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = k;
        ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          ctx.moveTo(m.x + sx * r * 0.35, m.y + sy * r * 0.35);
          ctx.lineTo(m.x + sx * r, m.y + sy * r);
        }
        ctx.stroke();
      }
      this._marks = this._marks.filter(m => m.life > 0);
      ctx.restore();
    }

    if (this.on('killaura')) {
      const r = this.val('killaura', 'range', 130);
      const t = performance.now() * 0.004;
      ctx.save();
      ctx.strokeStyle = this.accent;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, t, t + 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, t + Math.PI, t + Math.PI + 1.2);
      ctx.stroke();
      ctx.restore();
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

    if (this.on('daytime')) {
      const hour = this.val('daytime', 'hour', 19);
      // Полдень светлый, полночь тёмная; сумерки подкрашены закатом.
      const dark = (1 - Math.cos((hour - 12) / 12 * Math.PI * 2 / 2)) / 2;
      if (dark > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(${Math.round(70 - 40 * dark)},${Math.round(70 - 45 * dark)},${Math.round(140 - 30 * dark)},${(dark * 0.75).toFixed(3)})`;
        ctx.fillRect(0, 0, g.w, g.h);
        ctx.restore();
      }
      const dusk = clamp(1 - Math.abs(hour - 19) / 2.5, 0, 1) + clamp(1 - Math.abs(hour - 5.5) / 2.5, 0, 1);
      if (dusk > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = `rgba(255,120,60,${(dusk * 0.22).toFixed(3)})`;
        ctx.fillRect(0, 0, g.w, g.h);
        ctx.restore();
      }
    }

    if (this.on('rain')) {
      const power = this.val('rain', 'power', 0.6);
      const want = Math.round(power * 130);
      this._drops = this._drops || [];
      while (this._drops.length < want) {
        this._drops.push({ x: rand(-40, g.w), y: rand(0, g.h), sp: rand(500, 900), len: rand(8, 18) });
      }
      if (this._drops.length > want) this._drops.length = want;
      ctx.save();
      ctx.strokeStyle = 'rgba(160,200,255,.5)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (const d of this._drops) {
        d.y += d.sp * dt;
        d.x += d.sp * 0.22 * dt;
        if (d.y > g.h + 20) { d.y = rand(-40, -5); d.x = rand(-40, g.w); }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.22, d.y + d.len);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(30,50,90,' + (power * 0.13).toFixed(3) + ')';
      ctx.fillRect(0, 0, g.w, g.h);
      ctx.restore();
    } else if (this._drops) {
      this._drops.length = 0;
    }

    if (this.on('cinema') && this.val('cinema', 'bars', true)) {
      const bar = Math.round(g.h * 0.07);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, g.w, bar);
      ctx.fillRect(0, g.h - bar, g.w, bar);
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
        const text = 'nursultan   ' + lines.join('   ');
        const w = ctx.measureText(text).width + 34;
        const x0 = g.w / 2 - w / 2;
        ctx.fillStyle = 'rgba(14,11,24,.72)';
        roundRect(ctx, x0, 8, w, 24, 8);
        ctx.fill();
        if (this.logo && this.logo.complete && this.logo.naturalWidth) {
          ctx.save();
          roundRect(ctx, x0 + 6, 12, 16, 16, 4);
          ctx.clip();
          ctx.drawImage(this.logo, x0 + 6, 12, 16, 16);
          ctx.restore();
        } else {
          ctx.fillStyle = this.accent;
          ctx.fillText('N', x0 + 9, 21);
        }
        ctx.fillStyle = this.accent;
        ctx.fillText('nursultan', x0 + 28, 21);
        ctx.fillStyle = '#e8e4ef';
        ctx.fillText(text.slice('nursultan'.length), x0 + 28 + ctx.measureText('nursultan').width, 21);
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
