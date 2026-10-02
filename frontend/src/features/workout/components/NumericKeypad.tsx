import React from 'react';
import { Delete, Check, X } from 'lucide-react';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back' | 'clear' | 'done';

interface NumericKeypadProps {
    /** Shown in the keypad title bar, e.g. "Reps - Set 2" */
    title: string;
    /** Current buffer display */
    value: string;
    /** Whether the decimal point key is offered (reps/sec are integer-only) */
    allowDecimal?: boolean;
    onKey: (key: KeypadKey) => void;
    onClose: () => void;
}

/**
 * In-app numeric keypad (iOS calculator style). Replaces the system keyboard,
 * which is a full QWERTY layout on iOS WebViews and covers half the screen.
 * Rendered as a fixed bottom sheet just above the tab bar; it never triggers
 * focus/scroll-into-view, so the page header can never be pushed away.
 * Carries data-swipe-ignore so card swipe never hijacks it.
 */
const NumericKeypad: React.FC<NumericKeypadProps> = ({ title, value, allowDecimal = false, onKey, onClose }) => {
    const digit = (d: KeypadKey) => (
        <button
            type="button"
            data-swipe-ignore
            onClick={() => onKey(d)}
            className="w-full h-12 rounded-lg bg-slate-800 text-white text-lg font-bold active:bg-slate-600 active:scale-95 transition-all"
            style={{ touchAction: 'manipulation' }}
        >
            {d}
        </button>
    );

    return (
        <div
            className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-2 shadow-2xl"
            data-swipe-ignore
            style={{ touchAction: 'manipulation' }}
        >
            {/* Title bar: field label + live buffer */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
                <div className="flex items-center gap-2">
                    <span className="min-w-14 text-right text-lg font-black text-emerald-300 tabular-nums">
                        {value || '0'}
                    </span>
                    <button
                        type="button"
                        data-swipe-ignore
                        onClick={onClose}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
                        style={{ touchAction: 'manipulation' }}
                        title="Close keypad"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
                {digit('1')}{digit('2')}{digit('3')}
                <button
                    type="button" data-swipe-ignore onClick={() => onKey('back')}
                    className="w-full h-12 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center active:bg-slate-500 active:scale-95 transition-all"
                    style={{ touchAction: 'manipulation' }} title="Backspace"
                >
                    <Delete size={18} />
                </button>
                {digit('4')}{digit('5')}{digit('6')}
                <button
                    type="button" data-swipe-ignore onClick={() => onKey('clear')}
                    className="w-full h-12 rounded-lg bg-slate-700 text-slate-300 text-sm font-bold active:bg-slate-500 active:scale-95 transition-all"
                    style={{ touchAction: 'manipulation' }} title="Clear"
                >
                    C
                </button>
                {digit('7')}{digit('8')}{digit('9')}
                <button
                    type="button" data-swipe-ignore onClick={() => onKey('done')}
                    className="w-full h-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center active:bg-emerald-500 active:scale-95 transition-all"
                    style={{ touchAction: 'manipulation' }} title="Done"
                >
                    <Check size={18} />
                </button>
                <div className="col-span-2">{digit('0')}</div>
                <div className="col-span-2">
                    {allowDecimal ? digit('.') : <div />}
                </div>
            </div>
        </div>
    );
};

export default NumericKeypad;
