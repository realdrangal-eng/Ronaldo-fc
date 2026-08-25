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
