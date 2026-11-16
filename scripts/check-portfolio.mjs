import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import * as playwright from 'playwright';
import { marked } from 'marked';
import { buildPortfolio } from './build-portfolio.mjs';

// BROWSER=firefox runs the same checks in Firefox locally; CI uses Chromium.
const engine = playwright[process.env.BROWSER ?? 'chromium'];
const url = name => pathToFileURL(resolve('dist', name)).href;
const IDS = ['hydrosat', 'spire', 'yaoota', 'eaf', 'elements', 'freelance', 'codescalers', 'toolkit', 'school'];

// Header geometry at the top of the page: Plain CV clearance and the name.
function headerLayout() {
  // Adjacent Firefox grid rows can differ by fractional layout units; require a visible overlap.
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > .5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > .5;
  const plain = document.getElementById('plain').getBoundingClientRect();
  const bar = document.getElementById('now').getBoundingClientRect();
  const glyphs = [...document.querySelectorAll('header h1, header .lead, header .links a')].map(e => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); });
  const tabs = [...document.querySelectorAll('.system .tab')].map(t => {
    const r = t.getBoundingClientRect();
    return { id: t.dataset.id, r, nmTop: t.querySelector('.nm').getBoundingClientRect().top, inside: [...t.querySelectorAll('.wbox,.nm,.yr')].every(c => { const b = c.getBoundingClientRect(); return b.left >= r.left - 1 && b.right <= r.right + 1; }) };
  });
  return {
    plainCovers: glyphs.some(g => hit(g, plain) || hit(g, bar)),
    nameClear: document.querySelector('h1').getBoundingClientRect().top >= bar.bottom,
    outside: tabs.filter(t => !t.inside).map(t => t.id),
    tabOverlap: tabs.some((t, i) => tabs.slice(i + 1).some(u => hit(t.r, u.r))),
    rowMisaligned: tabs.some(t => tabs.some(u => Math.abs(u.r.top - t.r.top) < 2 && Math.abs(u.nmTop - t.nmTop) > 2)),
    barHeight: bar.height,
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
  };
}
function assertHeader(m, label, { maxBar }) {
  assert(!m.plainCovers, `${label}: Plain CV bar covers header text`);
  assert(m.nameClear, `${label}: name starts under the bar`);
  assert.deepEqual(m.outside, [], `${label}: navigation icon or label leaves its column`);
  assert(!m.tabOverlap, `${label}: navigation items overlap`);
  assert(!m.rowMisaligned, `${label}: navigation labels in one row do not share a top line`);
  assert(m.barHeight <= maxBar, `${label}: sticky bar is ${Math.round(m.barHeight)}px tall`);
  assert(!m.overflow, `${label}: horizontal overflow`);
}
// Local geometry of one role: narrow wrapped lines and scene placement.
function sectionLayout(id) {
  const section = document.getElementById(id), text = section.querySelector('.text');
  const big = section.querySelector('.big').getBoundingClientRect(), tr = text.getBoundingClientRect();
  let narrow = Infinity, minLeft = Infinity;
  for (const el of text.querySelectorAll('h2,h3,p,li,dt,dd')) {
    const range = document.createRange(); range.selectNodeContents(el);
    const lines = [];
    for (const r of range.getClientRects()) {
      if (r.width < 1) continue;
      const mid = (r.top + r.bottom) / 2, line = lines.find(l => Math.abs(l.mid - mid) < r.height / 2);
      if (line) line.left = Math.min(line.left, r.left); else lines.push({ mid, left: r.left });
    }
    for (const l of lines) { narrow = Math.min(narrow, el.getBoundingClientRect().right - l.left); minLeft = Math.min(minLeft, l.left); }
  }
  return { narrow, minLeft, big: { left: big.left, bottom: big.bottom, center: big.left + big.width / 2 }, textTop: tr.top, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
}
function assertSection(m, label, width, { mobile, large = false }) {
  assert(m.narrow >= Math.min(200, width * .55), `${label}: text squeezed to ${Math.round(m.narrow)}px`);
  assert(!m.overflow, `${label}: horizontal overflow`);
  if (mobile) {
    assert(m.big.left >= 0, `${label}: mobile scene is cropped at the left edge`);
    assert(m.big.bottom <= m.textTop + 1, `${label}: mobile scene must sit above its text`);
  } else if (!large) {
    assert(m.minLeft >= m.big.center, `${label}: text runs back under the scene`);
  }
}
// What the page says is being read: navigation, bar strip, bar label, Plain CV targets and address.
const state = () => ({
  tab: document.querySelector('.system .tab[aria-current=true]')?.dataset.id ?? null,
  strip: document.querySelector('.strip a[aria-current=true]')?.dataset.id ?? null,
  here: document.getElementById('here').textContent,
  plain: [...document.querySelectorAll('#plain, .plain-foot')].map(a => a.getAttribute('href')),
  hash: location.hash,
});
// Poll from Node: browser timers and animation callbacks do not run with JavaScript disabled.
async function settle(page) {
  let last = await page.evaluate(() => scrollY), still = 0;
  const started = Date.now();
  while (Date.now() - started < 1500) {
    await delay(35);
    const position = await page.evaluate(() => scrollY);
    still = position === last ? still + 1 : 0;
    if (still >= 2) return;
    last = position;
  }
  throw new Error('Scrolling did not settle within 1500ms');
}
async function assertReading(page, id, label) {
  const s = await page.evaluate(state);
  assert.equal(s.tab, id, `${label}: navigation should mark ${id}, got ${s.tab}`);
  assert.equal(s.strip, id, `${label}: bar strip should mark ${id}`);
  assert(s.here.length > 0, `${label}: bar names the current role`);
  assert.deepEqual(s.plain, [`plain.html?at=${id}`, `plain.html?at=${id}`], `${label}: Plain CV must return to ${id}`);
  return s;
}
// An anchored role starts just below the sticky bar, and the bar does not cover its heading.
const anchored = id => {
  const bar = document.getElementById('now').getBoundingClientRect(), h = document.getElementById(`d-${id}-h`).getBoundingClientRect();
  const top = document.getElementById(id).getBoundingClientRect().top;
  return { gap: top - bar.bottom, barCovers: bar.bottom > h.top + 1 || top < bar.bottom - 1 };
};
async function assertAnchored(page, id, label) {
  const a = await page.evaluate(anchored, id);
  assert(!a.barCovers, `${label}: sticky bar covers the ${id} heading`);
  assert(a.gap < 160, `${label}: ${id} should start near the top, gap ${Math.round(a.gap)}px`);
}
// Every role stays in the document, visible and in source order.
const inFlow = () => {
  const s = [...document.querySelectorAll('main > section')];
  return { ids: s.map(e => e.id), visible: s.every(e => e.checkVisibility() && e.getBoundingClientRect().height > 100), ordered: s.every((e, i) => !i || e.getBoundingClientRect().top >= s[i - 1].getBoundingClientRect().bottom - 1), tabs: document.querySelectorAll('[role=tab],[role=tabpanel],[role=tablist],[hidden]').length };
};
async function assertInFlow(page, label) {
  const f = await page.evaluate(inFlow);
  assert.deepEqual(f.ids, IDS, `${label}: all nine roles are in the document`);
  assert(f.visible, `${label}: every role is visible`);
  assert(f.ordered, `${label}: roles follow one another in reading order`);
  assert.equal(f.tabs, 0, `${label}: no tab semantics or hidden content`);
}
// Scroll so the role's top is a fifth of the way down the window, as when reading, without touching navigation.
const scrollToRole = (page, id) => page.evaluate(id => scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY - innerHeight * .2), id).then(() => settle(page));
// Verify native Page Down, then sample a complete reading pass with deterministic overlapping scroll steps.
// Repeating animated keyboard paging hundreds of times is slow and varies between browser engines.
async function pageDownThrough(page, label) {
  await page.evaluate(() => scrollTo(0, 0)); await settle(page);
  await page.locator('h1').click();
  const shown = new Set(), marked = [];
  await page.keyboard.press('PageDown'); await settle(page);
  assert(await page.evaluate(() => scrollY > 0), `${label}: Page Down must advance the document`);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await settle(page);
  const maxSteps = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight / Math.max(1, innerHeight * .5)) + 4);
  assert(maxSteps < 600, `${label}: unexpectedly tall document`);
  let reachedEnd = false;
  for (let i = 0; i < maxSteps; i++) {
    const step = await page.evaluate(ids => {
      const bar = document.getElementById('now').getBoundingClientRect().bottom;
      return { tab: document.querySelector('.system .tab[aria-current=true]')?.dataset.id ?? null, seen: ids.filter(id => { const r = document.getElementById(`d-${id}-h`).getBoundingClientRect(); return r.top >= bar - 1 && r.bottom <= innerHeight; }), end: scrollY + innerHeight >= document.documentElement.scrollHeight - 2 };
    }, IDS);
    step.seen.forEach(id => shown.add(id));
    if (step.tab && marked.at(-1) !== step.tab) marked.push(step.tab);
    if (step.end) { reachedEnd = true; break; }
    const before = await page.evaluate(() => scrollY);
    await page.evaluate(() => scrollBy({ top: innerHeight * .5, behavior: 'instant' }));
    await settle(page);
    assert(await page.evaluate(y => scrollY > y, before), `${label}: scrolling stopped before the document end`);
  }
  assert(reachedEnd, `${label}: reading pass must reach the end`);
  assert.deepEqual(IDS.filter(id => shown.has(id)), IDS, `${label}: reading pass shows every role heading`);
  assert.deepEqual(marked, IDS.filter(id => marked.includes(id)), `${label}: marked role only moves forward`);
  assert(marked[0] === 'hydrosat' && marked.at(-1) === 'school', `${label}: Page Down marks roles through to the last, got ${marked}`);
}
const largerText = z => { const all = [...document.querySelectorAll('html, body, body *')]; const sizes = all.map(e => parseFloat(getComputedStyle(e).fontSize)); all.forEach((e, i) => e.style.setProperty('font-size', sizes[i] * z + 'px', 'important')); };

const markdown = await readFile('cv.md', 'utf8');
await assert.rejects(buildPortfolio(markdown.replace('## Professional Experience', '## Jobs')), /Missing CV heading/);
await assert.rejects(buildPortfolio(markdown.replace(' | Hydrosat', ' | Renamed company')), /Missing experience/);
const edited = await buildPortfolio(markdown.replace('Lead architecture and development', 'Updated architecture and development'));
assert(edited.includes('Updated architecture and development'), 'Portfolio must use current cv.md, not copied facts');
const browser = await engine.launch();
try {
  const source = await browser.newPage();
  await source.setContent('<main>' + marked.parse(markdown) + '</main>');
  const expected = await source.locator('main').innerText();
  const bullets = await source.locator('main li').allTextContents();
  await source.goto(url('plain.html'));
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  assert.equal(normalize(await source.locator('main').innerText()), normalize(expected));
  await source.goto(url('index.html'));
  const shown = (await source.locator('main li:visible').allTextContents()).map(normalize);
  for (const bullet of bullets) assert(shown.includes(normalize(bullet)), `Missing or hidden CV bullet: ${bullet}`);
  await source.close();

  for (const width of [320, 390, 768, 820, 1024, 1440]) {
    const mobile = width <= 760, label = String(width);
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url('index.html'));
    assert.equal(await page.locator('.sketch,.metaphor').count(), 0);
    // The selected design has role illustrations only, with no personal avatar.
    assert.deepEqual(await page.locator('.big svg').evaluateAll(s => s.map(e => e.getAttribute('aria-hidden') === 'true' && e.querySelectorAll('.pf,.pK').length === 0)), IDS.map(() => true), `${label}: decorative role scenes without avatar`);
    assert.equal(await page.locator('header svg, .avatar').count(), 0, `${label}: no header portrait`);
    assert(!/\bsketch(?:es)?\b/i.test(await page.locator('body').innerText()), 'Remove illustration notes');
    assert.deepEqual(await page.locator('.system .tab').evaluateAll(a => a.map(e => e.getAttribute('href'))), IDS.map(id => '#' + id), `${label}: navigation links are anchors`);
    assertHeader(await page.evaluate(headerLayout), label, { maxBar: 60 });
    assert.deepEqual(await page.evaluate(state), { tab: null, strip: null, here: '', plain: ['plain.html', 'plain.html'], hash: '' }, `${label}: nothing is marked before the first role`);
    await assertInFlow(page, label);

    // Scrolling alone moves the indicator, the address and the Plain CV target; Plain CV returns to the same role.
    for (const id of IDS) {
      await scrollToRole(page, id);
      const s = await assertReading(page, id, `${label}/${id} scrolled`);
      assert.equal(s.hash, '#' + id, `${label}/${id}: address follows reading`);
      assertSection(await page.evaluate(sectionLayout, id), `${label}/${id}`, width, { mobile });
      await page.locator('#plain').click();
      assert.equal(new URL(page.url()).searchParams.get('at'), id);
      await page.getByRole('link', { name: 'Back to portfolio', exact: true }).click();
      await settle(page);
      assert.equal(new URL(page.url()).hash, '#' + id);
      await assertAnchored(page, id, `${label}/${id} returned`);
      await assertReading(page, id, `${label}/${id} returned`);
    }
    await assertInFlow(page, `${label} after scrolling`);
    await pageDownThrough(page, label);

    // Navigation scrolls to a role; it never hides the others.
    await page.evaluate(() => scrollTo(0, 0)); await settle(page);
    await page.locator('.system .tab[href="#yaoota"]').click(); await settle(page);
    await assertAnchored(page, 'yaoota', `${label} nav click`);
    await assertReading(page, 'yaoota', `${label} nav click`);
    await assertInFlow(page, `${label} nav click`);

    // Keyboard: skip link, then Plain CV; the bar's shortcut strip is not a tab stop. Enter on a role link moves on into that role.
    await page.goto(url('index.html')); await settle(page);
    await page.keyboard.press('Tab');
    assert(await page.locator('.skip').evaluate(el => el === document.activeElement), `${label}: first Tab reaches the skip link`);
    await page.keyboard.press('Tab');
    assert(await page.locator('#plain').evaluate(el => el === document.activeElement), `${label}: second Tab reaches Plain CV`);
    await page.locator('.system .tab[href="#freelance"]').focus();
    await page.keyboard.press('Enter'); await settle(page);
    await assertReading(page, 'freelance', `${label} keyboard`);
    await page.keyboard.press('Tab'); await settle(page);
    const focus = await page.evaluate(() => {
      const a = document.activeElement, bar = document.getElementById('now').getBoundingClientRect(), r = a.getBoundingClientRect();
      return { after: !!(document.getElementById('freelance').compareDocumentPosition(a) & (Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY)), clear: r.top >= bar.bottom - 1 && r.bottom <= innerHeight };
    });
    assert(focus.after, `${label}: Tab after a role link continues from that role`);
    assert(focus.clear, `${label}: focused link is visible and not under the bar`);

    // Deep links land on their role.
    for (const id of ['freelance', 'school']) {
      await page.goto(url('index.html') + '#' + id); await settle(page);
      await assertAnchored(page, id, `${label} #${id}`);
      await assertReading(page, id, `${label} #${id}`);
    }
    await page.goto(url('plain.html') + '?at=javascript:alert(1)');
    assert.equal(await page.locator('#portfolio-back').getAttribute('href'), 'index.html');
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Portfolio checks passed at ${width}px`);
  }

  // Text-only zoom (as with Firefox's option) must reflow without covering, clipping or squeezing content.
  for (const width of [320, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(url('index.html'));
    await page.evaluate(largerText, 2);
    assertHeader(await page.evaluate(headerLayout), `${width}/200% text`, { maxBar: 110 });
    for (const id of IDS) {
      await scrollToRole(page, id);
      await assertReading(page, id, `${width}/${id}/200% text`);
      assertSection(await page.evaluate(sectionLayout, id), `${width}/${id}/200% text`, width, { mobile: width <= 760, large: true });
    }
    await page.close();
  }
  // Short windows, such as a phone on its side: the bar stays small and Page Down still reaches every role.
  for (const [width, height, zoom] of [[390, 560, 1], [740, 360, 1], [1024, 600, 1], [390, 560, 2]]) {
    const label = `${width}x${height}${zoom > 1 ? '/200% text' : ''}`;
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    await page.goto(url('index.html'));
    if (zoom > 1) await page.evaluate(largerText, zoom);
    const bar = await page.locator('#now').evaluate(e => e.getBoundingClientRect().height);
    assert(bar <= height * (zoom > 1 ? .2 : .14), `${label}: sticky bar takes ${Math.round(bar)}px`);
    await pageDownThrough(page, label);
    await page.goto(url('index.html') + '#toolkit'); await settle(page);
    if (zoom > 1) { await page.evaluate(largerText, zoom); await page.locator('#toolkit').evaluate(e => e.scrollIntoView()); await settle(page); }
    await assertAnchored(page, 'toolkit', label);
    await page.close();
  }

  const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 1024, height: 800 } });
  await noJS.goto(url('index.html'));
  await assertInFlow(noJS, 'no JavaScript');
  assert.equal(await noJS.getByRole('link', { name: 'Plain CV', exact: true }).getAttribute('href'), 'plain.html');
  assert.equal(await noJS.locator('.strip').evaluate(e => getComputedStyle(e).visibility), 'hidden', 'No-JS: bar strip stays out of the way');
  for (const bullet of bullets) assert((await noJS.locator('main li:visible').allTextContents()).map(normalize).includes(normalize(bullet)), `No-JS: missing ${bullet}`);
  await noJS.locator('.system .tab[href="#codescalers"]').click(); await settle(noJS);
  await assertAnchored(noJS, 'codescalers', 'No-JS nav link');
  await noJS.goto(url('index.html') + '#elements'); await settle(noJS);
  await assertAnchored(noJS, 'elements', 'No-JS deep link');
  await noJS.close();
} finally { await browser.close(); }
console.log('Canonical content, scroll-driven reading state, plain round trips, anchors, keyboard, short windows and no-JS passed.');
