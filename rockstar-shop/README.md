# Rockstar Shop

A small static storefront for Rockstar Games titles.

## Catalog

| Game | Edition | Price |
| --- | --- | --- |
| Grand Theft Auto VI | Standard Edition | $14.99 |
| Grand Theft Auto V | Premium Online Edition | $9.99 |

## Features

- Featured-games grid with cover art, badges and platform info
- Slide-out cart with quantity controls, remove, running total and checkout
- Cart persists across reloads via `localStorage`
- Responsive layout, dark Rockstar-style theme

## Running

No build step — open `index.html` in a browser, or serve the folder:

```
npx http-server .
```

## Files

- `index.html` — page markup
- `styles.css` — theme and layout
- `app.js` — product catalog and cart logic
- `assets/` — cover art and logo

Fan-made demo. Not affiliated with Rockstar Games; artwork belongs to its owners.
