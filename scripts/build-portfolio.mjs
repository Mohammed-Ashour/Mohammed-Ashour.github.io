import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import { icon, scene, earth, contactIcon, OBJ_CSS } from '../portfolio/objects.mjs';
import { PROJECTS, POSTS } from '../portfolio/work.mjs';

const contactLinksFrom = (markdown, host) => markdown.match(new RegExp(`https://[^)\\s]*${host.replace('.', '\\.')}[^)\\s]*`))?.[0] ?? '';
const ESC = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const plain = text => text.replaceAll('**', '').trim();
// Display-only typography: ranges get an en dash on the homepage (cv.md and the plain CV stay unchanged).
const dash = html => html.replace(/(\d{4}) - ((?:[A-Z][a-z]{2} )?(?:\d{4}|Present))\b/g, '$1 – $2');
// "Technologies: a, b" paragraphs become scannable chips; the text is unchanged for screen readers.
const chips = html => html.replace(/<p><strong>Technologies:<\/strong>\s*([^<]+)<\/p>/g, (_, list) =>
  `<p class="tech"><span class="tech-label">Technologies:</span> ${list.split(',').map(t => `<span class="chip">${t.trim()}</span>`).join('<span class="sep">, </span>')}</p>`);
// Roles from here on are shown in a compact style: present them as the earlier career.
const EARLY = new Set(['eaf', 'elements', 'freelance', 'codescalers']);
const roles = [
  ['hydrosat', 'Hydrosat'], ['spire', 'Spire Global'], ['yaoota', 'Yaoota'],
  ['eaf', 'Egyptian Air Force'], ['elements', 'Elements Financial Technologies'],
  ['freelance', 'Self-Employed'], ['codescalers', 'Codescalers - Egypt'],
];

// Parse the established CV headings, failing the build rather than silently dropping sections.
export async function buildPortfolio(markdown) {
  // The homepage highlights quote these facts; fail the build if the CV stops supporting them.
  for (const fact of ['$250K annually', 'NASA, NOAA, ESA, and EUMETSAT', 'architecture and development of **satellite imagery processing pipelines**']) {
    if (!markdown.includes(fact)) throw new Error(`Homepage highlight no longer backed by cv.md: ${fact}`);
  }
  const tokens = marked.lexer(markdown.replaceAll('<!-- page-break -->', ''));
  function section(text, depth) {
    const start = tokens.findIndex(t => t.type === 'heading' && t.depth === depth && t.text === text);
    if (start === -1) throw new Error(`Missing CV heading: ${text}`);
    let end = start + 1;
    while (end < tokens.length && !(tokens[end].type === 'heading' && tokens[end].depth <= depth)) end++;
    return tokens.slice(start + 1, end).filter(t => t.type !== 'space' && t.type !== 'hr');
  }
  const experience = section('Professional Experience', 2);
  if (experience.filter(t => t.type === 'heading' && t.depth === 3).length !== roles.length) {
    throw new Error('Update portfolio role mapping for changed experience headings');
  }
  const items = roles.map(([id, org]) => {
    const heading = experience.find(t => t.type === 'heading' && t.depth === 3 && t.text.endsWith(` | ${org}`));
    if (!heading) throw new Error(`Missing experience for ${org}`);
    const body = section(heading.text, 3);
    if (body[0]?.type !== 'paragraph') throw new Error(`Missing dates for ${org}`);
    const dates = plain(body[0].text);
    const title = heading.text.slice(0, heading.text.lastIndexOf(' | '));
    const years = [...new Set(dates.match(/\b\d{4}\b|Present/gi) ?? [dates])].join(' – ');
    const html = `<h2 class="org" id="d-${id}-h">${ESC(org)}</h2><p class="meta"><span class="title">${ESC(title)}</span><span class="when">${dash(ESC(dates))}</span></p>` + chips(marked.parser(body.slice(1)).replaceAll('<ul>', '<ul class="pts">'));
    return { id, early: EARLY.has(id), name: id === 'eaf' ? 'Air Force' : id === 'elements' ? 'Elements' : id === 'freelance' ? 'Freelance' : id === 'codescalers' ? 'Codescalers' : org, years, html };
  });
  items.push({ id: 'toolkit', name: 'Toolkit', years: 'Skills', html: '<h2 class="org" id="d-toolkit-h">Technical skills</h2>' + marked.parser(section('Technical Skills', 2)).replaceAll('<ul>', '<ul class="pts">') });
  items.push({ id: 'school', name: 'School & writing', years: 'Education & teaching', html: '<h2 class="org" id="d-school-h">Education, writing &amp; teaching</h2>' + dash(marked.parser([...section('Education', 2), ...section('Technical Writing & Education', 2)]).replaceAll('<ul>', '<ul class="pts">')) });
  const summary = section('Professional Summary', 2).find(t => t.type === 'paragraph');
  if (!summary) throw new Error('Missing professional summary');
  const firstSentence = plain(summary.text).split(/(?<=\.)\s/)[0];
  // The headline already says "Senior Software Engineer", so the lead starts at the experience.
  const lead = firstSentence.replace(/^Senior Software Engineer with\s+/i, '').replace(/^./, c => c.toUpperCase());
  const intro = tokens.slice(0, tokens.findIndex(t => t.type === 'heading' && t.depth === 2)).filter(t => t.type === 'paragraph');
  const headline = plain(intro[0]?.text ?? '').split(/\s*\|\s*/);
  if (headline.length < 2) throw new Error('Missing CV headline');
  const location = plain(intro[1]?.tokens?.find(t => t.type === 'strong')?.text ?? '').replace(/^(.+), \1$/, '$1');
  const contactLinks = [];
  function collect(list) {
    for (const token of list) {
      if (token.type === 'link') contactLinks.push(token);
      if (token.tokens) collect(token.tokens);
    }
  }
  collect(tokens.slice(0, tokens.findIndex(t => t.type === 'heading' && t.depth === 2)));
  const links = () => '<p class="links">' + contactLinks.map(t => {
    const kind = t.href.startsWith('mailto:') ? 'email' : new URL(t.href).hostname === 'github.com' ? 'github' : new URL(t.href).hostname.endsWith('linkedin.com') ? 'linkedin' : 'blog';
    const name = { email: 'Email', blog: 'Blog', linkedin: 'LinkedIn', github: 'GitHub' }[kind];
    return `<a href="${ESC(t.href)}" title="${ESC(t.text)}">${contactIcon(kind)}<span>${name}</span></a>`;
  }).join(' ') + '</p>';
  // Closing call to action: email first, then the PDF and the profile links.
  const ctas = () => '<p class="cta">' + contactLinks.filter(t => t.href.startsWith('mailto:')).map(t => `<a class="btn primary" href="${ESC(t.href)}">Email me</a>`).join('')
    + '<a class="btn" href="Mohamed-Ashour-CV.pdf" download>Download PDF</a>'
    + contactLinks.filter(t => /linkedin|github/.test(t.href)).map(t => `<a class="btn" href="${ESC(t.href)}">${new URL(t.href).hostname.includes('linkedin') ? 'LinkedIn' : 'GitHub'}</a>`).join('') + '</p>';
  const scope = {
    ESC, ITEMS: items, PROJECTS, POSTS, youtube: contactLinksFrom(markdown, 'youtube.com'), blog: contactLinksFrom(markdown, 'blog.'), lead, headline, location, links, ctas, icon, scene, earth,
    orbit: index => {
      const angle = (-90 + index * 40) * Math.PI / 180;
      return `left:${(50 + 37 * Math.cos(angle)).toFixed(4)}%;top:${(50 + 37 * Math.sin(angle)).toFixed(4)}%`;
    },
    ART_CSS: await readFile('portfolio/palette.css', 'utf8') + OBJ_CSS,
    details: id => items.find(item => item.id === id).html,
  };
  const template = await readFile('portfolio/index.html', 'utf8');
  // Expressions are trusted repository-owned templates, never browser or user input.
  return template.replace(/\{\{=([\s\S]*?)\}\}/g, (_, expression) => String(Function(...Object.keys(scope), `return (${expression});`)(...Object.values(scope))));
}
