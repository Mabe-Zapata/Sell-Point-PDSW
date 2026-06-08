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
        } else if (file.endsWith('.controller.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/presentation/controllers');
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Find controller path
    const ctrlMatch = content.match(/@Controller\('([^']+)'\)/);
    const basePath = ctrlMatch ? ctrlMatch[1] : '';

    const methodRegex = /@(Get|Post)\('([^']*)'\)[\s\S]*?(?:async\s+)?(\w+)\(.*?(?:@Query\('page'\)|page\??:\s*string).*?\{/g;
    const methodRegex2 = /@(Get|Post)\(\)[\s\S]*?(?:async\s+)?(\w+)\(.*?(?:@Query\('page'\)|page\??:\s*string).*?\{/g;

    let m;
    while ((m = methodRegex.exec(content)) !== null) {
        console.log(\Endpoint: \ /\\ (File: \)\);
    }
    while ((m = methodRegex2.exec(content)) !== null) {
        console.log(\Endpoint: \ /\ (File: \)\);
    }
});

