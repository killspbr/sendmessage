const fs = require('fs');
const path = require('path');

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.svg') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(/d=["']([^"']+)["']/g);
            if (matches) {
                for (const m of matches) {
                    if (/[Aa]/.test(m)) {
                        // Check if arc flags are valid
                        // Arc command pattern: A rx ry x-rot laf sf x y
                        // flags must be 0 or 1
                        const d = m.slice(3, -1);
                        if (d.includes('a') || d.includes('A')) {
                            console.log(`FILE: ${fullPath}`);
                            console.log(`PATH: ${m}`);
                        }
                    }
                }
            }
        }
    }
}

walk('src');
