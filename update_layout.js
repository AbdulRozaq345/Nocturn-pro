const fs = require('fs');

let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!layout.includes('import Sidebar')) {
  layout = layout.replace('import { PlayerProvider } from "@/context/PlayerContext";', `import { PlayerProvider } from "@/context/PlayerContext";\nimport Sidebar from "@/components/sidebar";\nimport Topbar from "@/components/topbar";`);
}

layout = layout.replace(
  '{children}',
  `<div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">\n              <Sidebar />\n              <div className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar w-full">\n                <Topbar />\n                {children}\n              </div>\n            </div>`
);

fs.writeFileSync('src/app/layout.tsx', layout);

let page = fs.readFileSync('src/app/page.tsx', 'utf8');
page = page.replace(/<Sidebar \/>\s*/g, '');
page = page.replace(/<button className="text-\[#72fe8f].+?settings<\/span>\s*<\/button>/s, '');
page = page.replace(/<div className="flex h-screen overflow-hidden bg-\[#0a0a0a\] text-white">/, '<div className="w-full">');
page = page.replace(/<main className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar pb-36 md:pb-24 w-full">/, '<main className="w-full pb-36 md:pb-24">');

fs.writeFileSync('src/app/page.tsx', page);
