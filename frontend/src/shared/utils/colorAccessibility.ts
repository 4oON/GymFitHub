// TODO: Update import paths after Phase 3 (constants migration)
import { MUSCLE_COLORS, validateColorContrast, generateColorAccessibilityReport } from '@/features/anatomy/constants/muscleColors';
import { MuscleGroup } from '@/shared/types';

/**
 * Color Accessibility Validation Utility
 * 
 * Provides comprehensive accessibility testing for the muscle color system
 * Ensures WCAG 2.1 AA compliance and color-blind friendly design
 */

interface AccessibilityTestResult {
    passed: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
}

interface ColorBlindnessSimulation {
    protanopia: string;    // Red-blind
    deuteranopia: string;  // Green-blind  
    tritanopia: string;    // Blue-blind
}

/**
 * Test all muscle colors for WCAG AA compliance
 */
export const testWCAGCompliance = (): AccessibilityTestResult => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passedTests = 0;
    let totalTests = 0;

    const muscles = Object.keys(MUSCLE_COLORS) as MuscleGroup[];

    // Test contrast against common background colors
    const backgroundColors = {
        'Dark Background': '#0f172a',  // slate-900
        'Light Background': '#ffffff', // white
        'Card Background': '#1e293b'   // slate-800
    };

    for (const muscle of muscles) {
        const color = MUSCLE_COLORS[muscle];

        for (const [bgName, bgColor] of Object.entries(backgroundColors)) {
            totalTests++;
            const hasGoodContrast = validateColorContrast(color, bgColor);

            if (hasGoodContrast) {
                passedTests++;
            } else {
                issues.push(`${muscle} color ${color} has poor contrast against ${bgName} (${bgColor})`);
                recommendations.push(`Consider adjusting ${muscle} color for better visibility on ${bgName}`);
            }
        }
    }

    // Test muscle colors against each other for distinguishability
    for (let i = 0; i < muscles.length; i++) {
        for (let j = i + 1; j < muscles.length; j++) {
            totalTests++;
            const color1 = MUSCLE_COLORS[muscles[i]];
            const color2 = MUSCLE_COLORS[muscles[j]];
            const hasGoodContrast = validateColorContrast(color1, color2);

            if (hasGoodContrast) {
                passedTests++;
            } else {
                issues.push(`${muscles[i]} (${color1}) and ${muscles[j]} (${color2}) are too similar`);
                recommendations.push(`Increase contrast between ${muscles[i]} and ${muscles[j]} colors`);
            }
        }
    }

    const score = Math.round((passedTests / totalTests) * 100);
    const passed = score >= 85; // 85% pass rate for AA compliance

    return {
        passed,
        score,
        issues,
        recommendations
    };
};

/**
 * Simulate color blindness for accessibility testing
 */
export const simulateColorBlindness = (hexColor: string): ColorBlindnessSimulation => {
    // Convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    };

    // Convert RGB to hex
    const rgbToHex = (r: number, g: number, b: number): string => {
        return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    };

    const [r, g, b] = hexToRgb(hexColor);

    // Protanopia (red-blind) simulation
    const protanopia = rgbToHex(
        0.567 * r + 0.433 * g + 0 * b,
        0.558 * r + 0.442 * g + 0 * b,
        0 * r + 0.242 * g + 0.758 * b
    );

    // Deuteranopia (green-blind) simulation  
    const deuteranopia = rgbToHex(
        0.625 * r + 0.375 * g + 0 * b,
        0.7 * r + 0.3 * g + 0 * b,
        0 * r + 0.3 * g + 0.7 * b
    );

    // Tritanopia (blue-blind) simulation
    const tritanopia = rgbToHex(
        0.95 * r + 0.05 * g + 0 * b,
        0 * r + 0.433 * g + 0.567 * b,
        0 * r + 0.475 * g + 0.525 * b
    );

    return {
        protanopia,
        deuteranopia,
        tritanopia
    };
};

/**
 * Test color distinguishability for color-blind users
 */
export const testColorBlindAccessibility = (): AccessibilityTestResult => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passedTests = 0;
    let totalTests = 0;

    const muscles = Object.keys(MUSCLE_COLORS) as MuscleGroup[];
    const colorBlindTypes = ['protanopia', 'deuteranopia', 'tritanopia'] as const;

    for (const colorBlindType of colorBlindTypes) {
        // Test if colors remain distinguishable under color blindness simulation
        for (let i = 0; i < muscles.length; i++) {
            for (let j = i + 1; j < muscles.length; j++) {
                totalTests++;

                const color1 = MUSCLE_COLORS[muscles[i]];
                const color2 = MUSCLE_COLORS[muscles[j]];

                const sim1 = simulateColorBlindness(color1);
                const sim2 = simulateColorBlindness(color2);

                const simulatedColor1 = sim1[colorBlindType];
                const simulatedColor2 = sim2[colorBlindType];

                const hasGoodContrast = validateColorContrast(simulatedColor1, simulatedColor2);

                if (hasGoodContrast) {
                    passedTests++;
                } else {
                    issues.push(`${muscles[i]} and ${muscles[j]} are indistinguishable for ${colorBlindType} users`);
                    recommendations.push(`Improve color separation for ${muscles[i]} and ${muscles[j]} considering ${colorBlindType}`);
                }
            }
        }
    }

    const score = Math.round((passedTests / totalTests) * 100);
    const passed = score >= 80; // 80% pass rate for color-blind accessibility

    return {
        passed,
        score,
        issues,
        recommendations
    };
};

/**
 * Generate comprehensive accessibility report
 */
export const generateAccessibilityReport = (): {
    wcagCompliance: AccessibilityTestResult;
    colorBlindAccessibility: AccessibilityTestResult;
    overallScore: number;
    overallPassed: boolean;
    summary: string;
} => {
    const wcagCompliance = testWCAGCompliance();
    const colorBlindAccessibility = testColorBlindAccessibility();

    const overallScore = Math.round((wcagCompliance.score + colorBlindAccessibility.score) / 2);
    const overallPassed = wcagCompliance.passed && colorBlindAccessibility.passed;

    let summary = `Accessibility Score: ${overallScore}%\n`;
    summary += `WCAG AA Compliance: ${wcagCompliance.passed ? 'PASS' : 'FAIL'} (${wcagCompliance.score}%)\n`;
    summary += `Color-Blind Friendly: ${colorBlindAccessibility.passed ? 'PASS' : 'FAIL'} (${colorBlindAccessibility.score}%)\n`;

    if (overallPassed) {
        summary += '\n✅ Color system meets accessibility standards!';
    } else {
        summary += '\n⚠️ Color system needs improvements for full accessibility.';
    }

    return {
        wcagCompliance,
        colorBlindAccessibility,
        overallScore,
        overallPassed,
        summary
    };
};

/**
 * Get color recommendations for specific muscle groups
 */
export const getColorRecommendations = (muscle: MuscleGroup): {
    currentColor: string;
    issues: string[];
    suggestions: string[];
} => {
    const currentColor = MUSCLE_COLORS[muscle];
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Test against common backgrounds
    const backgrounds = ['#0f172a', '#ffffff', '#1e293b'];
    for (const bg of backgrounds) {
        if (!validateColorContrast(currentColor, bg)) {
            issues.push(`Poor contrast against background ${bg}`);
        }
    }

    // Test color blindness
    const simulation = simulateColorBlindness(currentColor);
    const originalRgb = currentColor;

    if (simulation.protanopia === originalRgb) {
        suggestions.push('Consider adding more blue/green components for protanopia users');
    }
    if (simulation.deuteranopia === originalRgb) {
        suggestions.push('Consider adding more red/blue components for deuteranopia users');
    }
    if (simulation.tritanopia === originalRgb) {
        suggestions.push('Consider adding more red/green components for tritanopia users');
    }

    if (issues.length === 0) {
        suggestions.push('Color meets accessibility standards ✅');
    }

    return {
        currentColor,
        issues,
        suggestions
    };
};

/**
 * Export accessibility testing functions for console use
 */
export const accessibilityTools = {
    testWCAGCompliance,
    testColorBlindAccessibility,
    simulateColorBlindness,
    generateAccessibilityReport,
    getColorRecommendations,

    // Quick test function for development
    quickTest: () => {
        console.log('🎨 ZenFit Color Accessibility Report');
        console.log('=====================================');

        const report = generateAccessibilityReport();
        console.log(report.summary);

        if (!report.overallPassed) {
            console.log('\n📋 Issues Found:');
            [...report.wcagCompliance.issues, ...report.colorBlindAccessibility.issues]
                .slice(0, 5) // Show first 5 issues
                .forEach((issue, i) => console.log(`${i + 1}. ${issue}`));

            console.log('\n💡 Recommendations:');
            [...report.wcagCompliance.recommendations, ...report.colorBlindAccessibility.recommendations]
                .slice(0, 3) // Show first 3 recommendations
                .forEach((rec, i) => console.log(`${i + 1}. ${rec}`));
        }

        return report;
    }
};

// Make tools available globally for development
if (typeof window !== 'undefined') {
    (window as any).zenFitAccessibility = accessibilityTools;
}