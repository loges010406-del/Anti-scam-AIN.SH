// src/pages/AboutPage.tsx
//
// About / Emergency page (Tentang & Bantuan).
//
// Describes the product purpose, how the analysis works (AI enrichment with a
// rule-based offline fallback), and the privacy posture (R21.1). It also
// provides emergency and reporting guidance (R21.2) that references official
// channels GENERICALLY â€” it NEVER invents a phone number or official contact
// (R21.3, R29.1). All UI copy is sourced from the i18n service (R22.3).
//
// _Requirements: 21.1, 21.2, 21.3, 29.1_

import {
  Info,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  LifeBuoy,
} from 'lucide-react';
import { useI18n } from '../context/I18nProvider';
import { Icon, PageHero } from '../components/common';

export function AboutPage() {
  const { t } = useI18n();

  const emergencySteps = [
    t('about.emergencyStep1'),
    t('about.emergencyStep2'),
    t('about.emergencyStep3'),
    t('about.emergencyStep4'),
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 text-navy sm:py-8">
      <PageHero icon={Info} tone="blue" title={t('about.title')} subtitle={t('about.subtitle')} />

      {/* Purpose (R21.1) */}
      <section
        aria-labelledby="about-purpose-heading"
        className="mb-6 card p-5 sm:p-6"
      >
        <h2
          id="about-purpose-heading"
          className="mb-2 flex items-center gap-2 text-xl font-semibold"
        >
          <Icon icon={Info} className="text-accent" />
          {t('about.purposeTitle')}
        </h2>
        <p className="text-base">{t('about.purposeBody')}</p>
      </section>

      {/* How the analysis works: AI + fallback (R21.1) */}
      <section
        aria-labelledby="about-how-heading"
        className="mb-6 card p-5 sm:p-6"
      >
        <h2
          id="about-how-heading"
          className="mb-2 flex items-center gap-2 text-xl font-semibold"
        >
          <Icon icon={Cpu} className="text-accent" />
          {t('about.howTitle')}
        </h2>
        <p className="mb-3 text-base">{t('about.howIntro')}</p>
        <ul className="mb-3 list-disc space-y-2 pl-6 text-base">
          <li>{t('about.howAi')}</li>
          <li>{t('about.howFallback')}</li>
        </ul>
        <p className="text-base font-medium">{t('about.howNote')}</p>
      </section>

      {/* Privacy posture (R21.1) */}
      <section
        aria-labelledby="about-privacy-heading"
        className="mb-6 card p-5 sm:p-6"
      >
        <h2
          id="about-privacy-heading"
          className="mb-2 flex items-center gap-2 text-xl font-semibold"
        >
          <Icon icon={ShieldCheck} className="text-accent" />
          {t('about.privacyTitle')}
        </h2>
        <p className="text-base">{t('about.privacyBody')}</p>
      </section>

      {/* No-guarantee disclaimer (R3 posture, reinforced here) */}
      <section
        aria-labelledby="about-disclaimer-heading"
        className="mb-6 card p-5 sm:p-6"
      >
        <h2
          id="about-disclaimer-heading"
          className="mb-2 flex items-center gap-2 text-xl font-semibold"
        >
          <Icon icon={AlertTriangle} className="text-accent" />
          {t('about.disclaimerTitle')}
        </h2>
        <p className="text-base">{t('about.disclaimerBody')}</p>
      </section>

      {/* Emergency / reporting guidance (R21.2). References official channels
          GENERICALLY â€” no invented phone number or official contact is shown
          anywhere on this page (R21.3, R29.1). */}
      <section
        aria-labelledby="about-emergency-heading"
        className="card p-5 sm:p-6"
      >
        <h2
          id="about-emergency-heading"
          className="mb-2 flex items-center gap-2 text-xl font-semibold"
        >
          <Icon icon={LifeBuoy} className="text-accent" />
          {t('about.emergencyTitle')}
        </h2>
        <p className="mb-3 text-base">{t('about.emergencyIntro')}</p>
        <ol className="mb-3 list-decimal space-y-1 pl-6 text-base">
          {emergencySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-sm text-navy-mid">{t('about.emergencyNote')}</p>
      </section>
    </main>
  );
}

export default AboutPage;


