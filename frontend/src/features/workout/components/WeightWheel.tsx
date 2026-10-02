import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { WeightUnit } from '../utils/weightUnitUtils';
import { LB_PRESETS, lbToKg, kgToLb, round1, round2 } from '../utils/weightUnitUtils';

const ITEM_WIDTH = 48;
const WHEEL_HEIGHT = 44;

/**
 * kg-mode wheel steps: 0.5 kg increments up to 10 kg,
 * then 1 kg increments up to 60 kg (single dumbbell range).
 */
const KG_STEPS: number[] = (() => {
    const vals: number[] = [0];
    for (let v = 0.5; v <= 10.01; v += 0.5) vals.push(round1(v));
    for (let v = 11; v <= 60; v += 1) vals.push(v);
    return vals;
})();

interface WeightWheelProps {
    /** Stored weight in kg (0 = not set yet) */
    kgValue: number;
    unit: WeightUnit;
    onChange: (kg: number) => void;
}

interface WheelItemProps {
    display: string;
    active: boolean;
    index: number;
    onSelect: (index: number) => void;
}

const WheelItem = memo(({ display, active, index, onSelect }: WheelItemProps) => (
    <button
        type="button"
        data-swipe-ignore
        onClick={() => onSelect(index)}
        className={`flex-shrink-0 snap-center text-sm font-bold transition-colors duration-150 ${active ? 'text-white' : 'text-slate-500'
            }`}
        style={{ width: ITEM_WIDTH, height: WHEEL_HEIGHT, touchAction: 'manipulation' }}
    >
        {display}
    </button>
));

/**
 * Horizontal scroll-wheel weight picker (slot-machine style).
 * Renders the current unit's steps, converts to kg on every change,
 * and keeps the stored value canonical to the wheel's steps.
 * The container carries data-swipe-ignore so card swipe never hijacks it.
 */
const WeightWheel: React.FC<WeightWheelProps> = ({ kgValue, unit, onChange }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [centerIndex, setCenterIndex] = useState(0);
    const suppressScrollEmit = useRef(false);
    const rafRef = useRef<number | null>(null);

    const values = unit === 'lb' ? LB_PRESETS : KG_STEPS;
    const toKg = (display: number) => (unit === 'lb' ? lbToKg(display) : round2(display));

    const indexForKg = useCallback((kg: number): number => {
        if (!kg || kg <= 0) return 0;
        const target = unit === 'lb' ? kgToLb(kg) : kg;
        let best = 0;
        let bestDist = Infinity;
        values.forEach((v, i) => {
            const d = Math.abs(v - target);
            if (d < bestDist) { bestDist = d; best = i; }
        });
        return best;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unit]);

    const scrollToIndex = useCallback((index: number, smooth: boolean) => {
        const el = scrollRef.current;
        if (!el) return;
        suppressScrollEmit.current = true;
        el.scrollTo({ left: index * ITEM_WIDTH, behavior: smooth ? 'smooth' : 'auto' });
        setCenterIndex(index);
        window.setTimeout(() => { suppressScrollEmit.current = false; }, smooth ? 400 : 60);
    }, []);

    // External value changes (Quick Start, unit switch, restored session):
    // snap the wheel to the matching step instantly and canonicalize storage.
    useEffect(() => {
        const target = indexForKg(kgValue);
        if (target !== centerIndex) scrollToIndex(target, false);
        const canonical = toKg(values[target]);
        if (canonical !== kgValue) onChange(canonical);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kgValue, unit]);

    const handleScroll = () => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const el = scrollRef.current;
            if (!el || suppressScrollEmit.current) return;
            const i = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollLeft / ITEM_WIDTH)));
            if (i !== centerIndex) {
                setCenterIndex(i);
                onChange(toKg(values[i]));
            }
        });
    };

    const handleSelect = useCallback((i: number) => scrollToIndex(i, true), [scrollToIndex]);

    const formatDisplay = (v: number) => (unit === 'lb' ? `${v}` : `${Number(v.toFixed(1))}`);

    return (
        <div className="relative" data-swipe-ignore>
            <div
                className="pointer-events-none absolute left-1/2 top-1 bottom-1 w-[2px] -translate-x-1/2 bg-emerald-500/30 rounded-full z-10"
            />
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                data-swipe-ignore
                className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
                style={{ touchAction: 'pan-x' }}
            >
                <div className="flex-shrink-0" style={{ width: 'calc(50% - 24px)' }} />
                {values.map((v, i) => (
                    <WheelItem
                        key={`${unit}-${v}`}
                        display={formatDisplay(v)}
                        active={i === centerIndex}
                        index={i}
                        onSelect={handleSelect}
                    />
                ))}
                <div className="flex-shrink-0" style={{ width: 'calc(50% - 24px)' }} />
            </div>
        </div>
    );
};

export default WeightWheel;
