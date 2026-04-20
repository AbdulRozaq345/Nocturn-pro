const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// There's a duplicate declaration. We just need to remove one.
// The snippet was applied twice maybe.
const fixImportsPattern = /const \[playlists, setPlaylists] = useState<any\[\]>\(\[\]\);[\s\S]*?fetchSidebarPlaylists\(\);\n  \}, \[\]\);/g;

let count = 0;
page = page.replace(fixImportsPattern, match => {
  count++;
  if (count === 1) return match;
  return '';
});

// Since there is a duplicate, we take it out. Let's make sure it replaced.
fs.writeFileSync('src/app/page.tsx', page);
console.log("Fixed duplicates");
