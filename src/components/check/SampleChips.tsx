// src/components/check/SampleChips.tsx
// One-tap sample messages so the Check flow is demoable offline. Scrolls
// horizontally on small screens, wraps on larger ones.
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ScamSample } from '../../types';
import samplesData from '../../data/scamSamples.json';
import { useI18n } from '../../context/I18nProvider';
import { Icon } from '../common';

const samples = samplesData as ScamSample[];

export interface SampleChipsProps {
  onPick: (content: string) => void;
  disabled?: boolean;
}

export function SampleChips({ onPick, disabled = false }: SampleChipsProps) {
  const { t } = useI18n();
  return (
    <section aria-label={t('check.samplesTitle')} className="mt-5">
      <p className="mb-2 text-sm font-semibold text-navy/70">{t('check.samplesTitle')}</p>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {samples.map((s) => {
          const scam = s.category === 'scam';
          return (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(s.content)}
                className={[
                  'flex min-h-tap items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-3.5 text-sm font-medium shadow-sm outline-none transition-all',
                  'hover:-translate-y-0.5 hover:shadow focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60',
                  scam ? 'border-risk-scam/25 text-navy' : 'border-risk-safe/30 text-navy',
                ].join(' ')}
              >
                <Icon
                  icon={scam ? AlertTriangle : CheckCircle2}
                  size={15}
                  className={scam ? 'text-risk-scam' : 'text-risk-safe'}
                />
                {s.label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default SampleChips;
