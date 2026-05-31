const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src');
const badPatternFiles = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('getRawMany') && (content.includes('.skip') || content.includes('.take'))) {
        if (/skip\([^)]+\)[\s\S]{0,150}getRawMany/m.test(content) || /take\([^)]+\)[\s\S]{0,150}getRawMany/m.test(content)) {
            badPatternFiles.push(file);
        }
    }
});

console.log(badPatternFiles.join('\n'));
