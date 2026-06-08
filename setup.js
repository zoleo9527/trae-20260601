const fs = require('fs');
const path = require('path');
console.log('setup script loaded');


const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

function writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Written:', filePath);
}
