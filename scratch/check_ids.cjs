const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const js = fs.readFileSync('js/admin.js', 'utf8');
const missing = [];
const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
let match;
while ((match = regex.exec(js)) !== null) {
  const id = match[1];
  if (!html.includes('id=\"' + id + '\"') && !html.includes('id=\'' + id + '\'')) {
    missing.push(id);
  }
}
console.log('Missing IDs:', [...new Set(missing)]);
