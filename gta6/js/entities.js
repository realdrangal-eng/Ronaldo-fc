/* ============================================================
   GTA VI — pedestrians, police on foot, bullets, effects
   ============================================================ */

const SKINS = ['#f0c9a4', '#d9a677', '#a9744c', '#7a4b2c', '#5c3620'];
const SHIRTS = ['#ff4fa3', '#35d0d6', '#f5e04b', '#ffffff', '#7b3fe4',
                '#ff8a3d', '#4fd07a', '#e8e8ee', '#3f7bd8'];

class Ped {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 7;
    this.angle = rand(0, TAU);
    this.speed = rand(38, 58);
    this.hp = 30;
    this.dead = false;
    this.state = 'walk';
    this.timer = rand(1, 4);
    this.walk = rand(0, TAU);
    this.skin = pick(SKINS);
    this.shirt = pick(SHIRTS);
    this.pants = chance(0.5) ? '#2f3550' : '#4a4152';
    this.cash = randInt(15, 120);
  }

  update(dt, world) {
    if (this.dead) return;

    const p = world.player;
    const dp = dist(this.x, this.y, p.x, p.y);

    // Anything loud or fast nearby sends them running.
    if (world.panic > 0 && dp < 260) this.state = 'flee';
    if (!p.onFoot && p.vehicle && p.vehicle.kmh > 40 && dp < 90) this.state = 'flee';

    this.timer -= dt;
    if (this.state === 'flee') {
      this.angle = Math.atan2(this.y - p.y, this.x - p.x) + rand(-0.3, 0.3);
      this.speed = 105;
      if (this.timer <= 0) { this.state = 'walk'; this.speed = rand(38, 58); this.timer = rand(2, 5); }
    } else if (this.timer <= 0) {
      // Wander, biased along the street grid.
      this.angle = Math.round(rand(0, 3)) * (Math.PI / 2) + rand(-0.25, 0.25);
      this.timer = rand(1.5, 4.5);
    }

    const nx = this.x + Math.cos(this.angle) * this.speed * dt;
    const ny = this.y + Math.sin(this.angle) * this.speed * dt;
    this.x = nx;
    this.y = ny;

    for (const b of City.near(this.x, this.y, this.r + 2)) {
      if (resolveCircleRect(this, this.r, b)) this.timer = 0;
    }
    if (this.x < 6 || this.x > SEA_X - 6) { this.x = clamp(this.x, 6, SEA_X - 6); this.timer = 0; }
    if (this.y < 6 || this.y > WORLD_H - 6) { this.y = clamp(this.y, 6, WORLD_H - 6); this.timer = 0; }

    this.walk += this.speed * dt * 0.16;
  }

  hit(dmg, world) {
    this.hp -= dmg;
    world.blood(this.x, this.y);
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      world.onPedKilled(this);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.dead) {
      ctx.rotate(this.angle);
      ctx.fillStyle = 'rgba(120,10,20,.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 9, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = this.shirt;
      roundRect(ctx, -7, -4, 14, 8, 4);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 7, 5.5, 0, 0, TAU);
    ctx.fill();

    ctx.rotate(this.angle);
    const bob = Math.sin(this.walk) * 2.2;

    // Legs
    ctx.fillStyle = this.pants;
    ctx.fillRect(-2, -5, 5, 4);
    ctx.fillRect(-2, 1, 5, 4);

    // Arms swing opposite the legs
    ctx.fillStyle = this.skin;
    ctx.fillRect(1, -7 - bob * 0.4, 4, 3);
    ctx.fillRect(1, 4 + bob * 0.4, 4, 3);

    // Torso
    ctx.fillStyle = this.shirt;
    roundRect(ctx, -5, -5, 10, 10, 4);
    ctx.fill();

    // Head
    ctx.fillStyle = this.skin;
    ctx.beginPath();
    ctx.arc(2, 0, 3.6, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}

class Cop extends Ped {
  constructor(x, y) {
    super(x, y);
    this.hp = 60;
    this.shirt = '#1f2b52';
    this.pants = '#141a30';
    this.speed = 82;
    this.fireCool = rand(0.4, 1.2);
    this.isCop = true;
    this.cash = 0;
  }

  update(dt, world) {
    if (this.dead) return;
    const p = world.player;
    const d = dist(this.x, this.y, p.x, p.y);

    this.angle = Math.atan2(p.y - this.y, p.x - this.x);
    // Close in, but hold position once in firing range.
    const move = d > 150 ? 1 : d < 90 ? -0.5 : 0;
    this.x += Math.cos(this.angle) * this.speed * move * dt;
    this.y += Math.sin(this.angle) * this.speed * move * dt;

    for (const b of City.near(this.x, this.y, this.r + 2)) resolveCircleRect(this, this.r, b);

    this.fireCool -= dt;
    if (this.fireCool <= 0 && d < 300 && world.wanted > 0) {
      this.fireCool = rand(0.7, 1.5);
      world.spawnBullet(this.x, this.y, this.angle + rand(-0.12, 0.12), 620, 'cop', 9);
    }
    this.walk += this.speed * dt * 0.16 * Math.abs(move);
  }

  draw(ctx) {
    super.draw(ctx);
    if (this.dead) return;
    // Cap brim so cops read differently from civilians.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#0f1428';
    ctx.fillRect(3, -3, 3.5, 6);
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, a, speed, owner, dmg) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.life = 1.1;
    this.owner = owner;
    this.dmg = dmg;
    this.dead = false;
  }

  update(dt) {
    this.px = this.x;
    this.py = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.strokeStyle = this.owner === 'player' ? '#ffe66d' : '#ff8f6d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  }
}

class Particle {
  constructor(x, y, vx, vy, life, color, size, gravity) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.max = life;
    this.color = color;
    this.size = size;
    this.g = gravity || 0;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.4, dt);
    this.vy = this.vy * Math.pow(0.4, dt) + this.g * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.globalAlpha = clamp(this.life / this.max, 0, 1);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (this.life / this.max) + 0.6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class Pickup {
  constructor(x, y, kind, value) {
    this.x = x; this.y = y;
    this.kind = kind;              // 'cash' | 'health' | 'armor'
    this.value = value;
    this.r = 13;
    this.dead = false;
    this.t = rand(0, TAU);
  }

  update(dt) { this.t += dt * 3; }

  draw(ctx) {
    const bob = Math.sin(this.t) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = this.kind === 'cash' ? '#4fd07a' : this.kind === 'health' ? '#ff5a7a' : '#3f9bd8';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = this.kind === 'cash' ? '#2fa85e' : this.kind === 'health' ? '#e83f60' : '#2f7fb8';
    roundRect(ctx, -8, -6, 16, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.kind === 'cash' ? '$' : this.kind === 'health' ? '+' : 'A', 0, 0);
    ctx.restore();
  }
}
