"""Requires Poppler's pdfinfo and pdftotext commands."""
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess


class CVText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_main = False
        self.in_style = False
        self.text = []

    def handle_starttag(self, tag, attrs):
        if tag == 'main':
            self.in_main = True
        if tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == 'main':
            self.in_main = False
        if tag == 'style':
            self.in_style = False

    def handle_data(self, data):
        if self.in_main and not self.in_style:
            self.text.append(data)


pdf = 'dist/Mohamed-Ashour-CV.pdf'
info = subprocess.check_output(['pdfinfo', pdf], text=True)
assert re.search(r'Pages:\s+2\b', info), 'CV must fit on two pages. Adjust print styles or page-break in cv.md.'
assert re.search(r'Tagged:\s+yes', info), 'PDF must be tagged.'
text = subprocess.check_output(['pdftotext', '-raw', pdf, '-'], text=True)
parser = CVText()
parser.feed(Path('dist/index.html').read_text())
normalize = lambda value: re.sub(r'[^a-z0-9]', '', value.lower())
assert normalize(''.join(parser.text)) == normalize(text), 'PDF text differs from the CV or has incorrect reading order.'
assert 'Download PDF' not in text, 'Website toolbar leaked into PDF.'
print('PDF checks passed: two pages, tagged, complete text in source order, no toolbar.')
