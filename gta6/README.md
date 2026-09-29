# GTA VI — Vice Beach

A playable top-down open-world game in the style of the early Grand Theft Auto
games, set in a neon Vice Beach. Pure HTML5 canvas — no build step, no
dependencies, no server.

Open `index.html` in a browser, or install the APK (see [`../android`](../android)).

## Персонажи

В начале игры — экран выбора. От персонажа зависят характеристики,
стартовая машина, правила розыска и набор миссий.

| | Мигрант | Полиция |
| --- | --- | --- |
| HP / броня | 100 / 0 | 130 / 50 |
| Стартовые деньги | $500 | $1200 |
| Машина | Alvino V1 | крузер с мигалками |
| Бег | +14% | обычный |
| Розыск | за любое убийство | только за мирных и коллег |
| Добыча | ×1.6 с прохожих | премия за преступников |
| Миссии | ДОСТАВКА, БЕСПРЕДЕЛ, ПОБЕГ | ОБЛАВА, ДОСТАВКА, ПОБЕГ |

Часть прохожих помечена красным ромбом — это преступники. За игру полицией
они дают премию и не поднимают розыск; стрельба по мирным, наоборот, сразу
даёт три звезды.

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

## Чит-клиент Nursultan

Отдельная сборка (`android/apps/gta6-cheat.conf`, APK называется
`nursultan-client.apk`) с Click GUI в стиле игровых чит-клиентов:
открывается кнопкой с логотипом на экране или **RSHIFT** / **~** на
клавиатуре, закрывается крестиком, фоном или тем же хоткеем. Логотип
лежит в `assets/nursultan.png` и в чистую сборку не попадает.

Пять категорий: Визуалы (ESP, трейсеры, цветной мир, прицел, инфо-панель),
Бой (аимбот, быстрая стрельба, урон, мульти-выстрел, **Kill Aura** — раз в
интервал убивает ближайшую цель в радиусе, вокруг игрока крутится дуга),
Движение (скорость, без стен, телепорт правой кнопкой, прилипание), Игрок
(бессмертие, авто-лечение, нет розыска, деньги, **AutoMoney** — бот
перехватывает управление и летает по всей карте: подбирает кэш, грабит
прохожих, а без целей кружит по городу; в связке с Kill Aura фармит с
убийств), Мир (спавн машин, заморозка NPC, хаос, плотность трафика).
Есть поиск по модулям и десять цветовых тем.

В чистой сборке `js/cheats.js`, `css/cheats.css` и `assets/nursultan.png`
вырезаются на этапе
сборки (`APP_STRIP`), вместе со ссылками на них; кнопка ∞ создаётся самим
чит-клиентом, так что в чистом APK её нет.

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
  css/style.css     HUD, touch pad, меню и выбор персонажа
  css/cheats.css    Click GUI (нет в чистой сборке)
  js/util.js        math, collision resolution, formatting
  js/characters.js  мигрант и полиция: статы, розыск, миссии
  js/cheats.js      чит-клиент и Click GUI (нет в чистой сборке)
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
