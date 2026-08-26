/* ============================================================
   GTA VI — vehicles: physics, traffic AI, rendering
   ============================================================ */

const CAR_COLORS = [
  '#ff4fa3', '#35d0d6', '#ff8a3d', '#f5e04b', '#7b3fe4',
  '#e8e8ee', '#2d2d38', '#4fd07a', '#ff5a52', '#3f7bd8'
];

const VEHICLE_TYPES = {
  sedan:  { w: 52, h: 26, accel: 280, max: 250, turn: 2.7, mass: 1,   hp: 100, name: 'Vetir' },
  sports: { w: 54, h: 25, accel: 430, max: 360, turn: 3.1, mass: 0.9, hp: 85,  name: 'Alvino V1' },
  suv:    { w: 58, h: 30, accel: 250, max: 225, turn: 2.3, mass: 1.4, hp: 140, name: 'Bruiser' },
  van:    { w: 64, h: 30, accel: 220, max: 200, turn: 2.0, mass: 1.6, hp: 150, name: 'Boxville' },
  taxi:   { w: 54, h: 27, accel: 280, max: 250, turn: 2.7, mass: 1,   hp: 100, name: 'Cabbie' },
  police: { w: 56, h: 28, accel: 390, max: 330, turn: 2.9, mass: 1.1, hp: 130, name: 'Cruiser' },
  bike:   { w: 34, h: 16, accel: 480, max: 390, turn: 3.6, mass: 0.5, hp: 45,  name: 'Principe' }
};

class Vehicle {
  constructor(x, y, angle, type, color) {
    const def = VEHICLE_TYPES[type];
    this.type = type;
    this.def = def;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = 0;
    this.vy = 0;
    this.w = def.w;
    this.h = def.h;
    this.r = def.w * 0.42;
    this.color = color || pick(CAR_COLORS);
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.driver = null;        // null | 'player' | 'traffic' | 'cop'
    this.foot = false;         // cruiser has already dropped officers
    this.dead = false;
    this.burning = 0;

    // Traffic state
    this.axis = 'h';
    this.dir = 1;
    this.lane = 0;
    this.cool = 0;

    this.throttle = 0;
    this.steer = 0;
    this.brake = false;
  }

  get speed() {
    const fx = Math.cos(this.angle), fy = Math.sin(this.angle);
    return this.vx * fx + this.vy * fy;
  }

  get kmh() {
    return Math.abs(this.speed) * 0.45;
  }

  /** Arcade top-down handling: forward thrust, damped lateral slide. */
  physics(dt) {
    const fx = Math.cos(this.angle), fy = Math.sin(this.angle);
    let fwd = this.vx * fx + this.vy * fy;
    let lat = -this.vx * fy + this.vy * fx;

    const d = this.def;
    fwd += this.throttle * d.accel * dt;
    if (this.brake) fwd *= Math.pow(0.02, dt);
    fwd *= Math.pow(0.55, dt);                       // rolling drag
    fwd = clamp(fwd, -d.max * 0.45, d.max);

    // Handbrake breaks traction and lets the car slide.
    const grip = this.brake ? 0.55 : 0.008;
    lat *= Math.pow(grip, dt);

    const grounded = clamp(Math.abs(fwd) / (d.max * 0.5), 0, 1);
    this.angle += this.steer * d.turn * dt * grounded * Math.sign(fwd || 1);

    const nfx = Math.cos(this.angle), nfy = Math.sin(this.angle);
    this.vx = nfx * fwd - nfy * lat;
    this.vy = nfy * fwd + nfx * lat;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.burning > 0) {
      this.burning -= dt;
      this.hp -= 14 * dt;
      if (this.hp <= 0) this.dead = true;
    }
  }

  collideWorld() {
    let hit = false;
    for (const b of City.near(this.x, this.y, this.r + 4)) {
      if (resolveCircleRect(this, this.r, b)) hit = true;
    }
    this.x = clamp(this.x, 8, WORLD_W - 8);
    this.y = clamp(this.y, 8, WORLD_H - 8);

    if (hit) {
      const impact = Math.hypot(this.vx, this.vy);
      this.vx *= -0.18;
      this.vy *= -0.18;
      if (impact > 190) this.damage(impact * 0.035);
      return impact;
    }
    // Deep water drowns the engine.
    if (this.x > SEA_X + 30) {
      this.vx *= 0.86;
      this.vy *= 0.86;
      this.damage(22 * (1 / 60));
    }
    return 0;
  }

  damage(n) {
    this.hp -= n;
    if (this.hp <= 30 && this.burning <= 0 && this.hp > 0) this.burning = 6;
    if (this.hp <= 0) this.dead = true;
  }

  /* ------------------------------------------------------------ traffic -- */

  initTraffic() {
    this.driver = 'traffic';
    this.cruise = rand(120, 190);
  }

  /** Follow the lane, brake for whatever is ahead, turn at junctions. */
  driveTraffic(dt, world) {
    const horizontal = this.axis === 'h';
    const pos = horizontal ? this.y : this.x;      // the across-lane coordinate
    const desired = horizontal
      ? (this.dir > 0 ? 0 : Math.PI)
      : (this.dir > 0 ? Math.PI / 2 : -Math.PI / 2);

    // Steer back onto the lane line. Which way that bends the heading flips
    // with both the axis and the direction of travel.
    const off = this.lane - pos;
    const correct = clamp(off * 0.014, -0.7, 0.7) * this.dir;
    const want = desired + (horizontal ? correct : -correct);
    this.steer = clamp(angleDelta(this.angle, want) * 1.8, -1, 1);

    // Look ahead for traffic or the player's car.
    const fx = Math.cos(this.angle), fy = Math.sin(this.angle);
    let blocked = false;
    const ahead = 46 + Math.abs(this.speed) * 0.22;
    for (const other of world.vehicles) {
      if (other === this || other.dead) continue;
      const dx = other.x - this.x, dy = other.y - this.y;
      if (dx * fx + dy * fy < 6) continue;
      if (Math.hypot(dx, dy) < ahead && Math.abs(-dx * fy + dy * fx) < 26) { blocked = true; break; }
    }
    if (!blocked && world.player.onFoot) {
      const dx = world.player.x - this.x, dy = world.player.y - this.y;
      if (dx * fx + dy * fy > 6 && Math.hypot(dx, dy) < ahead * 0.8 &&
          Math.abs(-dx * fy + dy * fx) < 22) blocked = true;
    }

    this.throttle = blocked ? 0 : (Math.abs(this.speed) < this.cruise ? 1 : 0.25);
    this.brake = blocked && Math.abs(this.speed) > 30;

    // At a junction, sometimes turn onto the crossing road.
    this.cool -= dt;
    if (this.cool <= 0) {
      const cross = this.axis === 'h' ? this.x : this.y;
      const nearest = City.snapToLane(cross);
      if (Math.abs(cross - nearest) < 12 && chance(0.35)) {
        this.axis = this.axis === 'h' ? 'v' : 'h';
        this.dir = chance(0.5) ? 1 : -1;
        const along = this.axis === 'h' ? this.y : this.x;
        this.lane = City.snapToLane(along) + (this.dir > 0 ? 22 : -22);
        this.cool = 1.4;
      } else if (Math.abs(cross - nearest) < 12) {
        this.cool = 0.9;
      }
    }
  }

  /** Police pursuit: aim at the target and keep the throttle down. */
  drivePolice(dt, tx, ty) {
    const want = Math.atan2(ty - this.y, tx - this.x);
    this.steer = clamp(angleDelta(this.angle, want) * 2.2, -1, 1);
    const d = dist(this.x, this.y, tx, ty);
    this.throttle = d > 90 ? 1 : 0.15;
    this.brake = d < 60 && Math.abs(this.speed) > 120;
  }

  /* ---------------------------------------------------------- rendering -- */

  draw(ctx) {
    const w = this.w, h = this.h;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.save();
    ctx.rotate(this.angle);
    roundRect(ctx, -w / 2 + 4, -h / 2 + 5, w, h, 7);
    ctx.fill();
    ctx.restore();

    ctx.rotate(this.angle);

    if (this.type === 'bike') {
      ctx.fillStyle = '#22212a';
      roundRect(ctx, -w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.fillStyle = this.color;
      roundRect(ctx, -w * 0.18, -h / 2 + 1, w * 0.5, h - 2, 5);
      ctx.fill();
      ctx.fillStyle = '#12121a';
      ctx.fillRect(w * 0.28, -h / 2 - 1, 6, h + 2);
      ctx.fillRect(-w * 0.44, -h / 2 - 1, 6, h + 2);
      ctx.restore();
      return;
    }

    // Wheels
    ctx.fillStyle = '#17161d';
    const wx = w * 0.28, wy = h / 2;
    for (const sx of [-wx, wx]) {
      for (const sy of [-wy, wy]) {
        ctx.fillRect(sx - 6, sy - 3.5, 12, 7);
      }
    }

    // Body
    ctx.fillStyle = this.color;
    roundRect(ctx, -w / 2, -h / 2, w, h, 8);
    ctx.fill();

    // Cabin
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    roundRect(ctx, -w * 0.14, -h / 2 + 2, w * 0.4, h - 4, 5);
    ctx.fill();

    // Windscreen and rear window
    ctx.fillStyle = '#16283a';
    roundRect(ctx, w * 0.10, -h / 2 + 3.5, w * 0.16, h - 7, 3);
    ctx.fill();
    roundRect(ctx, -w * 0.30, -h / 2 + 4, w * 0.12, h - 8, 3);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#fff6c9';
    ctx.fillRect(w / 2 - 4, -h / 2 + 3, 3, 5);
    ctx.fillRect(w / 2 - 4, h / 2 - 8, 3, 5);
    ctx.fillStyle = '#d8443a';
    ctx.fillRect(-w / 2 + 1, -h / 2 + 3, 3, 5);
    ctx.fillRect(-w / 2 + 1, h / 2 - 8, 3, 5);

    if (this.type === 'taxi') {
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(-w * 0.06, -h / 2 - 2, 14, 5);
    }

    ctx.restore();

    // Police light bar flashes in world space so it reads at a glance.
    if (this.type === 'police') {
      const t = performance.now() * 0.008;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const red = Math.sin(t) > 0;
      ctx.fillStyle = red ? '#ff2d3d' : '#2d6bff';
      ctx.fillRect(-4, -h / 2 - 1, 8, 4);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = red ? '#ff2d3d' : '#2d6bff';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (this.burning > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#3a3a44';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(rand(-8, 8), rand(-8, 8), rand(5, 11), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
