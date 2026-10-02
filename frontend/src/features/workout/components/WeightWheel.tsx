import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { WeightUnit } from '../utils/weightUnitUtils';
import { LB_PRESETS, lbToKg, kgToLb, round1, round2 } from '../utils/weightUnitUtils';

const ITEM_WIDTH = 38;
const WHEEL_HEIGHT = 44;
const PAD_WIDTH = `calc(50% - ${ITEM_WIDTH / 2}px)`;

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
    index: number;
    onSelect: (index: number) => void;
}

/**
 * Apple-style wheel number: no binary active/inactive color. Grayscale,
 * opacity and scale are painted continuously from the item's live distance
 * to the wheel center (see paintItems), so digits fade dark toward the
 * edges and glow white under the center marker while the wheel spins.
 */
const WheelItem = memo(({ display, index, onSelect }: WheelItemProps) => (
    <button
        type="button"
        data-wheel-item
        data-swipe-ignore
        onClick={() => onSelect(index)}
        className="flex-shrink-0 snap-center text-[15px] font-bold will-change-transform"
        style={{
            width: ITEM_WIDTH,
            height: WHEEL_HEIGHT,
            touchAction: 'manipulation',
            color: 'rgb(80 80 92)',
            opacity: 0.4,
            transform: 'scale(0.8)',
        }}
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

    /**
     * Paint every digit from its live distance to the wheel center:
     * edges are dark slate-gray and shrink, the digit under the marker
     * is bright white and full size, giving the "real wheel" feel.
     */
    const paintItems = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const centerX = el.getBoundingClientRect().left + el.clientWidth / 2;
        const range = Math.max(el.clientWidth * 0.4, 1);
        el.querySelectorAll<HTMLElement>('[data-wheel-item]').forEach(item => {
            const r = item.getBoundingClientRect();
            const d = Math.min(Math.abs(r.left + r.width / 2 - centerX) / range, 1);
            const t = 1 - d; // 1 = dead center
            const gray = Math.round(80 + t * 175); // 80 (dim) -> 255 (white)
            item.style.color = `rgb(${gray} ${gray} ${gray})`;
            item.style.opacity = (0.4 + t * 0.6).toFixed(2);
            item.style.transform = `scale(${(0.8 + t * 0.28).toFixed(3)})`;
        });
    }, []);

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

    // Paint grayscale/scale after mount, unit switch and smooth-scroll frames.
    useEffect(() => {
        paintItems();
        const el = scrollRef.current;
        if (!el) return;
        let raf = 0;
        const loop = () => { paintItems(); raf = requestAnimationFrame(loop); };
        // Only repaint while a scroll animation may be in flight.
        const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); window.setTimeout(() => cancelAnimationFrame(raf), 500); };
        el.addEventListener('scroll', start, { passive: true });
        return () => { el.removeEventListener('scroll', start); cancelAnimationFrame(raf); };
    }, [unit, paintItems]);

    const handleScroll = () => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const el = scrollRef.current;
            if (!el) return;
            paintItems();
            if (suppressScrollEmit.current) return;
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
                className="pointer-events-none absolute left-1/2 top-1 bottom-1 w-[2px] -translate-x-1/2 bg-emerald-500/40 rounded-full z-10"
            />
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                data-swipe-ignore
                className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
                style={{ touchAction: 'pan-x' }}
            >
                <div className="flex-shrink-0" style={{ width: PAD_WIDTH }} />
                {values.map((v, i) => (
                    <WheelItem
                        key={`${unit}-${v}`}
                        display={formatDisplay(v)}
                        index={i}
                        onSelect={handleSelect}
                    />
                ))}
                <div className="flex-shrink-0" style={{ width: PAD_WIDTH }} />
            </div>
        </div>
    );
};

export default WeightWheel;
