// Side projects and writing shown under "Selected work". Keep descriptions to one sentence.
export const PROJECTS = [
  {
    id: 'khonsu', name: 'Khonsu', kind: 'Open source',
    text: 'Track satellites and predict passes from the terminal, with a TUI, a scriptable JSON CLI and self-contained 3D orbit exports.',
    tech: ['Go', 'Orbital mechanics', 'CLI'],
    href: 'https://github.com/Mohammed-Ashour/Khonsu', cta: 'View on GitHub',
  },
  {
    id: 'lodvault', name: 'LODVault', kind: 'Browser extension',
    text: 'Save Luxembourgish words while reading lod.lu, then review them with spaced-repetition flashcards.',
    tech: ['JavaScript', 'Chrome extension'],
    href: 'https://chromewebstore.google.com/detail/gdileleimdnibmieodhnjijmepjdfgil', cta: 'Chrome Web Store',
    more: ['https://github.com/Mohammed-Ashour/lod-vault', 'Source'],
  },
  {
    id: 'writeup', name: 'Space meets AI', kind: 'Write-up',
    text: 'How AI is moving onto satellites and into ground processing, why downlink limits matter, and what still holds it back.',
    tech: ['Earth observation', 'ML'],
    href: 'https://blog.m-ashour.space/p/space-meets-ai-onboard-and-on-ground', cta: 'Read the article',
  },
];

// Most-read posts first, following the blog's "top" ranking.
export const POSTS = [
  ['The Design Loop: how initial system designs evolve', 'https://blog.m-ashour.space/p/the-design-loop-my-notes-on-how-initial', '2025'],
  ['My notes on the pursuit of maturity as a software engineer', 'https://blog.m-ashour.space/p/my-notes-on-the-pursuit-of-maturity', '2025'],
  ['The pre-commit stage and defect cost in the age of AI', 'https://blog.m-ashour.space/p/the-pre-commit-stage-and-the-defect', '2026'],
  ['The four-ingredient blend for senior-level jobs', 'https://blog.m-ashour.space/p/the-four-ingredients-blend-for-senior', '2025'],
  ["Stop DoS-ing your own team", 'https://blog.m-ashour.space/p/stop-dos-ing-your-own-team', '2025'],
];
