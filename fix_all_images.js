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

    let parts = content.split(/<img\s+/);
    for (let i = 1; i < parts.length; i++) {
        let tagEnd = parts[i].indexOf('>');
        let tagBody = parts[i].substring(0, tagEnd);
        let remainder = parts[i].substring(tagEnd);
        
        let classMatch = tagBody.match(/className="([^"]*)"/);
        if (classMatch) {
            let cls = classMatch[1];
            if (!cls.includes('animate-pulse') && !cls.includes('bg-white/5')) {
                let newCls = cls + " bg-white/5 object-cover min-h-[40px] min-w-[40px] animate-pulse";
                tagBody = tagBody.replace(classMatch[0], `className="${newCls}"`);
            }
        } else {
            tagBody = `className="w-full h-full object-cover bg-white/5 animate-pulse min-h-[40px] min-w-[40px]" ` + tagBody;
        }
        parts[i] = tagBody + remainder;
    }
    content = parts.join('<img ');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}

const files = getFiles('src');
files.forEach(f => processFile(f));
