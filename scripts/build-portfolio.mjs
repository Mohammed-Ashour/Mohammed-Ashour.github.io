import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import { icon, scene, OBJ_CSS } from '../portfolio/objects.mjs';

const ESC = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const plain = text => text.replaceAll('**', '').trim();
const roles = [
  ['hydrosat', 'Hydrosat'], ['spire', 'Spire Global'], ['yaoota', 'Yaoota'],
  ['eaf', 'Egyptian Air Force'], ['elements', 'Elements Financial Technologies'],
  ['freelance', 'Self-Employed'], ['codescalers', 'Codescalers - Egypt'],
];

// Parse the established CV headings, failing the build rather than silently dropping sections.
export async function buildPortfolio(markdown) {
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
    const years = dates.match(/\b\d{4}\b|Present/gi)?.join(' – ') ?? dates;
    const html = `<h2 class="org" id="d-${id}-h">${ESC(org)}</h2><p class="meta"><span class="title">${ESC(title)}</span><span class="when">${ESC(dates)}</span></p>` + marked.parser(body.slice(1)).replaceAll('<ul>', '<ul class="pts">');
    return { id, name: id === 'eaf' ? 'Air Force' : id === 'elements' ? 'Elements' : id === 'freelance' ? 'Freelance' : id === 'codescalers' ? 'Codescalers' : org, years, html };
  });
  items.push({ id: 'toolkit', name: 'Toolkit', years: 'Skills', html: '<h2 class="org" id="d-toolkit-h">Technical skills</h2>' + marked.parser(section('Technical Skills', 2)).replaceAll('<ul>', '<ul class="pts">') });
  items.push({ id: 'school', name: 'School & writing', years: 'Education & teaching', html: '<h2 class="org" id="d-school-h">Education, writing &amp; teaching</h2>' + marked.parser([...section('Education', 2), ...section('Technical Writing & Education', 2)]).replaceAll('<ul>', '<ul class="pts">') });
  const summary = section('Professional Summary', 2).find(t => t.type === 'paragraph');
  if (!summary) throw new Error('Missing professional summary');
  const lead = plain(summary.text).split(/(?<=\.)\s/)[0];
  const contactLinks = [];
  function collect(list) {
    for (const token of list) {
      if (token.type === 'link') contactLinks.push(token);
      if (token.tokens) collect(token.tokens);
    }
  }
  collect(tokens.slice(0, tokens.findIndex(t => t.type === 'heading' && t.depth === 2)));
  const links = () => '<p class="links">' + contactLinks.map(t => `<a href="${ESC(t.href)}">${ESC(t.text)}</a>`).join(' ') + '</p>';
  const scope = {
    ESC, ITEMS: items, lead, links, icon, scene,
    ART_CSS: await readFile('portfolio/palette.css', 'utf8') + OBJ_CSS,
    details: id => items.find(item => item.id === id).html,
  };
  const template = await readFile('portfolio/index.html', 'utf8');
  // Expressions are trusted repository-owned templates, never browser or user input.
  return template.replace(/\{\{=([\s\S]*?)\}\}/g, (_, expression) => String(Function(...Object.keys(scope), `return (${expression});`)(...Object.values(scope))));
}
