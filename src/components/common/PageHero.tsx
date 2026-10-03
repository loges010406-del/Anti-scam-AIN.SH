// src/components/common/PageHero.tsx
// Colourful page header: gradient banner with a glowing icon tile, title,
// subtitle, a dotted texture and soft floating blobs. Each page passes its
// own tone so sections are easy to tell apart at a glance.
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type HeroTone = 'blue' | 'violet' | 'emerald' | 'rose' | 'cyan' | 'indigo' | 'amber';

const TONES: Record<HeroTone, string> = {
  blue: 'from-navy via-navy-mid to-accent',
  violet: 'from-indigo-900 via-violet-700 to-fuchsia-600',
  emerald: 'from-emerald-900 via-emerald-700 to-teal-500',
  rose: 'from-rose-900 via-rose-600 to-orange-500',
  cyan: 'from-sky-900 via-cyan-700 to-teal-400',
  indigo: 'from-slate-900 via-indigo-800 to-indigo-500',
  amber: 'from-amber-800 via-orange-600 to-yellow-500',
};

export interface PageHeroProps {
  icon: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: HeroTone;
  /** Extra content under the subtitle (chips, badges, buttons). */
  children?: ReactNode;
}

export function PageHero({ icon, title, subtitle, tone = 'blue', children }: PageHeroProps) {
  return (
    <header className={`relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br ${TONES[tone]} p-5 text-white shadow-glow sm:p-7`}>
      {/* texture + blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-20" />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 animate-blob rounded-full bg-white/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 animate-blob rounded-full bg-white/10 blur-3xl [animation-delay:-6s]" />
      <Icon icon={icon} size={160} aria-hidden className="pointer-events-none absolute -bottom-8 -right-6 rotate-12 text-white/10" />

      <div className="relative flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 shadow-lg ring-1 ring-white/30 backdrop-blur">
          <Icon icon={icon} size={28} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-sm sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-base text-white/85">{subtitle}</p> : null}
        </div>
      </div>
      {children ? <div className="relative mt-4">{children}</div> : null}
    </header>
  );
}

export default PageHero;
