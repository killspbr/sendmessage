const fs = require('fs');
const path = require('path');

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('d=') && (content.includes('A') || content.includes('a'))) {
                const matches = content.match(/d="[^"]*"/g);
                if (matches) {
                    matches.forEach(m => {
                        if (/[Aa]/.test(m)) {
                            console.log(fullPath);
                            console.log(m);
                        }
                    });
                }
            }
        }
    });
}

walk('src');
