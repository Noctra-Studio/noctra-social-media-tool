const fs = require('fs');
let text = fs.readFileSync('app/calendar/page.tsx', 'utf-8');
text = text.replaceAll('\\`', '`').replaceAll('\\$', '$');
fs.writeFileSync('app/calendar/page.tsx', text);
