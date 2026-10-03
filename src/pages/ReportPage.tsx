// src/pages/ReportPage.tsx
// Report Summary: fill in the details, get a copy-ready report via
// reportService.buildReport, then submit it manually to official channels.
// Nothing is ever auto-submitted.
import { useState } from 'react';
import { ClipboardCopy, Check, FileText } from 'lucide-react';
import type { ReportInput } from '../types';
import { useI18n } from '../context/I18nProvider';
import { Button, Icon, PageHero } from '../components/common';
import { buildReport } from '../services/reportService';

const inputCls =
  'mt-1 min-h-btn w-full rounded-card border border-navy-mid/25 bg-white px-3 py-2 text-base text-navy outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function ReportPage() {
  const { language } = useI18n();
  const L = (ms: string, en: string) => (language === 'en' ? en : ms);

  const [form, setForm] = useState({
    scamType: '',
    message: '',
    sender: '',
    date: new Date().toISOString().slice(0, 10),
    link: '',
    indicators: '',
  });
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setCopied(false);
  };

  const input: ReportInput = {
    ...form,
    indicators: form.indicators.split(',').map((s) => s.trim()).filter(Boolean),
  };
  const report = buildReport(input);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const fields: { k: keyof typeof form; label: string; type?: string; area?: boolean }[] = [
    { k: 'scamType', label: L('Jenis penipuan', 'Scam type') },
    { k: 'message', label: L('Mesej / apa yang berlaku', 'Message / what happened'), area: true },
    { k: 'sender', label: L('Pengirim (nombor / akaun)', 'Sender (number / account)') },
    { k: 'date', label: L('Tarikh', 'Date'), type: 'date' },
    { k: 'link', label: L('Pautan (jika ada)', 'Link (if any)') },
    { k: 'indicators', label: L('Tanda amaran (pisahkan dengan koma)', 'Warning signs (comma separated)') },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">
      <PageHero icon={FileText} tone="indigo" title={L('Ringkasan Laporan', 'Report Summary')} subtitle={L(
          'Isi butiran untuk menyediakan laporan yang sedia disalin. Anda hantar sendiri kepada pihak berkuasa rasmi atau bank anda. Jangan masukkan OTP atau kata laluan.',
          'Fill in the details to prepare a copy-ready report. You submit it yourself to the official authorities or your bank. Do not include OTPs or passwords.',
        )} />

      <form className="mt-4 space-y-3 card p-4" onSubmit={(e) => e.preventDefault()}>
        {fields.map((f) => (
          <label key={f.k} className="block text-sm text-navy-mid">
            {f.label}
            {f.area ? (
              <textarea rows={4} className={inputCls} value={form[f.k]} onChange={set(f.k)} />
            ) : (
              <input type={f.type ?? 'text'} className={inputCls} value={form[f.k]} onChange={set(f.k)} />
            )}
          </label>
        ))}
      </form>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-navy">{L('Pratonton', 'Preview')}</h2>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-2xl bg-white p-3 shadow-soft font-sans text-base text-navy">{report}</pre>
        <Button size="lg" className="mt-3" onClick={copy} leadingIcon={<Icon icon={copied ? Check : ClipboardCopy} />}>
          {copied ? L('Telah disalin', 'Copied') : L('Salin laporan', 'Copy report')}
        </Button>
        <p className="mt-3 text-sm text-navy-mid">
          {L(
            'Dapatkan saluran laporan rasmi daripada laman web rasmi agensi berkenaan atau bank anda.',
            'Get the official reporting channel from the relevant agency or your bank official website.',
          )}
        </p>
      </section>
    </main>
  );
}

export default ReportPage;


