const fs = require('fs');
let text = fs.readFileSync('lib/ai/extract-learnings.ts', 'utf-8');
text = text.replaceAll('\\`', '`').replaceAll('\\$', '$');
fs.writeFileSync('lib/ai/extract-learnings.ts', text);
