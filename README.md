# Mohamed Ashour's CV

A personal website showing my CV with a PDF download and links to LinkedIn, GitHub, and YouTube.

## Files

- `cv.md` holds the CV text. Both the website and PDF use this file.
- `index.html` defines the page and profile links.
- `cv.css` controls the screen layout and A4 print layout.
- `scripts/build.mjs` converts Markdown to HTML with Marked, then creates the PDF with Playwright and Chromium. It writes the website and PDF to `dist/`.
- `scripts/check-pdf.py` checks that the PDF has two pages, accessibility tags, and all CV text in the correct order. It uses Poppler's `pdfinfo` and `pdftotext` commands.
- `.github/workflows/deploy.yml` builds and checks changes, then publishes `dist/` to GitHub Pages on pushes to `master`.

The website needs no browser JavaScript. The PDF contains selectable text, not screenshots. The `<!-- page-break -->` marker in `cv.md` sets where the second PDF page starts.

Old Jekyll files remain in the repository but are not built or published.

## Run locally

```sh
npm ci
npx playwright install chromium
npm run build
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. After editing `cv.md`, run the build again. To check the PDF with Poppler installed, run `python3 scripts/check-pdf.py`.

## Publishing

Set the repository's **Settings → Pages → Source** to **GitHub Actions**. Changes pushed to `master` update the website and PDF after the build and checks pass.
