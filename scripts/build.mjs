import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';

// cv.md is trusted, repository-owned content, including its layout CSS.
const markdown = await readFile('cv.md', 'utf8');
const content = marked.parse(markdown.replaceAll('<!-- page-break -->', '<div class="page-break"></div>'));
const template = await readFile('index.html', 'utf8');
if (!template.includes('<!-- CV_CONTENT -->')) throw new Error('Missing CV template marker');
await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', template.replace('<!-- CV_CONTENT -->', content));
await copyFile('cv.css', 'dist/cv.css');
await copyFile('cv.md', 'dist/cv.md');
await writeFile('dist/.nojekyll', '');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve('dist/index.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: 'dist/Mohamed-Ashour-CV.pdf',
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
  });
} finally {
  await browser.close();
}
console.log('Built website and PDF in dist/');
