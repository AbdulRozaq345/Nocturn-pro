const fs = require('fs');

let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!layout.includes('fonts.googleapis.com/css2?family=Material+Symbols+Outlined')) {
  layout = layout.replace('<head>', '<head>\n<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=settings,play_arrow,headset,add,more_vert,pause,terminal" rel="stylesheet" />');
  if (!layout.includes('<head>')) {
     layout = layout.replace('<html lang="en">', '<html lang="en">\n<head>\n<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=settings,play_arrow,headset,add,more_vert,pause,terminal" rel="stylesheet" />\n</head>');
  }
}

fs.writeFileSync('src/app/layout.tsx', layout);
console.log('Fixed layout.tsx');
