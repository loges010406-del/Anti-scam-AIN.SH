// src/components/check/CheckInput.tsx
// Input card: segmented mode switch, the matching control, a sensitive-data
// warning and the SEMAK button. Ctrl/Cmd+Enter submits from the textarea.
import { useState } from 'react';
import { ImageUp, Link2, Loader2, Lock, MessageSquareText, Phone, Search, X } from 'lucide-react';
import type { InputMode } from '../../types';
import { useI18n } from '../../context/I18nProvider';
import { Icon } from '../common';

export interface CheckInputProps {
  value: string;
  onChange: (value: string) => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const MODES: { m: InputMode; key: string; icon: typeof Phone }[] = [
  { m: 'text', key: 'check.modeText', icon: MessageSquareText },
  { m: 'phone', key: 'check.modePhone', icon: Phone },
  { m: 'screenshot', key: 'check.modeScreenshot', icon: ImageUp },
];

const field =
  'w-full rounded-xl border-2 border-navy/10 bg-white px-4 py-3 text-base text-navy placeholder:text-navy/40 outline-none transition-colors focus:border-accent';

export function CheckInput({ value, onChange, mode, onModeChange, onSubmit, loading = false }: CheckInputProps) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<string>('');

  return (
    <section aria-label={t('check.semakTitle')} className="rounded-2xl bg-white p-4 shadow-soft sm:p-5">
      <div role="tablist" aria-label={t('check.semakTitle')} className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1">
        {MODES.map(({ m, key, icon }) => {
          const active = m === mode;
          return (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onModeChange(m)}
              className={[
                'flex min-h-tap items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold outline-none transition-all sm:text-base',
                'focus-visible:ring-2 focus-visible:ring-accent',
                active ? 'bg-white text-navy shadow' : 'text-navy/60 hover:text-navy',
              ].join(' ')}
            >
              <Icon icon={icon} size={18} />
              <span className="truncate">{t(key)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {mode === 'text' && (
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmit();
              }}
              placeholder={t('check.textPlaceholder')}
              aria-label={t('check.textPlaceholder')}
              rows={5}
              className={`${field} resize-y pr-12`}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                aria-label={t('common.cancel')}
                className="absolute right-2 top-2 grid min-h-tap min-w-tap place-items-center rounded-full text-navy/40 hover:bg-surface hover:text-navy"
              >
                <Icon icon={X} size={18} />
              </button>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-navy/50">
              <Icon icon={Link2} size={14} /> {value.length} / 4000
            </p>
          </div>
        )}
        {mode === 'phone' && (
          <input
            type="tel"
            inputMode="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder={t('check.phonePlaceholder')}
            aria-label={t('check.phonePlaceholder')}
            className={`${field} min-h-btn text-lg tracking-wide`}
          />
        )}
        {mode === 'screenshot' && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 px-4 py-8 text-center transition-colors hover:bg-accent/10 focus-within:ring-2 focus-within:ring-accent">
            {preview ? (
              <img src={preview} alt="" className="max-h-48 rounded-lg object-contain shadow" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-accent shadow">
                <Icon icon={ImageUp} size={26} />
              </span>
            )}
            <span className="text-base font-semibold text-navy">{value || t('check.screenshotPrompt')}</span>
            <span className="text-sm text-accent">{t('check.screenshotChoose')}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (preview) URL.revokeObjectURL(preview);
                setPreview(f ? URL.createObjectURL(f) : '');
                onChange(f ? f.name : '');
              }}
            />
          </label>
        )}
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-navy/70">
        <Icon icon={Lock} size={16} className="shrink-0 text-risk-suspicious" />
        {t('check.sensitiveWarning')}
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-navy-mid text-lg font-bold text-white shadow-lg shadow-accent/30 outline-none transition-all hover:brightness-110 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-accent/40 disabled:opacity-70"
      >
        <Icon icon={loading ? Loader2 : Search} size={22} className={loading ? 'animate-spin' : ''} />
        {loading ? t('check.loading') : t('check.cta')}
      </button>
    </section>
  );
}

export default CheckInput;
