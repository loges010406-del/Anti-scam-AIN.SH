// src/layout/RootLayout.tsx
//
// Lightweight layout route used by the router (tasks.md 6.3).
//
// This is a deliberate stand-in for the responsive `AppShell` owned by
// tasks.md 6.2 (navy Sidebar on desktop, 5-tab BottomNav on mobile). It is
// placed under `src/layout/` (singular) so it does NOT collide with the
// `src/layouts/` directory that task 6.2 populates. When AppShell lands, App.tsx
// swaps <RootLayout/> for <AppShell/> and this file can be removed; the shared
// `navItems` config is exported here so it can move verbatim into AppShell.
//
// It renders:
//   - a simple nav built from `navItems` (NavLink => `aria-current` + active style)
//   - the LanguageSwitcher wired to the i18n context
//   - an <Outlet/> where the routed page renders
//
// _Requirements: 23.4, 30.1_

import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../context/I18nProvider';
import { LanguageSwitcher } from '../components/common';

/** A single navigation entry. `labelKey` is an i18n key; `path` is a route. */
export interface NavItem {
  /** Route path (absolute). */
  path: string;
  /** i18n key for the label, e.g. `nav.check`. */
  labelKey: string;
  /** Whether this item is one of the five primary tabs (CHECK/CALL COACH/LEARN/FAMILY/RADAR). */
  primary: boolean;
}

/**
 * Single source of truth for navigation. The first five are the primary tabs
 * surfaced in the mobile BottomNav (R23.3); the rest are secondary destinations
 * reachable from the desktop sidebar and in-app links. AppShell (task 6.2)
 * consumes this same shape.
 */
export const navItems: NavItem[] = [
  { path: '/', labelKey: 'nav.check', primary: true },
  { path: '/call-coach', labelKey: 'nav.callCoach', primary: true },
  { path: '/learn', labelKey: 'nav.learn', primary: true },
  { path: '/family', labelKey: 'nav.family', primary: true },
  { path: '/radar', labelKey: 'nav.radar', primary: true },
  { path: '/safety-card', labelKey: 'nav.safetyCard', primary: false },
  { path: '/report', labelKey: 'nav.report', primary: false },
  { path: '/about', labelKey: 'nav.about', primary: false },
];

export function RootLayout() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-navy-mid/15 px-4 py-3">
        <nav aria-label={t('app.name')}>
          <ul className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    [
                      'min-h-tap min-w-tap inline-flex items-center rounded-card px-3 py-2 text-base font-medium',
                      'outline-none transition-colors duration-150',
                      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-navy hover:bg-surface',
                    ].join(' ')
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <LanguageSwitcher
          language={language}
          onChange={setLanguage}
          groupLabel={t('common.languageSwitcher')}
        />
      </header>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default RootLayout;
