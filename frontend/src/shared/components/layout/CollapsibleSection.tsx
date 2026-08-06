import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdaptiveHeightContainer from './AdaptiveHeightContainer';

interface CollapsibleSectionProps {
    /** Section title */
    title: string;
    /** Section content */
    children: React.ReactNode;
    /** Whether the section is initially expanded */
    defaultExpanded?: boolean;
    /** Custom class name for the container */
    className?: string;
    /** Custom class name for the header */
    headerClassName?: string;
    /** Custom class name for the content */
    contentClassName?: string;
    /** Animation duration in milliseconds */
    animationDuration?: number;
    /** Whether to show expand/collapse icon */
    showIcon?: boolean;
    /** Callback when expand/collapse state changes */
    onToggle?: (expanded: boolean) => void;
}

/**
 * Collapsible section component with smooth height animations
 * Uses AdaptiveHeightContainer for fluid expand/collapse animations
 */
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    children,
    defaultExpanded = false,
    className = '',
    headerClassName = '',
    contentClassName = '',
    animationDuration = 300,
    showIcon = true,
    onToggle,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handleToggle = () => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);
        onToggle?.(newExpanded);
    };

    return (
        <div className={`bg-slate-900 rounded-xl border border-slate-800 overflow-hidden ${className}`}>
            {/* Header */}
            <button
                onClick={handleToggle}
                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors ${headerClassName}`}
            >
                <h3 className="font-bold text-white">{title}</h3>
                {showIcon && (
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} className="text-slate-400" />
                    </div>
                )}
            </button>

            {/* Content with adaptive height animation */}
            <AdaptiveHeightContainer
                duration={animationDuration}
                minHeight={0}
                animateOnMount={false}
            >
                {isExpanded && (
                    <div className={`px-4 pb-4 ${contentClassName}`}>
                        {children}
                    </div>
                )}
            </AdaptiveHeightContainer>
        </div>
    );
};

export default CollapsibleSection;

/**
 * @example
 * // Basic usage
 * <CollapsibleSection title="Exercise Details">
 *   <p>This content will smoothly expand and collapse</p>
 * </CollapsibleSection>
 *
 * @example
 * // With custom settings
 * <CollapsibleSection
 *   title="Advanced Options"
 *   defaultExpanded={true}
 *   animationDuration={500}
 *   onToggle={(expanded) => console.log('Section expanded:', expanded)}
 * >
 *   <div>Complex content here</div>
 * </CollapsibleSection>
 *
 * @example
 * // Custom styling
 * <CollapsibleSection
 *   title="Custom Styled Section"
 *   className="mb-4"
 *   headerClassName="bg-emerald-500/10"
 *   contentClassName="text-slate-300"
 *   showIcon={false}
 * >
 *   <div>Content with custom styling</div>
 * </CollapsibleSection>
 */