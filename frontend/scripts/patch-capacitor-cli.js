import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Capacitor CLI 8.5.0 补丁集合
// 1. getMajoriOSVersion 只认识 ASCII pbxproj；XML plist 格式下会生成 .iOS(.v=") 非法 Swift。
// 2. writePluginJSON 会覆盖 packageClassList，导致自定义 SPM 插件（如 WorkoutTimerPlugin）被删掉。

function patchFile(filePath, oldText, newText, label) {
  const file = join(process.cwd(), filePath);
  let content = readFileSync(file, 'utf-8');
  if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    writeFileSync(file, content, 'utf-8');
    console.log(`[patch-capacitor-cli] ${label} patched.`);
  } else if (content.includes(newText)) {
    console.log(`[patch-capacitor-cli] ${label} already patched.`);
  } else {
    console.warn(`[patch-capacitor-cli] ${label} could not find target; skipping.`);
  }
}

// Patch 1: XML pbxproj 下的 iOS deployment target 读取
patchFile(
  'node_modules/@capacitor/cli/dist/ios/common.js',
  `function getMajoriOSVersion(config) {
    const pbx = (0, fs_extra_1.readFileSync)((0, path_1.join)(config.ios.nativeXcodeProjDirAbs, 'project.pbxproj'), 'utf-8');
    const searchString = 'IPHONEOS_DEPLOYMENT_TARGET = ';
    const iosVersion = pbx.substring(pbx.indexOf(searchString) + searchString.length, pbx.indexOf(searchString) + searchString.length + 2);
    return iosVersion;
}`,
  `function getMajoriOSVersion(config) {
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
}`,
  'getMajoriOSVersion'
);

// Patch 2: 保留 capacitor.config.json 里手动添加的 packageClassList 条目
patchFile(
  'node_modules/@capacitor/cli/dist/util/iosplugin.js',
  `async function writePluginJSON(config, classList) {
    const capJSONFile = (0, path_1.resolve)(config.ios.nativeTargetDirAbs, 'capacitor.config.json');
    const capJSON = (0, fs_extra_1.readJSONSync)(capJSONFile);
    capJSON['packageClassList'] = classList;
    (0, fs_extra_1.writeJSONSync)(capJSONFile, capJSON, { spaces: '\\t' });
}`,
  `async function writePluginJSON(config, classList) {
    const capJSONFile = (0, path_1.resolve)(config.ios.nativeTargetDirAbs, 'capacitor.config.json');
    const capJSON = (0, fs_extra_1.readJSONSync)(capJSONFile);
    // Preserve manually-added entries (e.g. custom SPM plugins like WorkoutTimerPlugin)
    // while still merging auto-discovered plugin classes.
    const existing = capJSON['packageClassList'] || [];
    capJSON['packageClassList'] = [...new Set([...classList, ...existing])];
    (0, fs_extra_1.writeJSONSync)(capJSONFile, capJSON, { spaces: '\\t' });
}`,
  'writePluginJSON'
);
