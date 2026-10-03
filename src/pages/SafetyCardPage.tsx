// src/pages/SafetyCardPage.tsx
//
// Printable Safety Card (Kad Keselamatan).
//
// A print-friendly, high-contrast card the user can keep offline for themselves
// or an elderly relative. It presents the six core reminders and generic
// emergency/reporting guidance that references official channels only â€” it
// NEVER invents a phone number or official contact (R29.1, R18.3).
//
// TODO(i18n, tasks.md 5.2): the i18n provider (useI18n/t) is being implemented
// concurrently and is not reliably importable yet. To avoid a build break the
// copy below is kept self-contained (BM-first plain strings in a local
// constant). Once the provider lands, these strings move to i18n/ms.json and
// i18n/en.json and are read via t(). The DOM structure here is designed so that
// swap is a drop-in: replace each string with a t('safetyCard.*') lookup.
//
// This page is not wired into the router yet (router is tasks.md 6.3); it is
// exported as default so task 6.3 can mount it at /safety-card.
//
// _Requirements: 18.1, 18.2, 18.3, 29.1_

import { Printer } from 'lucide-react';
import { Button } from '../components/common';

/**
 * Self-contained, BM-first copy for the Safety Card.
 *
 * TODO(i18n): migrate to i18n/ms.json + i18n/en.json under the `safetyCard.*`
 * namespace once the I18nProvider (tasks.md 5.2) is importable.
 */
const COPY = {
  title: 'Kad Keselamatan Semak Dulu',
  subtitle: 'Simpan kad ini. Cetak dan tampal di tempat yang mudah dilihat.',
  printButton: 'Cetak kad',
  remindersHeading: 'Enam peringatan penting',
  footerNote:
    'Semak Dulu ialah alat bantu. Ia tidak menggantikan nasihat rasmi. ' +
    'Sentiasa sahkan sendiri melalui saluran rasmi.',
  // Six core reminders (R18.2). Order and label are fixed by the requirement:
  // STOP / CHECK / DON'T SHARE OTP / DON'T TRANSFER / VERIFY OFFICIALLY / TELL FAMILY.
  reminders: [
    {
      key: 'stop',
      badge: 'BERHENTI',
      en: 'STOP',
      body: 'Berhenti sebentar. Jangan terburu-buru walau sebesar mana tekanan diberi.',
    },
    {
      key: 'check',
      badge: 'SEMAK',
      en: 'CHECK',
      body: 'Semak mesej, pautan, atau panggilan dengan Semak Dulu sebelum bertindak.',
    },
    {
      key: 'dont-share-otp',
      badge: 'JANGAN KONGSI OTP',
      en: "DON'T SHARE OTP",
      body: 'Jangan sekali-kali beri kod OTP, PIN, atau kata laluan kepada sesiapa.',
    },
    {
      key: 'dont-transfer',
      badge: 'JANGAN PINDAH WANG',
      en: "DON'T TRANSFER",
      body: 'Jangan pindah wang ke "akaun selamat". Tiada pihak rasmi meminta begitu.',
    },
    {
      key: 'verify-officially',
      badge: 'SAHKAN SECARA RASMI',
      en: 'VERIFY OFFICIALLY',
      body: 'Hubungi bank atau agensi melalui nombor rasmi mereka sendiri, bukan nombor dalam mesej.',
    },
    {
      key: 'tell-family',
      badge: 'BERITAHU KELUARGA',
      en: 'TELL FAMILY',
      body: 'Beritahu ahli keluarga jika anda rasa ragu. Berbincang sebelum membuat keputusan.',
    },
  ],
  // Emergency / reporting guidance (R18.3, R29.1): reference official channels
  // GENERICALLY. Do NOT display any invented phone number here.
  emergencyHeading: 'Jika anda disasarkan penipuan',
  emergencyIntro:
    'Dapatkan nombor rasmi daripada sumber rasmi sahaja. Jangan guna nombor ' +
    'yang diberi di dalam mesej atau panggilan yang mencurigakan.',
  emergencySteps: [
    'Hubungi talian bantuan tindak balas penipuan kebangsaan rasmi.',
    'Hubungi bank anda melalui saluran rasmi mereka (nombor di belakang kad atau laman web rasmi).',
    'Buat laporan di balai polis berdekatan.',
    'Sahkan setiap nombor telefon terus daripada laman web rasmi agensi berkenaan.',
  ],
} as const;

/**
 * Printable Safety Card page.
 *
 * The outer app chrome (sidebar / bottom nav) is marked `.no-print` by the
 * layout so it is hidden when printing; the card itself is marked `.print-card`
 * and styled high-contrast and print-friendly by the `@media print` block in
 * src/index.css (R18.1). The print button and any other on-screen-only chrome
 * on this page are tagged `.no-print` so they never appear on paper.
 */
export function SafetyCardPage() {
  const handlePrint = () => {
    // Browser-native print dialog; produces the print-friendly layout (R18.1).
    window.print();
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* On-screen-only header + action. Hidden from print. */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-navy-mid">{COPY.subtitle}</p>
        <Button
          variant="primary"
          size="lg"
          onClick={handlePrint}
          leadingIcon={<Printer size={20} aria-hidden="true" />}
        >
          {COPY.printButton}
        </Button>
      </div>

      {/* The printable card itself. */}
      <article className="print-card card p-6 text-navy sm:p-8">
        <header className="mb-5 border-b border-navy-mid/20 pb-4">
          <h1 className="text-2xl font-bold">{COPY.title}</h1>
        </header>

        <section aria-labelledby="reminders-heading" className="mb-6">
          <h2 id="reminders-heading" className="mb-3 text-xl font-semibold">
            {COPY.remindersHeading}
          </h2>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COPY.reminders.map((r, index) => (
              <li
                key={r.key}
                className="rounded-card border border-navy-mid/20 p-3"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    aria-hidden="true"
                    className="font-bold text-accent"
                  >
                    {index + 1}.
                  </span>
                  <span className="font-bold uppercase tracking-wide">
                    {r.badge}
                  </span>
                  <span className="text-sm text-navy-mid">({r.en})</span>
                </div>
                <p className="mt-1 text-base">{r.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="emergency-heading">
          <h2 id="emergency-heading" className="mb-2 text-xl font-semibold">
            {COPY.emergencyHeading}
          </h2>
          <p className="mb-2 text-base">{COPY.emergencyIntro}</p>
          <ul className="list-disc space-y-1 pl-6 text-base">
            {COPY.emergencySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>

        <footer className="mt-6 border-t border-navy-mid/20 pt-4 text-sm text-navy-mid">
          {COPY.footerNote}
        </footer>
      </article>
    </main>
  );
}

export default SafetyCardPage;

