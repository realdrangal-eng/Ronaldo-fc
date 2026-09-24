# RONALDO FC

A mobile-first football card game where every single card is Cristiano Ronaldo.
Built around an FC Mobile-style pack opening animation: charge, burst, suspense,
flip, walkout.

Open `index.html` in a browser. No build step, no dependencies, no server needed
(though serving the folder over HTTP is smoother for the fonts).

## What's in it

**Pack opening** — the centrepiece. Tap the pack and it winds up, shakes, and
bursts in a flash of light and particles. Each card then flies in face-down,
hovers under spinning light rays while the suspense builds, and flips over. How
long the suspense lasts and how loud the reveal is depends on the card's rarity:
a 90 gets a quick flip, a 117 gets the full walkout treatment with a spotlight
beam, confetti and a rising `ULTIMATE!` title. Impatient? Tap during the
suspense to skip straight to the flip.

**The cards** — ten of them, 90 through 117, sorted into five rarity tiers that
drive the animation intensity:

| Tier | Cards | Reveal |
|---|---|---|
| Rare | 90, 93 | quick flip |
| Epic | 94, 96, 100 | longer build, gold rays |
| Icon | 105, 106 | walkout + confetti |
| Legendary | 112, 114 | long walkout, heavy confetti |
| Ultimate | 117 | the full production |

**Packs** — five of them, from a 750-coin Starter up to the gem-priced Ultimate
SIU Pack. Each has weighted pull odds and a guaranteed floor: if your pulls all
miss the floor, the weakest one is upgraded so the guarantee is actually felt.
Cards are revealed worst-first so the pack builds to its best pull.

**Duplicates** train instead of disappointing. Each dupe adds a star (+1 OVR, up
to 5). Once a card is maxed, further dupes convert to coins by tier.

**Finishing drill** — stop a moving marker in the green zone to score. The green
zone scales with your best card's shooting, so better cards genuinely make the
game easier. Goals pay coins; a perfect 5/5 pays gems.

**Daily bonus** with a streak that grows for seven days.

Progress saves to `localStorage`. Private-browsing mode still plays fine, it
just won't persist. "Reset my club" at the bottom of the Cards screen wipes it.

## Files

```
index.html            markup and screens
css/style.css         everything visual, including the pack animation keyframes
js/data.js            the ten cards, five packs, rarity tiers and pull odds
js/state.js           save/load, currency, collection, pull + guarantee logic
js/packs.js           the pack opening timeline, SFX synth, particles, confetti
js/match.js           the finishing drill
js/ui.js              screens, rendering, boot
assets/cards/         the card art
```

Sound is synthesised with WebAudio at runtime, so there are no audio files to
ship. Mute with the speaker button in the top bar.

Respects `prefers-reduced-motion`: the game stays fully playable, the drama just
stops moving.

## Single-file build

`node build-artifact.mjs [outPath]` bundles everything into one self-contained
HTML file (CSS and JS inlined, card art embedded as data URIs, no external
requests except the Google Fonts stylesheet). Output defaults to
`dist/ronaldo-fc.html`, about 1.3 MB. Re-run it after changing any source file.

## Bonus: Небесный ас

`plane/index.html` is a separate, self-contained arcade shooter: a vertical
scroller over a sunset sea. Open the file in a browser, drag a finger (or use
the mouse, arrows/WASD) and the plane fires on its own.

- Four enemy types: fighter squadrons, zig-zag planes, bombers that shoot back
  and kamikaze jets that lock on before diving.
- Every level ends with a flying-fortress boss with its own bullet patterns and
  a rage phase below half health.
- Pickups: P (guns, up to 5 levels with homing missiles), S (shield), B (bomb),
  + (extra life), ★ (medal points). Chained kills build a ×8 combo.
- Sound is synthesised with WebAudio; best score is kept in `localStorage`.

## Аркада

`arcade/index.html` is a game hub with four more mobile games in one file,
plus a card that opens Небесный ас:

- **Футбол** — top-down 1v1 with AI goalkeepers, a two-minute match against
  the computer. Drag anywhere for a virtual joystick, tap УДАР to shoot.
- **Пинг-понг** — first to 7, three AI levels or two players on one phone
  (each takes a half of the table). Hitting with the paddle edge adds angle.
- **Змейка** — classic snake with swipe controls and a short-lived golden
  apple worth 5.
- **Кирпичи** — breakout with five layouts, two-hit silver bricks and
  power-ups (wide paddle, three balls, slow ball, extra life).

Wins and best scores are kept in `localStorage`.

## Песчаный штурм

`shooter/index.html` is a separate first-person shooter in the spirit of
round-based tactical shooters, built with Three.js (r128, loaded from cdnjs).
You play a special-forces soldier clearing a desert town of bots.

- Rounds: 5 s freeze and buy time, 1:55 to eliminate every bot. First to 5
  round wins takes the match. Bots per round grow from 3 to 6 and get faster
  and more accurate.
- Economy: $800 start, kill rewards per weapon, $3250 for a round win and
  $1900 for a loss. Buy an SMG, an AK, a scoped sniper rifle, a vest or a vest
  and helmet. Dying loses your main weapon and armour.
- Bots patrol with A* on the map grid, react to line of sight and gunfire,
  strafe while shooting and hunt your last known position.
- HUD with a rotating radar, kill feed, damage direction, hit markers and
  recoil and spread that grow while moving or spraying.
- Desktop: mouse (pointer lock) and WASD. Phones: left-side joystick,
  drag the right side to aim, on-screen buttons. Landscape recommended.
