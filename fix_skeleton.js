const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (let file of list) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat.isDirectory()) {
            getFiles(file, files);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            files.push(file);
        }
    }
    return files;
}

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/<img([^\>]*?)className="([^\"]*)"([^\>]*?)>/g, (m, p1, p2, p3) => {
        if (!p2.includes('animate-pulse') && !p2.includes('skeleton') && !p2.includes('bg-white/5')) {
            return `<img${p1}className="${p2} bg-white/5 object-cover min-h-[40px] min-w-[40px] animate-pulse"${p3}>`;
        }
        return m;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}

const files = getFiles('src');
files.forEach(f => processFile(f));
