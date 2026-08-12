#!/usr/bin/env python3
"""
向 GymFitHub iOS 工程注入 watchOS target（ZenFit Watch App + Extension）。

安全策略：
- 所有 watchOS 条目作为完整的独立 section 块追加到 rootObject 之前
- 只做 3 处精确字符串替换（root children / products children / project targets），
  每处替换都要求唯一匹配，任何一步失败则放弃写入
- 不修改任何现有条目
"""

import re
import sys

PBX = "frontend/ios/App/App.xcodeproj/project.pbxproj"

_counter = {"n": 0}
def nid(tag="WATCH"):
    _counter["n"] += 1
    return f"{tag}{_counter['n']:012d}"[:24].upper()

IDS = {
    "watchAppProduct":    nid(),   # WatchApp.app
    "watchExtProduct":    nid(),   # WatchExtension.appex
    "watchAppGroup":      nid(),
    "watchExtGroup":      nid(),
    "watchAppFileRef":    nid(),   # WatchApp/Info.plist
    "watchExtInfoPlist":  nid(),   # Extension/Info.plist
    "watchExtAppSwift":   nid(),   # ZenFitWatchApp.swift
    "watchExtSession":    nid(),   # WatchSessionManager.swift
    "watchExtView":       nid(),   # WatchTimerView.swift
    "watchExtAssets":     nid(),   # Assets.xcassets
    "watchAppTarget":     nid(),
    "watchExtTarget":     nid(),
    "watchAppSources":    nid(),
    "watchAppResources":  nid(),
    "watchAppFrameworks": nid(),
    "watchExtSources":    nid(),
    "watchExtResources":  nid(),
    "watchExtFrameworks": nid(),
    "watchAppCfgList":    nid(),
    "watchExtCfgList":    nid(),
    "watchAppDebug":      nid(),
    "watchAppRelease":    nid(),
    "watchExtDebug":      nid(),
    "watchExtRelease":    nid(),
    "watchBuildAppSwift": nid(),
    "watchBuildSession":  nid(),
    "watchBuildView":     nid(),
    "watchBuildAssets":   nid(),
    "containerProxy":     nid(),
    "targetDependency":   nid(),
}

def tab(n=1):
    return "\t" * n

# ---------- 完整独立 section 块 ----------

blocks = ""

blocks += f"""
/* Begin PBXBuildFile section */
/* watchOS build files */
{IDS['watchBuildAppSwift']} /* ZenFitWatchApp.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {IDS['watchExtAppSwift']} /* ZenFitWatchApp.swift */; }};
{IDS['watchBuildSession']} /* WatchSessionManager.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {IDS['watchExtSession']} /* WatchSessionManager.swift */; }};
{IDS['watchBuildView']} /* WatchTimerView.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {IDS['watchExtView']} /* WatchTimerView.swift */; }};
{IDS['watchBuildAssets']} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {IDS['watchExtAssets']} /* Assets.xcassets */; }};
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
/* watchOS file references */
{IDS['watchAppProduct']} /* WatchApp.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = WatchApp.app; sourceTree = BUILT_PRODUCTS_DIR; }};
{IDS['watchExtProduct']} /* WatchExtension.appex */ = {{isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; includeInIndex = 0; path = WatchExtension.appex; sourceTree = BUILT_PRODUCTS_DIR; }};
{IDS['watchAppFileRef']} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; }};
{IDS['watchExtInfoPlist']} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; }};
{IDS['watchExtAppSwift']} /* ZenFitWatchApp.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ZenFitWatchApp.swift; sourceTree = "<group>"; }};
{IDS['watchExtSession']} /* WatchSessionManager.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WatchSessionManager.swift; sourceTree = "<group>"; }};
{IDS['watchExtView']} /* WatchTimerView.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WatchTimerView.swift; sourceTree = "<group>"; }};
{IDS['watchExtAssets']} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
/* watchOS frameworks build phases */
{IDS['watchAppFrameworks']} /* Frameworks */ = {{
{tab()}isa = PBXFrameworksBuildPhase;
{tab()}buildActionMask = 2147483647;
{tab()}files = (
{tab()});
{tab()}runOnlyForDeploymentPostprocessing = 0;
{tab()}}};
{IDS['watchExtFrameworks']} /* Frameworks */ = {{
{tab()}isa = PBXFrameworksBuildPhase;
{tab()}buildActionMask = 2147483647;
{tab()}files = (
{tab()});
{tab()}runOnlyForDeploymentPostprocessing = 0;
{tab()}}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
/* watchOS groups */
{IDS['watchAppGroup']} /* WatchApp */ = {{
{tab()}isa = PBXGroup;
{tab()}children = (
{tab()}{IDS['watchAppFileRef']} /* Info.plist */,
{tab()}{IDS['watchExtGroup']} /* WatchExtension */,
{tab()});
{tab()}path = WatchApp;
{tab()}sourceTree = "<group>";
{tab()}}};
{IDS['watchExtGroup']} /* WatchExtension */ = {{
{tab()}isa = PBXGroup;
{tab()}children = (
{tab()}{IDS['watchExtAppSwift']} /* ZenFitWatchApp.swift */,
{tab()}{IDS['watchExtSession']} /* WatchSessionManager.swift */,
{tab()}{IDS['watchExtView']} /* WatchTimerView.swift */,
{tab()}{IDS['watchExtAssets']} /* Assets.xcassets */,
{tab()}{IDS['watchExtInfoPlist']} /* Info.plist */,
{tab()});
{tab()}path = WatchExtension;
{tab()}sourceTree = "<group>";
{tab()}}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
/* watchOS native targets */
{IDS['watchAppTarget']} /* WatchApp */ = {{
{tab()}isa = PBXNativeTarget;
{tab()}buildConfigurationList = {IDS['watchAppCfgList']} /* Build configuration list for PBXNativeTarget "WatchApp" */;
{tab()}buildPhases = (
{tab()}{IDS['watchAppSources']} /* Sources */,
{tab()}{IDS['watchAppFrameworks']} /* Frameworks */,
{tab()}{IDS['watchAppResources']} /* Resources */,
{tab()});
{tab()}buildRules = (
{tab()});
{tab()}dependencies = (
{tab()}{IDS['targetDependency']} /* PBXTargetDependency */,
{tab()});
{tab()}name = WatchApp;
{tab()}productName = WatchApp;
{tab()}productReference = {IDS['watchAppProduct']} /* WatchApp.app */;
{tab()}productType = "com.apple.product-type.application.watchapp2";
{tab()}}};
{IDS['watchExtTarget']} /* WatchExtension */ = {{
{tab()}isa = PBXNativeTarget;
{tab()}buildConfigurationList = {IDS['watchExtCfgList']} /* Build configuration list for PBXNativeTarget "WatchExtension" */;
{tab()}buildPhases = (
{tab()}{IDS['watchExtSources']} /* Sources */,
{tab()}{IDS['watchExtFrameworks']} /* Frameworks */,
{tab()}{IDS['watchExtResources']} /* Resources */,
{tab()});
{tab()}buildRules = (
{tab()});
{tab()}dependencies = (
{tab()});
{tab()}name = WatchExtension;
{tab()}productName = WatchExtension;
{tab()}productReference = {IDS['watchExtProduct']} /* WatchExtension.appex */;
{tab()}productType = "com.apple.product-type.watchkit2-extension";
{tab()}}};
/* End PBXNativeTarget section */

/* Begin PBXContainerItemProxy section */
/* watchOS container item proxy */
{IDS['containerProxy']} /* PBXContainerItemProxy */ = {{
{tab()}isa = PBXContainerItemProxy;
{tab()}containerPortal = 504EC2FC1FED79650016851F /* Project object */;
{tab()}proxyType = 1;
{tab()}remoteGlobalIDString = {IDS['watchExtTarget']};
{tab()}remoteInfo = WatchExtension;
{tab()}}};
/* End PBXContainerItemProxy section */

/* Begin PBXResourcesBuildPhase section */
/* watchOS resources build phases */
{IDS['watchAppResources']} /* Resources */ = {{
{tab()}isa = PBXResourcesBuildPhase;
{tab()}buildActionMask = 2147483647;
{tab()}files = (
{tab()});
{tab()}runOnlyForDeploymentPostprocessing = 0;
{tab()}}};
{IDS['watchExtResources']} /* Resources */ = {{
{tab()}isa = PBXResourcesBuildPhase;
{tab()}buildActionMask = 2147483647;
{tab()}files = (
{tab()}{IDS['watchBuildAssets']} /* Assets.xcassets in Resources */,
{tab()});
{tab()}runOnlyForDeploymentPostprocessing = 0;
{tab()}}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
/* watchOS sources build phases */
{IDS['watchAppSources']} /* Sources */ = {{
{tab()}isa = PBXSourcesBuildPhase;
{tab()}buildActionMask = 2147483647;
{tab()}files = (
{tab()});
{tab()}runOnlyForDeploymentPostprocessing = 0;
{tab()}}};
{IDS['watchExtSources']} /* Sources */ = {{
{tab()}isa = PBXSourcesBuildPhase;
{tab()}buildActionMask = 2147483647;
{tab()}files = (
{tab()}{IDS['watchBuildAppSwift']} /* ZenFitWatchApp.swift in Sources */,
{tab()}{IDS['watchBuildSession']} /* WatchSessionManager.swift in Sources */,
{tab()}{IDS['watchBuildView']} /* WatchTimerView.swift in Sources */,
{tab()});
{tab()}runOnlyForDeploymentPostprocessing = 0;
{tab()}}};
/* End PBXSourcesBuildPhase section */

/* Begin PBXTargetDependency section */
/* watchOS target dependency */
{IDS['targetDependency']} /* PBXTargetDependency */ = {{
{tab()}isa = PBXTargetDependency;
{tab()}target = {IDS['watchExtTarget']} /* WatchExtension */;
{tab()}targetProxy = {IDS['containerProxy']} /* PBXContainerItemProxy */;
{tab()}}};
/* End PBXTargetDependency section */

/* Begin XCBuildConfiguration section */
/* watchOS build configurations */
{IDS['watchAppDebug']} /* Debug */ = {{
{tab()}isa = XCBuildConfiguration;
{tab()}buildSettings = {{
{tab()}{tab()}ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
{tab()}{tab()}ASSETCATALOG_COMPILER_WATCH_APP_ICON_NAME = AppIcon;
{tab()}{tab()}CODE_SIGN_STYLE = Automatic;
{tab()}{tab()}CURRENT_PROJECT_VERSION = 1;
{tab()}{tab()}DEVELOPMENT_TEAM = GSAYWM6VH6;
{tab()}{tab()}INFOPLIST_FILE = WatchApp/Info.plist;
{tab()}{tab()}MARKETING_VERSION = 1.0;
{tab()}{tab()}PRODUCT_BUNDLE_IDENTIFIER = com.gymfithub.app.watchkitapp;
{tab()}{tab()}PRODUCT_NAME = "$(TARGET_NAME)";
{tab()}{tab()}SDKROOT = watchos;
{tab()}{tab()}SKIP_INSTALL = YES;
{tab()}{tab()}SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
{tab()}{tab()}SWIFT_VERSION = 5.0;
{tab()}{tab()}TARGETED_DEVICE_FAMILY = 4;
{tab()}{tab()}WATCHOS_DEPLOYMENT_TARGET = 10.0;
{tab()}}};
{tab()}name = Debug;
{tab()}}};
{IDS['watchAppRelease']} /* Release */ = {{
{tab()}isa = XCBuildConfiguration;
{tab()}buildSettings = {{
{tab()}{tab()}ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
{tab()}{tab()}ASSETCATALOG_COMPILER_WATCH_APP_ICON_NAME = AppIcon;
{tab()}{tab()}CODE_SIGN_STYLE = Automatic;
{tab()}{tab()}CURRENT_PROJECT_VERSION = 1;
{tab()}{tab()}DEVELOPMENT_TEAM = GSAYWM6VH6;
{tab()}{tab()}INFOPLIST_FILE = WatchApp/Info.plist;
{tab()}{tab()}MARKETING_VERSION = 1.0;
{tab()}{tab()}PRODUCT_BUNDLE_IDENTIFIER = com.gymfithub.app.watchkitapp;
{tab()}{tab()}PRODUCT_NAME = "$(TARGET_NAME)";
{tab()}{tab()}SDKROOT = watchos;
{tab()}{tab()}SKIP_INSTALL = YES;
{tab()}{tab()}SWIFT_VERSION = 5.0;
{tab()}{tab()}TARGETED_DEVICE_FAMILY = 4;
{tab()}{tab()}WATCHOS_DEPLOYMENT_TARGET = 10.0;
{tab()}}};
{tab()}name = Release;
{tab()}}};
{IDS['watchExtDebug']} /* Debug */ = {{
{tab()}isa = XCBuildConfiguration;
{tab()}buildSettings = {{
{tab()}{tab()}CODE_SIGN_STYLE = Automatic;
{tab()}{tab()}CURRENT_PROJECT_VERSION = 1;
{tab()}{tab()}DEVELOPMENT_TEAM = GSAYWM6VH6;
{tab()}{tab()}GENERATE_INFOPLIST_FILE = YES;
{tab()}{tab()}INFOPLIST_FILE = WatchApp/WatchExtension/Info.plist;
{tab()}{tab()}MARKETING_VERSION = 1.0;
{tab()}{tab()}PRODUCT_BUNDLE_IDENTIFIER = com.gymfithub.app.watchkitapp.extension;
{tab()}{tab()}PRODUCT_NAME = "$(TARGET_NAME)";
{tab()}{tab()}SDKROOT = watchos;
{tab()}{tab()}SKIP_INSTALL = YES;
{tab()}{tab()}SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
{tab()}{tab()}SWIFT_VERSION = 5.0;
{tab()}{tab()}TARGETED_DEVICE_FAMILY = 4;
{tab()}{tab()}WATCHOS_DEPLOYMENT_TARGET = 10.0;
{tab()}}};
{tab()}name = Debug;
{tab()}}};
{IDS['watchExtRelease']} /* Release */ = {{
{tab()}isa = XCBuildConfiguration;
{tab()}buildSettings = {{
{tab()}{tab()}CODE_SIGN_STYLE = Automatic;
{tab()}{tab()}CURRENT_PROJECT_VERSION = 1;
{tab()}{tab()}DEVELOPMENT_TEAM = GSAYWM6VH6;
{tab()}{tab()}GENERATE_INFOPLIST_FILE = YES;
{tab()}{tab()}INFOPLIST_FILE = WatchApp/WatchExtension/Info.plist;
{tab()}{tab()}MARKETING_VERSION = 1.0;
{tab()}{tab()}PRODUCT_BUNDLE_IDENTIFIER = com.gymfithub.app.watchkitapp.extension;
{tab()}{tab()}PRODUCT_NAME = "$(TARGET_NAME)";
{tab()}{tab()}SDKROOT = watchos;
{tab()}{tab()}SKIP_INSTALL = YES;
{tab()}{tab()}SWIFT_VERSION = 5.0;
{tab()}{tab()}TARGETED_DEVICE_FAMILY = 4;
{tab()}{tab()}WATCHOS_DEPLOYMENT_TARGET = 10.0;
{tab()}}};
{tab()}name = Release;
{tab()}}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
/* watchOS configuration lists */
{IDS['watchAppCfgList']} /* Build configuration list for PBXNativeTarget "WatchApp" */ = {{
{tab()}isa = XCConfigurationList;
{tab()}buildConfigurations = (
{tab()}{IDS['watchAppDebug']} /* Debug */,
{tab()}{IDS['watchAppRelease']} /* Release */,
{tab()});
{tab()}defaultConfigurationIsVisible = 0;
{tab()}defaultConfigurationName = Release;
{tab()}}};
{IDS['watchExtCfgList']} /* Build configuration list for PBXNativeTarget "WatchExtension" */ = {{
{tab()}isa = XCConfigurationList;
{tab()}buildConfigurations = (
{tab()}{IDS['watchExtDebug']} /* Debug */,
{tab()}{IDS['watchExtRelease']} /* Release */,
{tab()});
{tab()}defaultConfigurationIsVisible = 0;
{tab()}defaultConfigurationName = Release;
{tab()}}};
/* End XCConfigurationList section */
"""

def replace_unique(content, old, new, label):
    """要求 old 在 content 中唯一出现，替换之；否则抛异常"""
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"[{label}] expected 1 match, found {count}")
    return content.replace(old, new)

def main():
    with open(PBX, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. 追加独立 section 块（在 rootObject 之前）
    anchor = "\trootObject = 504EC2FC1FED79650016851F /* Project object */;"
    assert anchor in content, "rootObject anchor not found"
    content = content.replace(anchor, blocks + "\n" + anchor, 1)

    # 2. root group children：加入 WatchApp 组（在 Products 之前）
    content = replace_unique(
        content,
        "\t\t\t\t504EC3061FED79650016851F /* App */,\n\t\t\t\t504EC3051FED79650016851F /* Products */,",
        f"\t\t\t\t504EC3061FED79650016851F /* App */,\n\t\t\t\t{IDS['watchAppGroup']} /* WatchApp */,\n\t\t\t\t504EC3051FED79650016851F /* Products */,",
        "root group children"
    )

    # 3. Products group children：加入 watch 产品
    content = replace_unique(
        content,
        "\t\t\t\t504EC3041FED79650016851F /* ZenFit.app */,\n\t\t\t);\n\t\t\tname = Products;",
        f"\t\t\t\t504EC3041FED79650016851F /* ZenFit.app */,\n\t\t\t\t{IDS['watchAppProduct']} /* WatchApp.app */,\n\t\t\t\t{IDS['watchExtProduct']} /* WatchExtension.appex */,\n\t\t\t);\n\t\t\tname = Products;",
        "products group children"
    )

    # 4. project targets 列表
    content = replace_unique(
        content,
        "\t\t\ttargets = (\n\t\t\t\t504EC3031FED79650016851F /* App */,\n\t\t\t);",
        f"\t\t\ttargets = (\n\t\t\t\t504EC3031FED79650016851F /* App */,\n\t\t\t\t{IDS['watchAppTarget']} /* WatchApp */,\n\t\t\t\t{IDS['watchExtTarget']} /* WatchExtension */,\n\t\t\t);",
        "project targets"
    )

    with open(PBX, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ watchOS targets injected. App={IDS['watchAppTarget']} Ext={IDS['watchExtTarget']}")

if __name__ == "__main__":
    main()
