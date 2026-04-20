const fs = require('fs');

// Wait I don't have glob, just recursively find files
function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (let file of list) {
        file = require('path').join(dir, file);
        const stat = fs.statSync(file);
        if (stat.isDirectory()) {
            getFiles(file, files);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            files.push(file);
        }
    }
    return files;
}

getFiles('src').forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // Remove the bad sed insert
    content = content.replace(/<img className="text-transparent" /g, '<img ');
    
    // Add text-transparent to any <img ...> if it doesn't have it
    let parts = content.split(/<img\s+/);
    for (let i = 1; i < parts.length; i++) {
        let endTag = parts[i].indexOf('>');
        let tagBody = parts[i].substring(0, endTag);
        
        let clsMatch = tagBody.match(/className="([^"]*)"/);
        if (clsMatch) {
            let cls = clsMatch[1];
            if (!cls.includes('text-transparent')) {
                tagBody = tagBody.replace(clsMatch[0], `className="${cls} text-transparent text-[0px]"`);
            }
        }
        parts[i] = tagBody + parts[i].substring(endTag);
    }
    let newContent = parts.join('<img ');
    if(newContent !== content) fs.writeFileSync(f, newContent);
});
console.log("Fixed img classes");
