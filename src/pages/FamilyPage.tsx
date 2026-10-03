// src/pages/FamilyPage.tsx
// Family Guardian: save trusted contacts locally (sd.family) and share a
// warning via WhatsApp or the Web Share API. Never auto-sends: the user
// always presses send in their own app.
import { useState, type FormEvent } from 'react';
import { MessageCircle, Share2, Trash2, UserPlus, HeartHandshake } from 'lucide-react';
import type { FamilyContact } from '../types';
import { useI18n } from '../context/I18nProvider';
import { Button, DemoBadge, Icon, PageHero } from '../components/common';
import { storageService } from '../services/storageService';

const FAMILY_KEY = 'sd.family';

/** Malaysian local numbers (01x...) become 601x... for wa.me. */
function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `6${digits}` : digits;
}

const inputCls =
  'min-h-btn w-full rounded-card border border-navy-mid/25 bg-white px-3 py-2 text-base text-navy outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function FamilyPage() {
  const { language } = useI18n();
  const L = (ms: string, en: string) => (language === 'en' ? en : ms);

  const [contacts, setContacts] = useState<FamilyContact[]>(() =>
    storageService.get<FamilyContact[]>(FAMILY_KEY, []),
  );
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    L(
      'Amaran: Saya terima mesej mencurigakan yang minta OTP / pindahan wang. Jangan kongsi OTP atau pindah wang kepada sesiapa. Sahkan dahulu melalui saluran rasmi. - dihantar melalui Semak Dulu',
      'Warning: I received a suspicious message asking for an OTP / money transfer. Never share an OTP or transfer money to anyone. Verify through official channels first. - sent via Semak Dulu',
    ),
  );

  const save = (next: FamilyContact[]) => {
    setContacts(next);
    storageService.set(FAMILY_KEY, next);
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship.trim()) return;
    save([
      ...contacts,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim() || undefined,
      },
    ]);
    setName('');
    setRelationship('');
    setPhone('');
  };

  const canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">
      <PageHero icon={HeartHandshake} tone="emerald" title={L('Penjaga Keluarga', 'Family Guardian')} subtitle={L(
          'Simpan orang yang anda percaya dan kongsi amaran dengan satu tekan. Kenalan disimpan di peranti ini sahaja.',
          'Save people you trust and share a warning in one tap. Contacts stay on this device only.',
        )} />

      {/* Add contact */}
      <form onSubmit={add} className="mt-4 space-y-3 card p-4">
        <h2 className="text-lg font-semibold text-navy">{L('Tambah kenalan', 'Add contact')}</h2>
        <label className="block text-sm text-navy-mid">
          {L('Nama', 'Name')} *
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block text-sm text-navy-mid">
          {L('Hubungan (cth. Anak, Ibu)', 'Relationship (e.g. Son, Mother)')} *
          <input className={inputCls} value={relationship} onChange={(e) => setRelationship(e.target.value)} required />
        </label>
        <label className="block text-sm text-navy-mid">
          {L('Nombor telefon (pilihan)', 'Phone number (optional)')}
          <input className={inputCls} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="012-3456789" />
        </label>
        <Button type="submit" size="lg" leadingIcon={<Icon icon={UserPlus} />}>
          {L('Tambah', 'Add')}
        </Button>
      </form>

      {/* Message */}
      <section className="mt-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-navy">{L('Mesej amaran', 'Warning message')}</h2>
          <DemoBadge srDescription={L('Contoh mesej', 'Sample message')} />
        </div>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full rounded-card border border-navy-mid/25 bg-white px-3 py-2 text-base text-navy outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        {canWebShare && (
          <Button
            variant="secondary"
            className="mt-2"
            leadingIcon={<Icon icon={Share2} />}
            onClick={() => navigator.share({ text: message }).catch(() => undefined)}
          >
            {L('Kongsi', 'Share')}
          </Button>
        )}
      </section>

      {/* Contacts */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-navy">{L('Kenalan saya', 'My contacts')}</h2>
        {contacts.length === 0 ? (
          <p className="mt-2 text-base text-navy-mid">{L('Belum ada kenalan.', 'No contacts yet.')}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 card p-3">
                <div>
                  <p className="font-medium text-navy">{c.name}</p>
                  <p className="text-sm text-navy-mid">
                    {c.relationship}
                    {c.phone ? ` - ${c.phone}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {c.phone ? (
                    <a
                      href={`https://wa.me/${toWaNumber(c.phone)}?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-tap items-center gap-2 rounded-card bg-risk-safe px-4 py-2 text-base font-medium text-white outline-none hover:bg-risk-safe/90 focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Icon icon={MessageCircle} /> WhatsApp
                    </a>
                  ) : null}
                  <Button
                    variant="ghost"
                    aria-label={`${L('Padam', 'Delete')} ${c.name}`}
                    onClick={() => save(contacts.filter((x) => x.id !== c.id))}
                  >
                    <Icon icon={Trash2} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default FamilyPage;


