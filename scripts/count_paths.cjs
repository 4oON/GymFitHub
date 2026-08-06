const fs = require('fs');
const content = fs.readFileSync('c:/zenfit/constants/musclePaths.ts', 'utf8');
const frontMatch = content.match(/baseSilhouette: "(.*?)"/);
if (frontMatch) {
    const paths = frontMatch[1].split(/M/g).filter(p => p.trim().length > 0);
    console.log('Front Paths Count:', paths.length);
} else {
    console.log('Front Match not found');
}
const backMatch = content.match(/baseSilhouette: "(.*?)"/); // Note: regex might match first occurrence only if not global, but here we want to check both. Actually regex above matches first.
// Let's just split the whole file by "baseSilhouette"
const parts = content.split('baseSilhouette: "');
if (parts.length > 1) {
    const front = parts[1].split('"')[0];
    const back = parts[2] ? parts[2].split('"')[0] : "";
    console.log('Front Paths:', front.split('M').length - 1);
    console.log('Back Paths:', back.split('M').length - 1);
}
