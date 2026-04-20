const fs = require('fs');

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
    
    // Remove all trailing/duplicate classNames inside img tags
    content = content.replace(/<img className="text-transparent"/g, '<img');

    // Make sure we merge everything safely
    let parts = content.split(/<img\s+/);
    for (let i = 1; i < parts.length; i++) {
        let endTag = parts[i].indexOf('>');
        if (endTag === -1) endTag = parts[i].indexOf('/>') + 1; // rough catch
        let tagBody = parts[i].substring(0, endTag);
        
        // Remove ALL className attributes from tagBody
        let accumulatedClasses = [];
        let cleanTagBody = tagBody;
        
        let clsMatch;
        const clsRegex = /className="([^"]*)"/g;
        while ((clsMatch = clsRegex.exec(tagBody)) !== null) {
            accumulatedClasses.push(clsMatch[1]);
        }
        
        if (accumulatedClasses.length > 0) {
            cleanTagBody = tagBody.replace(/className="[^"]*"\s*/g, '');
            // Merge classes
            let finalClasses = accumulatedClasses.join(' ').split(' ').filter((v, idx, arr) => v && arr.indexOf(v)===idx).join(' ');
            if (!finalClasses.includes('text-[0px]')) finalClasses += ' text-[0px] text-transparent';

            cleanTagBody = `className="${finalClasses.trim()}" ` + cleanTagBody;
        }

        parts[i] = cleanTagBody + parts[i].substring(endTag);
    }
    
    let newContent = parts.join('<img ');
    if(newContent !== content) fs.writeFileSync(f, newContent);
});
console.log("Fixed img multiple classes");
