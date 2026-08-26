/* ============================================================
   GTA VI — Vice Beach: world simulation and game loop
   ============================================================ */

const MAX_PEDS = 34;
const MAX_TRAFFIC = 22;
const SPAWN_R = 720;      // spawn just outside this ring
const DESPAWN_R = 1300;

const Game = {
  canvas: null,
  ctx: null,
  w: 0, h: 0, scale: 1,
  state: 'title',          // title | play | dead | paused
  time: 0,
  last: 0,

  player: null,
  vehicles: [],
  peds: [],
  bullets: [],
  particles: [],
  pickups: [],

  camX: 0, camY: 0,
  shake: 0,
  wanted: 0,
  wantedHeat: 0,
  panic: 0,
  copTimer: 0,
  mission: null,
  missionMarker: null,
  toast: null,
  stats: null,

  /* -------------------------------------------------------------- setup -- */

  boot(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    City.build();
    this.reset();
    UI.init(this);
    this.last = performance.now();
    requestAnimationFrame(t => this.frame(t));
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = clamp(Math.min(this.w, this.h) / 480, 0.70, 1.15);
  },

  reset() {
    this.vehicles.length = 0;
    this.peds.length = 0;
    this.bullets.length = 0;
    this.particles.length = 0;
    this.pickups.length = 0;
    this.wanted = 0;
    this.wantedHeat = 0;
    this.panic = 0;
    this.mission = null;
    this.toast = null;
    this.stats = { kills: 0, earned: 0, best: 0, distance: 0 };

    this.player = {
      x: 3 * BLOCK + 22, y: 4 * BLOCK, angle: 0,
      r: 8, hp: 100, maxHp: 100, armor: 0, cash: 500,
      onFoot: true, vehicle: null,
      fireCool: 0, walk: 0, enterCool: 0,
      skin: SKINS[0], shirt: '#f2f2f7', pants: '#2b3350'
    };

    this.camX = this.player.x;
    this.camY = this.player.y;

    // A car waiting at the kerb, so the first thing you can do is drive.
    const start = new Vehicle(3 * BLOCK + 22, 4 * BLOCK + 54, -Math.PI / 2, 'sports', '#35d0d6');
    this.vehicles.push(start);

    this.placeMissionMarker();
    for (let i = 0; i < 14; i++) this.spawnTraffic(true);
    for (let i = 0; i < 20; i++) this.spawnPed(true);
  },

  /* ----------------------------------------------------------- spawning -- */

  /** A point on the road ring around the player, out of view. */
  ringPoint(inner, outer) {
    for (let i = 0; i < 40; i++) {
      const a = rand(0, TAU);
      const d = rand(inner, outer);
      const x = this.player.x + Math.cos(a) * d;
      const y = this.player.y + Math.sin(a) * d;
      if (x < 40 || y < 40 || x > SHORE_X - 40 || y > WORLD_H - 40) continue;
      return { x, y };
    }
    return null;
  },

  spawnTraffic(anywhere) {
    if (this.vehicles.length >= MAX_TRAFFIC + 6) return;
    const p = anywhere
      ? { x: rand(60, SHORE_X - 60), y: rand(60, WORLD_H - 60) }
      : this.ringPoint(SPAWN_R, SPAWN_R + 240);
    if (!p) return;

    const horizontal = chance(0.5);
    const dir = chance(0.5) ? 1 : -1;
    const lane = City.snapToLane(horizontal ? p.y : p.x) + (dir > 0 ? 22 : -22);
    if (horizontal) p.y = lane; else p.x = lane;
    if (p.x < 30 || p.x > SHORE_X - 30 || p.y < 30 || p.y > WORLD_H - 30) return;
    if (City.isSolid(p.x, p.y)) return;
    if (dist(p.x, p.y, this.player.x, this.player.y) < 140) return;

    const type = pick(['sedan', 'sedan', 'suv', 'taxi', 'van', 'sports', 'bike']);
    const v = new Vehicle(p.x, p.y, horizontal ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2), type);
    v.initTraffic();
    v.axis = horizontal ? 'h' : 'v';
    v.dir = dir;
    v.lane = lane;
    this.vehicles.push(v);
  },

  spawnPed(anywhere) {
    if (this.peds.length >= MAX_PEDS + 8) return;
    const p = anywhere
      ? { x: rand(60, SHORE_X - 60), y: rand(60, WORLD_H - 60) }
      : this.ringPoint(SPAWN_R * 0.7, SPAWN_R);
    if (!p || City.isSolid(p.x, p.y)) return;
    if (dist(p.x, p.y, this.player.x, this.player.y) < 120) return;
    this.peds.push(new Ped(p.x, p.y));
  },

  spawnCopCar() {
    const p = this.ringPoint(SPAWN_R * 0.75, SPAWN_R + 160);
    if (!p) return;
    const v = new Vehicle(p.x, p.y, rand(0, TAU), 'police', '#f4f6fb');
    v.driver = 'cop';
    this.vehicles.push(v);
  },

  spawnCopFoot(x, y) {
    const c = new Cop(x, y);
    this.peds.push(c);
  },

  /* ------------------------------------------------------------ actions -- */

  spawnBullet(x, y, a, speed, owner, dmg) {
    this.bullets.push(new Bullet(x + Math.cos(a) * 12, y + Math.sin(a) * 12, a, speed, owner, dmg));
    this.particles.push(new Particle(x + Math.cos(a) * 14, y + Math.sin(a) * 14,
      Math.cos(a) * 60, Math.sin(a) * 60, 0.1, '#ffd86b', 3));
    if (owner === 'player') {
      this.panic = 2.5;
      this.shake = Math.min(this.shake + 1.6, 8);
    }
  },

  blood(x, y) {
    for (let i = 0; i < 6; i++) {
      const a = rand(0, TAU);
      this.particles.push(new Particle(x, y, Math.cos(a) * rand(40, 130), Math.sin(a) * rand(40, 130),
        rand(0.3, 0.6), '#b3122a', rand(1.5, 3)));
    }
  },

  boom(x, y) {
    this.shake = 14;
    for (let i = 0; i < 26; i++) {
      const a = rand(0, TAU), s = rand(60, 320);
      this.particles.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s,
        rand(0.4, 1.1), pick(['#ff8a3d', '#ffd86b', '#ff4f4f', '#5a5560']), rand(2, 6)));
    }
  },

  say(text, ms) {
    // this.time counts seconds; callers pass milliseconds.
    this.toast = { text, until: this.time + (ms || 3200) / 1000 };
  },

  addWanted(n) {
    const before = this.wanted;
    this.wanted = clamp(this.wanted + n, 0, 5);
    this.wantedHeat = 14;
    if (this.wanted > before) {
      this.say(this.wanted >= 4 ? 'The whole department is on you!' : 'Wanted level up', 2200);
    }
  },

  onPedKilled(ped) {
    this.stats.kills++;
    if (ped.cash > 0) this.pickups.push(new Pickup(ped.x, ped.y, 'cash', ped.cash));
    this.panic = 3;
    if (ped.isCop) this.addWanted(this.wanted < 3 ? 3 - this.wanted : 1);
    else if (this.wanted < 2) this.addWanted(2 - this.wanted);
    else this.wantedHeat = 14;

    if (this.mission && this.mission.type === 'rampage') {
      this.mission.done++;
      if (this.mission.done >= this.mission.need) this.finishMission(true);
    }
  },

  /* -------------------------------------------------------------- loop --- */

  frame(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    if (this.state === 'play') {
      this.time += dt;
      this.update(dt);
    }
    this.render();
    UI.sync();
    requestAnimationFrame(t => this.frame(t));
  },

  update(dt) {
    const p = this.player;
    this.panic = Math.max(0, this.panic - dt);
    this.shake = Math.max(0, this.shake - dt * 14);

    this.updatePlayer(dt);

    // Vehicles
    for (const v of this.vehicles) {
      if (v.dead) continue;
      if (v.driver === 'player') {
        // controlled in updatePlayer
      } else if (v.driver === 'cop') {
        v.drivePolice(dt, p.x, p.y);
      } else if (v.driver === 'traffic') {
        v.driveTraffic(dt, this);
      } else {
        v.throttle = 0;
        v.steer = 0;
      }
      v.physics(dt);
      const impact = v.collideWorld();
      if (impact > 260 && v.driver === 'player') this.shake = Math.min(this.shake + 5, 14);
    }
    this.vehicleCollisions(dt);

    for (const ped of this.peds) ped.update(dt, this);
    for (const b of this.bullets) { b.update(dt); this.bulletHits(b); }
    for (const q of this.particles) q.update(dt);
    for (const k of this.pickups) {
      k.update(dt);
      if (dist(k.x, k.y, p.x, p.y) < 22) {
        if (k.kind === 'cash') { p.cash += k.value; this.stats.earned += k.value; }
        else if (k.kind === 'health') p.hp = Math.min(p.maxHp, p.hp + k.value);
        else p.armor = Math.min(100, p.armor + k.value);
        k.dead = true;
      }
    }

    this.updateWanted(dt);
    this.updateMission(dt);
    this.cull();
    this.camera(dt);

    if (p.hp <= 0) this.wasted();
  },

  updatePlayer(dt) {
    const p = this.player;
    p.enterCool = Math.max(0, p.enterCool - dt);
    p.fireCool = Math.max(0, p.fireCool - dt);

    const inp = Input.axes;
    const mag = Math.hypot(inp.x, inp.y);

    if (p.onFoot) {
      const sp = 132;
      if (mag > 0.12) {
        p.x += (inp.x / mag) * sp * dt * Math.min(mag, 1);
        p.y += (inp.y / mag) * sp * dt * Math.min(mag, 1);
        p.angle = Math.atan2(inp.y, inp.x);
        p.walk += sp * dt * 0.15;
      }
      for (const b of City.near(p.x, p.y, p.r + 2)) resolveCircleRect(p, p.r, b);
      p.x = clamp(p.x, 6, WORLD_W - 6);
      p.y = clamp(p.y, 6, WORLD_H - 6);

      // Aim at the pointer on desktop, at the heading on touch.
      if (Input.aimActive) p.angle = Math.atan2(Input.aim.y - p.y, Input.aim.x - p.x);

      if (Input.fire && p.fireCool <= 0) {
        p.fireCool = 0.14;
        this.spawnBullet(p.x, p.y, p.angle + rand(-0.05, 0.05), 780, 'player', 26);
      }
    } else if (p.vehicle) {
      const v = p.vehicle;
      v.throttle = -inp.y;                 // up = forward
      v.steer = inp.x;
      v.brake = Input.brake;
      p.x = v.x;
      p.y = v.y;
      p.angle = v.angle;
      this.stats.distance += Math.abs(v.speed) * dt;

      // Running people over is a crime, and the city notices.
      for (const ped of this.peds) {
        if (ped.dead) continue;
        if (dist(ped.x, ped.y, v.x, v.y) < v.r + 8 && Math.abs(v.speed) > 90) {
          ped.hit(100, this);
          this.shake = Math.min(this.shake + 4, 12);
        }
      }
      if (v.dead) this.ejectPlayer(true);
    }

    if (Input.enter && p.enterCool <= 0) {
      p.enterCool = 0.45;
      Input.enter = false;
      p.onFoot ? this.tryEnter() : this.ejectPlayer(false);
    }
  },

  tryEnter() {
    const p = this.player;
    let best = null, bd = 80 * 80;
    for (const v of this.vehicles) {
      if (v.dead || v.driver === 'player') continue;
      const d = dist2(v.x, v.y, p.x, p.y);
      if (d < bd) { bd = d; best = v; }
    }
    if (!best) return;

    if (best.driver === 'cop') this.addWanted(1);
    best.driver = 'player';
    p.vehicle = best;
    p.onFoot = false;
    this.say(best.def.name, 1600);
  },

  ejectPlayer(forced) {
    const p = this.player;
    const v = p.vehicle;
    if (!v) return;
    p.onFoot = true;
    p.vehicle = null;
    if (v.dead) {
      this.boom(v.x, v.y);
      p.hp -= 18;
    } else {
      v.driver = null;
      v.throttle = 0;
    }
    // Step out to the side of the car.
    const side = v.angle + Math.PI / 2;
    p.x = v.x + Math.cos(side) * 26;
    p.y = v.y + Math.sin(side) * 26;
    for (const b of City.near(p.x, p.y, p.r + 2)) resolveCircleRect(p, p.r, b);
    void forced;
  },

  vehicleCollisions() {
    for (let i = 0; i < this.vehicles.length; i++) {
      const a = this.vehicles[i];
      if (a.dead) continue;
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const b = this.vehicles[j];
        if (b.dead) continue;
        const d = dist(a.x, a.y, b.x, b.y);
        const min = a.r + b.r;
        if (d >= min || d === 0) continue;

        const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d;
        const push = (min - d) / 2;
        const ma = a.def.mass, mb = b.def.mass;
        a.x -= nx * push * (mb / (ma + mb)) * 2;
        a.y -= ny * push * (mb / (ma + mb)) * 2;
        b.x += nx * push * (ma / (ma + mb)) * 2;
        b.y += ny * push * (ma / (ma + mb)) * 2;

        const rel = Math.hypot(a.vx - b.vx, a.vy - b.vy);
        if (rel > 150) {
          a.damage(rel * 0.02 * mb);
          b.damage(rel * 0.02 * ma);
          a.vx *= 0.55; a.vy *= 0.55;
          b.vx *= 0.55; b.vy *= 0.55;
          if (a.driver === 'player' || b.driver === 'player') {
            this.shake = Math.min(this.shake + 4, 12);
            const cop = a.driver === 'cop' || b.driver === 'cop';
            if (cop) this.addWanted(this.wanted < 2 ? 1 : 0);
          }
        }
      }
    }
  },

  bulletHits(b) {
    if (b.dead) return;

    if (b.x < 0 || b.y < 0 || b.x > WORLD_W || b.y > WORLD_H) { b.dead = true; return; }
    if (City.isSolid(b.x, b.y)) {
      b.dead = true;
      this.particles.push(new Particle(b.x, b.y, rand(-40, 40), rand(-40, 40), 0.25, '#d8d2c4', 2));
      return;
    }

    if (b.owner === 'player') {
      for (const ped of this.peds) {
        if (ped.dead) continue;
        if (dist(b.x, b.y, ped.x, ped.y) < ped.r + 4) { ped.hit(b.dmg, this); b.dead = true; return; }
      }
      for (const v of this.vehicles) {
        if (v.dead || v.driver === 'player') continue;
        if (dist(b.x, b.y, v.x, v.y) < v.r + 3) {
          v.damage(b.dmg * 0.55);
          this.particles.push(new Particle(b.x, b.y, rand(-60, 60), rand(-60, 60), 0.25, '#ffd86b', 2));
          b.dead = true;
          if (v.dead) this.boom(v.x, v.y);
          return;
        }
      }
    } else {
      const p = this.player;
      if (dist(b.x, b.y, p.x, p.y) < (p.onFoot ? p.r + 4 : (p.vehicle ? p.vehicle.r : p.r))) {
        b.dead = true;
        if (p.onFoot) {
          const soak = Math.min(p.armor, b.dmg * 0.6);
          p.armor -= soak;
          p.hp -= (b.dmg - soak);
          this.blood(p.x, p.y);
          this.shake = Math.min(this.shake + 3, 10);
        } else if (p.vehicle) {
          p.vehicle.damage(b.dmg * 0.5);
        }
      }
    }
  },

  updateWanted(dt) {
    if (this.wanted <= 0) return;
    const p = this.player;

    this.wantedHeat -= dt;
    if (this.wantedHeat <= 0) {
      let seen = false;
      for (const v of this.vehicles) {
        if (v.driver === 'cop' && !v.dead && dist(v.x, v.y, p.x, p.y) < 420) { seen = true; break; }
      }
      if (!seen) {
        this.wanted--;
        this.wantedHeat = 9;
        if (this.wanted === 0) {
          this.say('You lost the cops', 2600);
          if (this.mission && this.mission.type === 'escape') this.finishMission(true);
        }
      } else {
        this.wantedHeat = 3;
      }
    }

    // Keep roughly one cruiser per star on the road.
    this.copTimer -= dt;
    let cops = 0;
    for (const v of this.vehicles) if (v.driver === 'cop' && !v.dead) cops++;
    if (cops < this.wanted && this.copTimer <= 0) {
      this.spawnCopCar();
      this.copTimer = 2.4;
    }

    // Cruisers close to a player on foot drop officers.
    for (const v of this.vehicles) {
      if (v.driver !== 'cop' || v.dead) continue;
      if (v.foot) continue;
      if (dist(v.x, v.y, p.x, p.y) < 190 && Math.abs(v.speed) < 60) {
        v.foot = true;
        this.spawnCopFoot(v.x + rand(-20, 20), v.y + rand(-20, 20));
        if (this.wanted >= 3) this.spawnCopFoot(v.x + rand(-20, 20), v.y + rand(-20, 20));
      }
    }
  },

  /* ------------------------------------------------------------ missions -- */

  placeMissionMarker() {
    for (let i = 0; i < 60; i++) {
      const x = rand(120, SHORE_X - 120);
      const y = rand(120, WORLD_H - 120);
      if (!City.onRoad(x, y) || City.isSolid(x, y)) continue;
      if (dist(x, y, this.player.x, this.player.y) < 300) continue;
      this.missionMarker = { x, y };
      return;
    }
    this.missionMarker = { x: 2 * BLOCK, y: 2 * BLOCK };
  },

  startMission() {
    const kinds = ['delivery', 'rampage', 'escape'];
    const type = pick(kinds);
    this.missionMarker = null;

    if (type === 'delivery') {
      const stops = [];
      for (let i = 0; i < 3; i++) {
        let pt = null;
        for (let k = 0; k < 60 && !pt; k++) {
          const x = rand(120, SHORE_X - 120), y = rand(120, WORLD_H - 120);
          if (City.onRoad(x, y) && !City.isSolid(x, y)) pt = { x, y };
        }
        stops.push(pt || { x: BLOCK * (i + 2), y: BLOCK * 2 });
      }
      this.mission = { type, stops, at: 0, timer: 105, reward: 3000,
        title: 'DROP-OFF', desc: 'Hit all 3 drops before the clock runs out.' };
      this.say('Mission: DROP-OFF', 3000);
    } else if (type === 'rampage') {
      this.mission = { type, need: 8, done: 0, timer: 70, reward: 2500,
        title: 'RAMPAGE', desc: 'Take out 8 targets.' };
      this.addWanted(2);
      this.say('Mission: RAMPAGE', 3000);
    } else {
      this.mission = { type, timer: 90, reward: 4000,
        title: 'GETAWAY', desc: 'Shake off the cops.' };
      this.addWanted(3);
      this.say('Mission: GETAWAY', 3000);
    }
  },

  updateMission(dt) {
    if (this.missionMarker && dist(this.player.x, this.player.y,
        this.missionMarker.x, this.missionMarker.y) < 34) {
      this.startMission();
      return;
    }
    const m = this.mission;
    if (!m) return;

    m.timer -= dt;
    if (m.timer <= 0) { this.finishMission(false); return; }

    if (m.type === 'delivery') {
      const s = m.stops[m.at];
      if (s && dist(this.player.x, this.player.y, s.x, s.y) < 40) {
        m.at++;
        if (m.at >= m.stops.length) this.finishMission(true);
        else this.say('Drop ' + m.at + ' of ' + m.stops.length, 1800);
      }
    }
  },

  finishMission(win) {
    const m = this.mission;
    if (!m) return;
    if (win) {
      this.player.cash += m.reward;
      this.stats.earned += m.reward;
      this.say('MISSION PASSED  +' + fmtMoney(m.reward), 3600);
    } else {
      this.say('MISSION FAILED', 3000);
    }
    this.mission = null;
    setTimeout(() => { if (!this.mission) this.placeMissionMarker(); }, 2500);
  },

  wasted() {
    this.state = 'dead';
    const p = this.player;
    this.boom(p.x, p.y);
    if (p.vehicle) { p.vehicle.driver = null; p.vehicle = null; p.onFoot = true; }
    this.stats.best = Math.max(this.stats.best, p.cash);
    UI.showWasted();
  },

  respawn() {
    const p = this.player;
    p.hp = p.maxHp;
    p.armor = 0;
    p.cash = Math.max(0, Math.floor(p.cash * 0.9));
    p.onFoot = true;
    p.vehicle = null;
    p.x = 2 * BLOCK + 22;
    p.y = 2 * BLOCK;
    this.wanted = 0;
    this.mission = null;
    this.peds = this.peds.filter(q => !q.isCop);
    this.vehicles = this.vehicles.filter(v => v.driver !== 'cop');
    this.camX = p.x;
    this.camY = p.y;
    this.placeMissionMarker();
    this.state = 'play';
  },

  /* ----------------------------------------------------- housekeeping ---- */

  cull() {
    const p = this.player;
    this.bullets = this.bullets.filter(b => !b.dead);
    this.particles = this.particles.filter(q => !q.dead);
    this.pickups = this.pickups.filter(k => !k.dead);

    this.vehicles = this.vehicles.filter(v => {
      if (v.driver === 'player') return true;
      if (v.dead && v.burning <= 0) return false;
      return dist(v.x, v.y, p.x, p.y) < DESPAWN_R;
    });
    this.peds = this.peds.filter(q => {
      const d = dist(q.x, q.y, p.x, p.y);
      if (q.dead) return d < 500;
      return d < DESPAWN_R;
    });

    let traffic = 0;
    for (const v of this.vehicles) if (v.driver === 'traffic') traffic++;
    if (traffic < MAX_TRAFFIC && chance(0.35)) this.spawnTraffic(false);

    let civ = 0;
    for (const q of this.peds) if (!q.dead && !q.isCop) civ++;
    if (civ < MAX_PEDS && chance(0.4)) this.spawnPed(false);
  },

  camera(dt) {
    const p = this.player;
    // Look ahead of a moving car so you can see where you're going.
    let tx = p.x, ty = p.y;
    if (!p.onFoot && p.vehicle) {
      tx += p.vehicle.vx * 0.32;
      ty += p.vehicle.vy * 0.32;
    }
    const k = 1 - Math.pow(0.0015, dt);
    this.camX = lerp(this.camX, tx, k);
    this.camY = lerp(this.camY, ty, k);
  },

  /* ----------------------------------------------------------- rendering -- */

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#0e0b18';
    ctx.fillRect(0, 0, this.w, this.h);

    if (this.state === 'title') { ctx.restore(); return; }

    const s = this.scale;
    let sx = 0, sy = 0;
    if (this.shake > 0.2) {
      sx = rand(-this.shake, this.shake);
      sy = rand(-this.shake, this.shake);
    }

    ctx.translate(this.w / 2 + sx, this.h / 2 + sy);
    ctx.scale(s, s);
    ctx.translate(-this.camX, -this.camY);

    const view = {
      x: this.camX - this.w / 2 / s - 40,
      y: this.camY - this.h / 2 / s - 40,
      w: this.w / s + 80,
      h: this.h / s + 80
    };

    City.drawGround(ctx, view, this.time * 1000);
    City.drawProps(ctx, view);
    City.drawBuildings(ctx, view, this.camX, this.camY);

    this.drawMarkers(ctx);
    for (const k of this.pickups) k.draw(ctx);
    for (const q of this.particles) q.draw(ctx);
    for (const ped of this.peds) if (ped.dead) ped.draw(ctx);
    for (const v of this.vehicles) if (!v.dead || v.burning > 0) v.draw(ctx);
    for (const ped of this.peds) if (!ped.dead) ped.draw(ctx);
    if (this.player.onFoot) this.drawPlayer(ctx);
    for (const b of this.bullets) b.draw(ctx);

    City.drawDetail(ctx, view, this.time * 1000);
    ctx.restore();
  },

  drawMarkers(ctx) {
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.2;
    const spots = [];
    if (this.missionMarker) spots.push({ ...this.missionMarker, c: '#f5e04b' });
    if (this.mission && this.mission.type === 'delivery') {
      const s = this.mission.stops[this.mission.at];
      if (s) spots.push({ x: s.x, y: s.y, c: '#35d0d6' });
    }
    for (const s of spots) {
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 30, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = s.c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 30, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  },

  drawPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 8, 6, 0, 0, TAU);
    ctx.fill();

    ctx.rotate(p.angle);
    const bob = Math.sin(p.walk) * 2.4;

    ctx.fillStyle = p.pants;
    ctx.fillRect(-2, -6, 5, 5);
    ctx.fillRect(-2, 1, 5, 5);

    ctx.fillStyle = p.skin;
    ctx.fillRect(1, -8 - bob * 0.4, 5, 3);
    ctx.fillRect(1, 5 + bob * 0.4, 5, 3);

    ctx.fillStyle = p.shirt;
    roundRect(ctx, -6, -6, 12, 12, 5);
    ctx.fill();

    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, TAU);
    ctx.fill();

    // Pistol
    ctx.fillStyle = '#22222c';
    ctx.fillRect(5, -1.5, 8, 3);
    ctx.restore();
  }
};
