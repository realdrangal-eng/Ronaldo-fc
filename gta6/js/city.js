/* ============================================================
   GTA VI — Vice Beach: city generation and rendering
   ============================================================ */

const BLOCK = 400;          // road centre to road centre
const ROAD_W = 92;          // asphalt width
const HALF_ROAD = ROAD_W / 2;
const COLS = 12;            // vertical roads (x = c * BLOCK)
const ROWS = 10;            // horizontal roads (y = r * BLOCK)

const CITY_W = COLS * BLOCK;
const BEACH_W = 340;
const SEA_W = 620;
const WORLD_W = CITY_W + BEACH_W + SEA_W;
const WORLD_H = ROWS * BLOCK;

const SHORE_X = CITY_W;             // sand starts here
const SEA_X = CITY_W + BEACH_W;     // water starts here

const PALETTE = {
  asphalt:   '#2b2733',
  asphaltHi: '#3a3547',
  lane:      '#f2e6a8',
  sidewalk:  '#565064',
  sidewalkHi:'#6b6480',
  sand:      '#e8d3a9',
  sandDark:  '#d6bd8c',
  sea:       '#1b7fa8',
  seaDeep:   '#125c7d',
  foam:      '#8fd8e8',
  grass:     '#3f7d4f',
  pool:      '#3fb9d6'
};

// Miami pastels for building roofs.
const ROOFS = [
  '#f5c8d8', '#f7dcc0', '#cfe9e4', '#e6d5f2', '#f9e7b8',
  '#d5e7f7', '#f2c7b3', '#cde8cf', '#e8d9c4', '#f0cfe6'
];
const WALLS = [
  '#a97f95', '#ab937b', '#8fa5a2', '#9b8bab', '#ada37c',
  '#93a3b3', '#a98a7c', '#8ea690', '#a2957f', '#a68ea0'
];

const City = {
  buildings: [],   // { x, y, w, h, hgt, roof, wall, neon }
  props: [],       // { type, x, y, r, a }
  grid: null,      // spatial index over buildings
  cell: 400,
  gw: 0, gh: 0,

  build() {
    this.buildings.length = 0;
    this.props.length = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.fillBlock(c, r);
      }
    }
    this.buildPalms();
    this.index();
  },

  /** Interior of one city block, inset from the surrounding roads. */
  fillBlock(c, r) {
    const pad = HALF_ROAD + 14;                 // road + sidewalk
    const x0 = c * BLOCK + pad;
    const y0 = r * BLOCK + pad;
    const size = BLOCK - pad * 2;

    // A few blocks are parks or parking lots instead of buildings.
    const roll = Math.random();
    if (roll < 0.10) {
      this.props.push({ type: 'park', x: x0, y: y0, w: size, h: size });
      const n = randInt(3, 6);
      for (let i = 0; i < n; i++) {
        this.props.push({
          type: 'palm',
          x: x0 + rand(20, size - 20),
          y: y0 + rand(20, size - 20),
          r: rand(13, 19)
        });
      }
      return;
    }
    if (roll < 0.16) {
      this.props.push({ type: 'lot', x: x0, y: y0, w: size, h: size });
      return;
    }

    // Otherwise split the lot into 1-4 buildings with an alley gap.
    const splitX = chance(0.65), splitY = chance(0.65);
    const gap = 12;
    const cuts = [];
    if (splitX && splitY) {
      const mx = rand(0.38, 0.62), my = rand(0.38, 0.62);
      cuts.push([0, 0, mx, my], [mx, 0, 1 - mx, my], [0, my, mx, 1 - my], [mx, my, 1 - mx, 1 - my]);
    } else if (splitX) {
      const mx = rand(0.38, 0.62);
      cuts.push([0, 0, mx, 1], [mx, 0, 1 - mx, 1]);
    } else if (splitY) {
      const my = rand(0.38, 0.62);
      cuts.push([0, 0, 1, my], [0, my, 1, 1 - my]);
    } else {
      cuts.push([0, 0, 1, 1]);
    }

    // Taller towers downtown (west), low-rise near the beach.
    const beachness = (c * BLOCK) / CITY_W;
    for (const [fx, fy, fw, fh] of cuts) {
      const bx = x0 + fx * size + gap / 2;
      const by = y0 + fy * size + gap / 2;
      const bw = fw * size - gap;
      const bh = fh * size - gap;
      if (bw < 34 || bh < 34) continue;

      const tall = rand(0.25, 1) * (1 - beachness * 0.65);
      const i = randInt(0, ROOFS.length - 1);
      this.buildings.push({
        x: bx, y: by, w: bw, h: bh,
        hgt: 10 + tall * 92,
        roof: ROOFS[i],
        wall: WALLS[i],
        neon: chance(0.22)
      });
    }
  },

  buildPalms() {
    // A line of palms along the promenade, and sunbeds on the sand.
    for (let y = 30; y < WORLD_H; y += rand(58, 104)) {
      this.props.push({ type: 'palm', x: SHORE_X + rand(12, 46), y, r: rand(15, 21) });
      if (chance(0.5)) {
        this.props.push({ type: 'bed', x: SHORE_X + rand(90, BEACH_W - 60), y: y + rand(-20, 20) });
      }
    }
  },

  /** Uniform grid so lookups only touch nearby buildings. */
  index() {
    this.gw = Math.ceil(WORLD_W / this.cell);
    this.gh = Math.ceil(WORLD_H / this.cell);
    this.grid = new Array(this.gw * this.gh);
    for (let i = 0; i < this.grid.length; i++) this.grid[i] = [];

    for (const b of this.buildings) {
      const c0 = clamp(Math.floor(b.x / this.cell), 0, this.gw - 1);
      const c1 = clamp(Math.floor((b.x + b.w) / this.cell), 0, this.gw - 1);
      const r0 = clamp(Math.floor(b.y / this.cell), 0, this.gh - 1);
      const r1 = clamp(Math.floor((b.y + b.h) / this.cell), 0, this.gh - 1);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) this.grid[r * this.gw + c].push(b);
      }
    }
  },

  /** Buildings whose cell overlaps the circle at (x, y). */
  near(x, y, r) {
    const out = [];
    if (!this.grid) return out;
    const c0 = clamp(Math.floor((x - r) / this.cell), 0, this.gw - 1);
    const c1 = clamp(Math.floor((x + r) / this.cell), 0, this.gw - 1);
    const r0 = clamp(Math.floor((y - r) / this.cell), 0, this.gh - 1);
    const r1 = clamp(Math.floor((y + r) / this.cell), 0, this.gh - 1);
    for (let rr = r0; rr <= r1; rr++) {
      for (let cc = c0; cc <= c1; cc++) {
        for (const b of this.grid[rr * this.gw + cc]) {
          if (out.indexOf(b) === -1) out.push(b);
        }
      }
    }
    return out;
  },

  /** True when the point sits on asphalt (used by traffic and spawning). */
  onRoad(x, y) {
    if (x > SHORE_X) return false;
    const mx = Math.abs(((x % BLOCK) + BLOCK) % BLOCK);
    const my = Math.abs(((y % BLOCK) + BLOCK) % BLOCK);
    const nearV = mx < HALF_ROAD || mx > BLOCK - HALF_ROAD;
    const nearH = my < HALF_ROAD || my > BLOCK - HALF_ROAD;
    return nearV || nearH;
  },

  /** Nearest road-lane coordinate on a given axis. */
  snapToLane(v) {
    return Math.round(v / BLOCK) * BLOCK;
  },

  isSolid(x, y) {
    for (const b of this.near(x, y, 2)) {
      if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
    }
    return false;
  },

  /* ---------------------------------------------------------- rendering -- */

  drawGround(ctx, view, t) {
    // Land
    ctx.fillStyle = PALETTE.sidewalk;
    ctx.fillRect(view.x, view.y, view.w, view.h);

    // Sand and sea, only when they are on screen.
    if (view.x + view.w > SHORE_X) {
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(SHORE_X, view.y, Math.min(view.x + view.w, SEA_X) - SHORE_X, view.h);
    }
    if (view.x + view.w > SEA_X) {
      const g = ctx.createLinearGradient(SEA_X, 0, WORLD_W, 0);
      g.addColorStop(0, PALETTE.sea);
      g.addColorStop(1, PALETTE.seaDeep);
      ctx.fillStyle = g;
      ctx.fillRect(SEA_X, view.y, view.x + view.w - SEA_X, view.h);

      // Rolling foam line.
      ctx.strokeStyle = PALETTE.foam;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let y = view.y - 20; y < view.y + view.h + 20; y += 14) {
        const x = SEA_X + Math.sin(y * 0.02 + t * 0.0016) * 9;
        y === view.y - 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    this.drawRoads(ctx, view);
  },

  drawRoads(ctx, view) {
    const c0 = clamp(Math.floor(view.x / BLOCK) - 1, 0, COLS);
    const c1 = clamp(Math.ceil((view.x + view.w) / BLOCK) + 1, 0, COLS);
    const r0 = clamp(Math.floor(view.y / BLOCK) - 1, 0, ROWS);
    const r1 = clamp(Math.ceil((view.y + view.h) / BLOCK) + 1, 0, ROWS);

    // Sidewalk kerbs sit just outside the asphalt.
    ctx.fillStyle = PALETTE.sidewalkHi;
    for (let c = c0; c <= c1; c++) {
      ctx.fillRect(c * BLOCK - HALF_ROAD - 10, view.y, ROAD_W + 20, view.h);
    }
    for (let r = r0; r <= r1; r++) {
      ctx.fillRect(view.x, r * BLOCK - HALF_ROAD - 10, view.w, ROAD_W + 20);
    }

    ctx.fillStyle = PALETTE.asphalt;
    for (let c = c0; c <= c1; c++) {
      ctx.fillRect(c * BLOCK - HALF_ROAD, view.y, ROAD_W, view.h);
    }
    for (let r = r0; r <= r1; r++) {
      ctx.fillRect(view.x, r * BLOCK - HALF_ROAD, view.w, ROAD_W);
    }

    // Dashed centre lines.
    ctx.strokeStyle = PALETTE.lane;
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 20]);
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    for (let c = c0; c <= c1; c++) {
      ctx.moveTo(c * BLOCK, view.y);
      ctx.lineTo(c * BLOCK, view.y + view.h);
    }
    for (let r = r0; r <= r1; r++) {
      ctx.moveTo(view.x, r * BLOCK);
      ctx.lineTo(view.x + view.w, r * BLOCK);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  },

  drawProps(ctx, view) {
    for (const p of this.props) {
      if (p.type === 'park' || p.type === 'lot') {
        if (p.x > view.x + view.w || p.x + p.w < view.x ||
            p.y > view.y + view.h || p.y + p.h < view.y) continue;
        ctx.fillStyle = p.type === 'park' ? PALETTE.grass : '#3d3849';
        roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.fill();
        if (p.type === 'lot') {
          ctx.strokeStyle = '#5d5670';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = p.x + 24; x < p.x + p.w - 10; x += 26) {
            ctx.moveTo(x, p.y + 10);
            ctx.lineTo(x, p.y + p.h - 10);
          }
          ctx.stroke();
        }
      }
    }
  },

  /** Palms and sunbeds draw above the ground but below entities. */
  drawDetail(ctx, view, t) {
    for (const p of this.props) {
      if (p.x < view.x - 40 || p.x > view.x + view.w + 40 ||
          p.y < view.y - 40 || p.y > view.y + view.h + 40) continue;

      if (p.type === 'palm') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.beginPath();
        ctx.ellipse(4, 5, p.r * 0.9, p.r * 0.75, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#2f6b3d';
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU + Math.sin(t * 0.0008 + p.x) * 0.08;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * p.r * 0.5, Math.sin(a) * p.r * 0.5,
                      p.r * 0.62, p.r * 0.24, a, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#6b4a2a';
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 0.2, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'bed') {
        ctx.fillStyle = '#f4f1ea';
        roundRect(ctx, p.x - 9, p.y - 16, 18, 32, 5);
        ctx.fill();
        ctx.fillStyle = '#ff7ab8';
        ctx.fillRect(p.x - 9, p.y - 4, 18, 9);
      }
    }
  },

  /**
   * Buildings, extruded away from the camera so the city reads with the
   * pseudo-3D depth of the top-down games.
   */
  drawBuildings(ctx, view, camX, camY) {
    const K = 0.0013;
    for (const b of this.buildings) {
      if (b.x > view.x + view.w + 60 || b.x + b.w < view.x - 60 ||
          b.y > view.y + view.h + 60 || b.y + b.h < view.y - 60) continue;

      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const ox = (cx - camX) * b.hgt * K;
      const oy = (cy - camY) * b.hgt * K;

      // Ground shadow.
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.fillRect(b.x + ox * 0.25 + 3, b.y + oy * 0.25 + 3, b.w, b.h);

      // Walls: two quads from the base edges out to the roof.
      ctx.fillStyle = b.wall;
      if (ox !== 0) {
        const sx = ox > 0 ? b.x + b.w : b.x;
        ctx.beginPath();
        ctx.moveTo(sx, b.y);
        ctx.lineTo(sx, b.y + b.h);
        ctx.lineTo(sx + ox, b.y + b.h + oy);
        ctx.lineTo(sx + ox, b.y + oy);
        ctx.closePath();
        ctx.fill();
      }
      if (oy !== 0) {
        const sy = oy > 0 ? b.y + b.h : b.y;
        ctx.beginPath();
        ctx.moveTo(b.x, sy);
        ctx.lineTo(b.x + b.w, sy);
        ctx.lineTo(b.x + b.w + ox, sy + oy);
        ctx.lineTo(b.x + ox, sy + oy);
        ctx.closePath();
        ctx.fill();
      }

      // Roof.
      ctx.fillStyle = b.roof;
      ctx.fillRect(b.x + ox, b.y + oy, b.w, b.h);

      // Roof furniture: a parapet, and a pool or neon sign on some.
      ctx.strokeStyle = 'rgba(0,0,0,.16)';
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + ox + 2, b.y + oy + 2, b.w - 4, b.h - 4);

      if (b.neon && b.w > 60 && b.h > 60) {
        ctx.fillStyle = PALETTE.pool;
        roundRect(ctx, b.x + ox + b.w * 0.28, b.y + oy + b.h * 0.28,
                  b.w * 0.44, b.h * 0.44, 6);
        ctx.fill();
      }
    }
  }
};
