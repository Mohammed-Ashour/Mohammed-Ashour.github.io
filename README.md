# Mohamed Ashour's CV

Edit `cv.md` and push to `master`. GitHub Actions generates the website and a downloadable PDF from the same Markdown, checks the PDF, and publishes `dist/` to GitHub Pages. No browser-side JavaScript is needed.

## One-time deployment setup

In the repository's **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. Push these changes or run the **Publish CV** workflow manually.

## Local preview

```sh
npm ci
npx playwright install chromium
npm run build
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Re-run `npm run build` after editing the Markdown. The PDF is `dist/Mohamed-Ashour-CV.pdf`.

## Editing

- `cv.md`: CV text and compact PDF spacing. The `<!-- page-break -->` marker starts the next PDF page and is invisible on the website.
- `index.html`: page template, profile links, and metadata. Keep the `<!-- CV_CONTENT -->` marker.
- `cv.css`: responsive website and A4 print styles.
- `.github/workflows/deploy.yml`: build, PDF checks, and deployment.

The supplied CV text is preserved. LinkedIn, GitHub, and YouTube navigation links appear on the website, not in the PDF. Add any desired profile links to `cv.md` to include them in both versions.

## PDF checks

The PDF uses a single column, real selectable text, standard headings, clickable links, and accessibility tags. This supports ATS parsing but cannot guarantee compatibility with every ATS.

Install Poppler, then run:

```sh
python3 scripts/check-pdf.py
```

The check verifies two pages, tagging, and complete text in source order. CI runs it before deployment. If the CV grows beyond two pages, revise the content or print layout. It will not silently shrink the text.

The old Jekyll files remain in the repository for reference but are not built or published. Only files in `dist/` are deployed. Old blog URLs will no longer be served by this site.
