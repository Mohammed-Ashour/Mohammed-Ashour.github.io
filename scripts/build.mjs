import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';
import { buildPortfolio } from './build-portfolio.mjs';
import { earth } from '../portfolio/objects.mjs';

// cv.md is trusted, repository-owned content, including its layout CSS.
const markdown = await readFile('cv.md', 'utf8');
const content = marked.parse(markdown.replaceAll('<!-- page-break -->', '<div class="page-break"></div>'));
const template = await readFile('index.html', 'utf8');
if (!template.includes('<!-- CV_CONTENT -->')) throw new Error('Missing CV template marker');
await mkdir('dist', { recursive: true });
await writeFile('dist/plain.html', template.replace('<!-- CV_CONTENT -->', content));
await writeFile('dist/index.html', await buildPortfolio(markdown));
await copyFile('cv.css', 'dist/cv.css');
await copyFile('cv.md', 'dist/cv.md');
await writeFile('dist/.nojekyll', '');
await copyFile('CNAME', 'dist/CNAME');
// The pixel Earth doubles as the favicon; it carries its own palette because it loads outside the page.
const palette = await readFile('portfolio/palette.css', 'utf8');
await writeFile('dist/favicon.svg', earth().replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('>', `><style>${palette}</style>`));

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve('dist/plain.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: 'dist/Mohamed-Ashour-CV.pdf',
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
  });
  // Social preview: the introduction and orbit as they first appear, at the standard 1200 x 630.
  const preview = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
  await preview.goto(pathToFileURL(resolve('dist/index.html')).href);
  await preview.evaluate(() => { document.getElementById('now').style.display = 'none'; document.querySelector('header .links').style.display = 'none'; });
  await preview.evaluate(() => document.fonts.ready);
  await preview.screenshot({ path: 'dist/og.png' });
} finally {
  await browser.close();
}
console.log('Built website and PDF in dist/');
