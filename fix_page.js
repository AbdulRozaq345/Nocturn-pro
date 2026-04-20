const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// Remove Desktop Header
const desktopHeaderRegex = /<header className="hidden md:flex h-16 md:h-20 justify-between items-center px-4 md:px-12 sticky top-0 z-40 bg-\[#0a0a0a\]\/60 backdrop-blur-md">[\s\S]*?<\/header>/g;
pageContent = pageContent.replace(desktopHeaderRegex, '');

// Remove Mobile Header
const mobileHeaderRegex = /<header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16 transition-all duration-300 bg-\[#0a0a0a\]\/75 backdrop-blur-md border-b border-white\/5">[\s\S]*?<\/header>/g;
pageContent = pageContent.replace(mobileHeaderRegex, '');

// Improve Image skeleton and replace <img> with valid alt or skeletons (basic replace)
// the cover image in mobile Hero:
const imgPattern = /<img\s+className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700"\s+alt="Cover"\s+src=\{currentTrack\?\.cover_url \|\| "[^"]+"\}\s+\/>/g;
const replacementHero = `
              {currentTrack?.cover_url ? (
                <img
                  className="w-[105%] h-[105%] -left-[2.5%] -top-[2.5%] object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700 absolute"
                  alt="Cover"
                  src={currentTrack.cover_url}
                />
              ) : (
                <div className="w-full h-full bg-white/10 animate-pulse absolute inset-0"></div>
              )}`;

pageContent = pageContent.replace(imgPattern, replacementHero);

fs.writeFileSync('src/app/page.tsx', pageContent);
console.log('Fixed page.tsx');
