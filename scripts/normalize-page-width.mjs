import fs from 'fs';
import path from 'path';

const dir = path.resolve('src/pages');
const replacements = [
  ['app-page-main md:ml-64 px-4 sm:px-6 pb-8', 'app-page-main md:ml-64 pb-8'],
  ['app-page-main md:ml-64 px-4 sm:px-8 lg:px-12 pb-8', 'app-page-main md:ml-64 pb-8'],
  [
    'app-page-main app-page-main--devnav w-full md:ml-64 px-4 sm:px-6 pb-8',
    'app-page-main app-page-main--devnav md:ml-64 pb-8',
  ],
  [
    'app-page-main md:ml-64 flex items-center justify-center min-h-[80vh] px-4 pb-8',
    'app-page-main md:ml-64 flex min-h-[80vh] items-center justify-center pb-8',
  ],
  ['className="max-w-4xl mx-auto"', 'className="app-shell-content"'],
  ['className="max-w-5xl mx-auto"', 'className="app-shell-content"'],
  ['className="max-w-3xl mx-auto"', 'className="app-shell-content"'],
  ['className="max-w-6xl mx-auto"', 'className="app-shell-content"'],
  ['className="mx-auto max-w-6xl"', 'className="app-shell-content"'],
  ['className="mx-auto w-full max-w-4xl"', 'className="app-shell-content"'],
  ['className="max-w-2xl mx-auto"', 'className="app-shell-content"'],
];

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const before = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content !== before) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', file);
  }
}
