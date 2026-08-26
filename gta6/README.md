# GTA VI — Vice Beach

A playable top-down open-world game in the style of the early Grand Theft Auto
games, set in a neon Vice Beach. Pure HTML5 canvas — no build step, no
dependencies, no server.

Open `index.html` in a browser, or install the APK (see [`../android`](../android)).

## Playing

| | Keyboard | Touch |
| --- | --- | --- |
| Move / drive | `WASD` or arrows | left stick |
| Aim | mouse | facing |
| Shoot | left click | FIRE |
| Get in / out of a car | `F` or `E` | GET IN |
| Handbrake | `Space` | BRAKE |
| Pause | `Esc` | HUD button |

Walk up to any car and take it. Yellow markers start a job; teal markers are
drop-offs. Crime raises the wanted level — the cops escalate with each star and
give up once you break line of sight for long enough.

## What's simulated

- **Driving** — forward thrust with damped lateral slide, so cars drift under
  handbrake; seven vehicle types with their own mass, grip and top speed
- **Traffic** — cars keep to lanes, brake for what's ahead, and turn at junctions
- **Pedestrians** — wander the grid and scatter from gunfire or a speeding car
- **Police** — cruisers pursue by star count and drop officers on foot who take
  cover fire; wanted level decays out of sight
- **Missions** — drop-off runs against the clock, rampages, and getaways
- **Damage** — vehicles take collision and bullet damage, catch fire and explode

## Layout

```
gta6/
  index.html        page, HUD markup, title/pause/wasted screens
  css/style.css     HUD, touch pad and menus
  js/util.js        math, collision resolution, formatting
  js/city.js        block generation, road grid, pseudo-3D building rendering
  js/vehicles.js    vehicle physics, traffic and pursuit AI, car rendering
  js/entities.js    pedestrians, police on foot, bullets, particles, pickups
  js/ui.js          input (keyboard, mouse, touch), HUD, minimap
  js/game.js        world simulation, camera, wanted level, missions
  assets/cover.jpg  title art
```

The city is a 12×10 block grid with a beach and ocean along the east edge.
Buildings are extruded away from the camera each frame, which is what gives the
top-down view its depth.

Fan-made tribute. Not affiliated with Rockstar Games.
