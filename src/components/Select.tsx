import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
}

export default function Select({ options, value, onChange, disabled = false, id, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((v) => !v);
    }
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={ref} className="relative" id={id}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={`
          flex w-full items-center justify-between rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm transition
          ${open ? 'border-terra ring-2 ring-terra/10' : 'border-sand hover:border-sand-dark'}
          ${disabled ? 'cursor-not-allowed bg-cream-dark text-ink-tertiary' : 'text-ink'}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? '' : 'text-ink-tertiary'}>{selected?.label ?? placeholder ?? '—'}</span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-ink-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-sand bg-white py-1 shadow-lg shadow-ink/5"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`
                  flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm transition-colors
                  ${active ? 'bg-terra/5 text-terra font-medium' : 'text-ink hover:bg-cream-dark'}
                `}
              >
                <span>{opt.label}</span>
                {active && (
                  <svg className="h-4 w-4 text-terra" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Compact variant for header language selector
export function SelectCompact({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-sand px-2 py-1 text-xs text-ink-secondary transition hover:border-sand-dark hover:text-ink"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M1.5 8h13M8 1.5c-2 2-2.5 4-2.5 6.5s.5 4.5 2.5 6.5c2-2 2.5-4 2.5-6.5S10 3.5 8 1.5z" />
        </svg>
        <span>{selected?.label ?? '—'}</span>
        <svg className={`h-3 w-3 text-ink-tertiary transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 z-50 mt-1.5 min-w-[120px] overflow-hidden rounded-lg border border-sand bg-white py-1 shadow-lg shadow-ink/5">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`cursor-pointer px-3 py-1.5 text-xs transition-colors ${active ? 'bg-terra/5 text-terra font-medium' : 'text-ink-secondary hover:bg-cream-dark hover:text-ink'}`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
