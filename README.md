# Mohamed Ashour's CV

A static software-engineering portfolio with role-specific pixel illustrations, a plain CV mode and a downloadable PDF.

## Content and presentation

- `cv.md` is the professional-content source for the portfolio, plain CV and PDF.
- `portfolio/index.html`, `portfolio/objects.mjs` and `portfolio/palette.css` define the interactive homepage. Its role illustrations are decorative, with no personal avatar; every role has ordinary HTML details.
- `index.html` is the plain CV template. `cv.css` controls its screen and A4 print layout.
- `scripts/build-portfolio.mjs` maps the CV's existing headings to role sections and renders canonical Markdown details. If roles or required headings change, update its explicit mapping; the build fails rather than dropping roles silently.
- `scripts/build.mjs` generates `dist/index.html`, `dist/plain.html`, the source Markdown, styles and `Mohamed-Ashour-CV.pdf`.

All nine sections are always readable by scrolling. The current-role bar and Plain CV return link follow the section being read. The role icons orbit a Downlink-style pixel Earth and provide optional anchor shortcuts; normal keyboard scrolling and native deep links work too. As the overview leaves the screen, a faint Earth blends into the background. Completed sections contribute their icons to that background orbit, which turns only as the reader scrolls and stays still while reading; scrolling back up takes them out again. Each icon follows its own tilted, flattened ellipse at a different speed, passing behind and in front of the Earth; the far half of each track is drawn under the planet and the near half over it. The Earth is sized so every orbit fits its frame, and resting positions keep each icon clear of the planet and of each other. Labels appear on hover or keyboard focus and stay upright; the matching orbit is highlighted. Motion pauses while aiming, using keyboard focus, when offscreen, or with the Pause control. With JavaScript disabled or reduced motion enabled, the orbit stays still and all anchor links remain usable. Reduced-motion preferences also disable smooth scrolling and background rotation. Sections use centered, independent illustration and text columns, stacking on mobile without framing circles.

The build also writes `favicon.svg` (the pixel Earth), a 1200×630 `og.png` social preview captured from the introduction, and `CNAME`.

The PDF is printed from the plain CV, not the illustrated homepage. It contains selectable, tagged text. The `<!-- page-break -->` marker in `cv.md` sets the second page's start.

## Run and verify

```sh
npm ci
npx playwright install chromium
npm run build
npm test
python3 scripts/check-pdf.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. `npm test` checks canonical content, all nine sections, scroll-driven reading state, plain-mode round trips, anchor/deep links, keyboard scrolling and no-JavaScript access at 320, 390, 768, 820, 1024 and 1440px. It also checks layout geometry: no horizontal overflow, no squeezed text lines, navigation labels within their targets, centered Earth and reading banner, bounded orbital paths and correct front/back layering, the Plain CV link clear of header text, and on mobile the illustration above its text. Two of those widths are repeated with text at 200%. Short windows, visible headings after anchor jumps, resize/hash synchronization, native Page Down, orbit pause controls and reduced-motion behavior are also covered. Scroll waits run in Node with explicit bounds, so the JavaScript-disabled check cannot hang on browser timers. For a local Firefox pass, install its Playwright binary and use `BROWSER=firefox npm test`. The PDF check needs Poppler's `pdfinfo` and `pdftotext`.

## Publishing

GitHub Actions builds and checks pull requests without deploying them. Pushes to `master` publish the generated `dist/` artifact through GitHub Pages, using the existing workflow. Set **Settings → Pages → Source** to **GitHub Actions**.

The homepage is `/`; the plain CV is `/plain.html`; the existing `/Mohamed-Ashour-CV.pdf` download URL is unchanged. No backend or additional runtime dependencies are required.

Old Jekyll files remain but are not built. Experimental prototypes are not needed by the production build and are not published.
