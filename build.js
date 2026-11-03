/**
 * Build script for Vercel / static hosting deployments.
 * Copies index.html, css/, and js/ into dist/ so that deployments
 * with Output Directory set to either '.' (root) or 'dist' work seamlessly.
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('Starting static build for Neon Pulse: Cyber Runner 3D...');

// Clean and recreate dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy essential game assets
const assetsToCopy = ['index.html', 'css', 'js', 'README.md'];
for (const item of assetsToCopy) {
    const srcPath = path.join(rootDir, item);
    const destPath = path.join(distDir, item);
    if (fs.existsSync(srcPath)) {
        copyRecursive(srcPath, destPath);
        console.log(`Copied ${item} -> dist/${item}`);
    } else {
        console.warn(`Warning: ${item} not found at ${srcPath}`);
    }
}

console.log('Build successfully completed! Deployable files generated in dist/');
