import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Capacitor CLI 8.5.0 的 getMajoriOSVersion 只认识 ASCII pbxproj。
// 当 project.pbxproj 被 plutil 转成 XML plist 后，它会生成 .iOS(.v=") 这种非法 Swift。
// 这个补丁让 CLI 在 XML pbxproj 下也能正确读取 IPHONEOS_DEPLOYMENT_TARGET。

const file = join(process.cwd(), 'node_modules/@capacitor/cli/dist/ios/common.js');
let content = readFileSync(file, 'utf-8');

const oldFn = `function getMajoriOSVersion(config) {
    const pbx = (0, fs_extra_1.readFileSync)((0, path_1.join)(config.ios.nativeXcodeProjDirAbs, 'project.pbxproj'), 'utf-8');
    const searchString = 'IPHONEOS_DEPLOYMENT_TARGET = ';
    const iosVersion = pbx.substring(pbx.indexOf(searchString) + searchString.length, pbx.indexOf(searchString) + searchString.length + 2);
    return iosVersion;
}`;

const newFn = `function getMajoriOSVersion(config) {
    const pbx = (0, fs_extra_1.readFileSync)((0, path_1.join)(config.ios.nativeXcodeProjDirAbs, 'project.pbxproj'), 'utf-8');
    const searchString = 'IPHONEOS_DEPLOYMENT_TARGET = ';
    const idx = pbx.indexOf(searchString);
    if (idx !== -1) {
        return pbx.substring(idx + searchString.length, idx + searchString.length + 2);
    }
    // XML-format pbxproj fallback
    const xmlMatch = pbx.match(/<key>IPHONEOS_DEPLOYMENT_TARGET<\\/key>\\s*<string>(\\d+)(?:\\.\\d+)?<\\/string>/);
    if (xmlMatch) {
        return xmlMatch[1];
    }
    return '15';
}`;

if (content.includes(oldFn)) {
  content = content.replace(oldFn, newFn);
  writeFileSync(file, content, 'utf-8');
  console.log('[patch-capacitor-cli] getMajoriOSVersion patched for XML pbxproj.');
} else if (content.includes(newFn)) {
  console.log('[patch-capacitor-cli] already patched.');
} else {
  console.warn('[patch-capacitor-cli] could not find getMajoriOSVersion; skipping.');
}
