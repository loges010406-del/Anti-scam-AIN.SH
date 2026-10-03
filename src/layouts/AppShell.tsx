// src/layouts/AppShell.tsx
// Responsive shell: navy sidebar on desktop (>=768px), sticky top bar plus a
// 5-tab icon bottom nav on mobile. Both are built from one navItems config.
// Secondary pages (Safety Card, Report, About) live in the sidebar on desktop
// and in the top-bar "more" menu on mobile.
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Suspense, useEffect, useRef } from 'react';
import {
  BookOpen,
  FileText,
  Info,
  MoreVertical,
  PhoneCall,
  Radar,
  ShieldCheck,
  Users,
  Search,
  type LucideIcon,
} from 'lucide-react';
import type { Language } from '../types';
import { useI18n } from '../context/I18nProvider';
import { Icon } from '../components/common';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  primary: boolean;
}

export const navItems: NavItem[] = [
  { path: '/', labelKey: 'nav.check', icon: Search, primary: true },
  { path: '/call-coach', labelKey: 'nav.callCoach', icon: PhoneCall, primary: true },
  { path: '/learn', labelKey: 'nav.learn', icon: BookOpen, primary: true },
  { path: '/family', labelKey: 'nav.family', icon: Users, primary: true },
  { path: '/radar', labelKey: 'nav.radar', icon: Radar, primary: true },
  { path: '/safety-card', labelKey: 'nav.safetyCard', icon: ShieldCheck, primary: false },
  { path: '/report', labelKey: 'nav.report', icon: FileText, primary: false },
  { path: '/about', labelKey: 'nav.about', icon: Info, primary: false },
];

const primary = navItems.filter((n) => n.primary);
const secondary = navItems.filter((n) => !n.primary);

function LangPill({ language, onChange, dark }: { language: Language; onChange: (l: Language) => void; dark?: boolean }) {
  const opts: { v: Language; l: string }[] = [
    { v: 'ms', l: 'BM' },
    { v: 'en', l: 'EN' },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Bahasa / Language"
      className={`inline-flex rounded-full p-1 ${dark ? 'bg-white/10' : 'bg-surface'}`}
    >
      {opts.map((o) => {
        const on = o.v === language;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => !on && onChange(o.v)}
            className={[
              'min-h-[36px] min-w-tap rounded-full px-3 text-sm font-semibold outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent',
              on ? 'bg-accent text-white shadow' : dark ? 'text-white/80 hover:text-white' : 'text-navy',
            ].join(' ')}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function Brand({ dark }: { dark?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-2 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-accent to-violet-600 text-white shadow-glow">
        <Icon icon={ShieldCheck} size={22} />
      </span>
      <span className="leading-tight">
        <span className={`block text-lg font-extrabold ${dark ? 'text-white' : 'text-navy'}`}>Semak Dulu</span>
        <span className={`block text-xs ${dark ? 'text-white/60' : 'text-navy-mid'}`}>ScamShield</span>
      </span>
    </NavLink>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6" aria-busy="true">
      <div className="h-8 w-1/2 animate-pulse rounded-card bg-navy/10" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-navy/10" />
      <div className="mt-6 h-40 animate-pulse rounded-card bg-navy/10" />
    </div>
  );
}

export function AppShell() {
  const { t, language, setLanguage } = useI18n();
  const { pathname } = useLocation();
  const moreRef = useRef<HTMLDetailsElement>(null);

  // Scroll to top and close the mobile menu on every navigation.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (moreRef.current) moreRef.current.open = false;
  }, [pathname]);

  const sideLink = ({ isActive }: { isActive: boolean }) =>
    [
      'group flex min-h-btn items-center gap-3 rounded-xl px-3 text-base font-medium outline-none transition-all',
      'focus-visible:ring-2 focus-visible:ring-accent',
      isActive ? 'bg-gradient-to-r from-accent to-violet-600 text-white shadow-glow' : 'text-white/70 hover:translate-x-1 hover:bg-white/10 hover:text-white',
    ].join(' ');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside
        data-chrome="sidebar"
        className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden bg-gradient-to-b from-navy via-navy-deep to-[#0B0726] px-4 py-6 md:flex"
      >
        <div aria-hidden className="pointer-events-none absolute -left-20 top-1/3 h-56 w-56 rounded-full bg-violet-600/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 bottom-10 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <Brand dark />
        <nav aria-label={t('app.name')} className="relative mt-8 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {primary.map((n) => (
              <li key={n.path}>
                <NavLink to={n.path} end={n.path === '/'} className={sideLink}>
                  <Icon icon={n.icon} size={20} />
                  {t(n.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
          <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            {language === 'en' ? 'Tools' : 'Alatan'}
          </p>
          <ul className="space-y-1">
            {secondary.map((n) => (
              <li key={n.path}>
                <NavLink to={n.path} className={sideLink}>
                  <Icon icon={n.icon} size={20} />
                  {t(n.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative mt-4 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{language === 'en' ? 'Safety tip' : 'Tip keselamatan'}</p>
          <p className="mt-1 text-sm text-white/85">
            {language === 'en' ? 'Banks and police never ask for your OTP. Ever.' : 'Bank dan polis tidak pernah minta OTP anda. Sampai bila-bila.'}
          </p>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/60">{t('common.languageSwitcher')}</span>
          <LangPill language={language} onChange={setLanguage} dark />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-navy/10 bg-white/90 px-4 py-2 backdrop-blur md:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <LangPill language={language} onChange={setLanguage} />
          <details ref={moreRef} className="relative">
            <summary
              aria-label={language === 'en' ? 'More' : 'Lagi'}
              className="grid min-h-tap min-w-tap cursor-pointer list-none place-items-center rounded-full text-navy outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
            >
              <Icon icon={MoreVertical} />
            </summary>
            <ul className="absolute right-0 mt-2 w-52 overflow-hidden rounded-card border border-navy/10 bg-white py-1 shadow-xl animate-fade-in">
              {secondary.map((n) => (
                <li key={n.path}>
                  <NavLink
                    to={n.path}
                    className={({ isActive }) =>
                      `flex min-h-btn items-center gap-3 px-4 text-base outline-none hover:bg-surface focus-visible:bg-surface ${isActive ? 'font-semibold text-accent' : 'text-navy'}`
                    }
                  >
                    <Icon icon={n.icon} size={18} />
                    {t(n.labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </header>

      {/* Page content */}
      <div className="pb-24 md:ml-64 md:pb-8">
        <Suspense fallback={<PageSkeleton />}>
          <div key={pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </Suspense>
      </div>

      {/* Mobile bottom nav: exactly five tabs */}
      <nav
        data-chrome="bottom-nav"
        aria-label={t('app.name')}
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map((n) => (
            <li key={n.path}>
              <NavLink
                to={n.path}
                end={n.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex min-h-[60px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold leading-tight outline-none transition-colors',
                    'focus-visible:bg-surface',
                    isActive ? 'text-accent' : 'text-navy/60',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition-all ${isActive ? 'bg-gradient-to-r from-accent to-violet-600 text-white shadow-glow' : ''}`}>
                      <Icon icon={n.icon} size={20} />
                    </span>
                    <span className="max-w-full truncate">{t(n.labelKey)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default AppShell;


