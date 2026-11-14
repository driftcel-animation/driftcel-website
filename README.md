# driftcel.com

Website for Driftcel Animation: *Stories with a pulse.* It's a plain static site (HTML, CSS and a little JavaScript) hosted on GitHub Pages, with no build step.

## Run it on your laptop

```
cd driftcel-website-git
python -m http.server 8000
```

Then open http://127.0.0.1:8000. Use the server rather than double-clicking `index.html`, because the site uses root paths like `/style.css`.

## Files

| Path | What it is |
|---|---|
| `index.html` | Homepage |
| `projects/*.html` | One page per original world |
| `404.html` | "Drift got lost" page |
| `style.css` | All styles. Brand colours are at the top. |
| `site.js` | Menu, scroll effects, Drift's eyes and moods, contact form |
| `assets/brand/` | Logos and app icons from the Driftcel Brand Kit v1.1 |
| `assets/art/` | Project artwork (currently placeholders) |

## Common updates

- **Real project art:** put the image in `assets/art/` and change the `src` in `index.html` (card, 4:3) and `projects/<name>.html` (hero, 16:9).
- **Showreel:** in `index.html`, find the `SHOWREEL` comment and swap the placeholder for the `<video>` tag shown there.
- **Contact form inbox:** create a free form at formspree.io and put its URL in `data-endpoint=""` on the form in `index.html`. Until then, the form opens the visitor's email app.
- **Social links:** add them to the footer once the `@driftcel` handles are confirmed.
