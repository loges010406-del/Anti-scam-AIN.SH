// Regression tests for scam detection gaps reported from real messages.
import { describe, it, expect } from 'vitest';
import { analyze, analyzePhone, classifyPhone } from './fallbackAnalyzer';
import samples from '../data/scamSamples.json';

const AIDILADHA =
  '*Data Percuma 100GB Khas Aidiladha* Saya baru sahaja tebus 😳 cuba semak sama ada anda juga layak dapat. _Klik di sini_ 👇 https://Selamat-Aidiladha5.ju5j1.top/?tebus-data=6';

describe('free-data / prize link scams', () => {
  it('flags the Aidiladha free-data message as LIKELY SCAM', () => {
    const r = analyze(AIDILADHA, 'ms');
    expect(r.riskLevel).toBe('LIKELY SCAM');
    expect(r.redFlags.length).toBeGreaterThanOrEqual(3);
  });

  it('flags a bare throwaway-domain link as at least SUSPICIOUS', () => {
    expect(analyze('https://promo-raya.ju5j1.top/claim', 'en').riskLevel).not.toBe('SAFE');
  });

  it('flags a foreign number inside a message', () => {
    const r = analyze('Hubungi ejen kami di WhatsApp +62 812 3456 7890 untuk tebus hadiah anda', 'ms');
    expect(r.redFlags.some((f) => f.phrase.includes('+62'))).toBe(true);
    expect(r.riskLevel).toBe('LIKELY SCAM');
  });
});

describe('phone mode', () => {
  it.each(['012-345 6789', '+60 12-345 6789', '60123456789', '011-2345 6789', '03-2345 6789', '1300 88 1234'])(
    'treats Malaysian number %s as SAFE',
    (n) => {
      expect(classifyPhone(n).kind).not.toMatch(/foreign|invalid/);
      expect(analyzePhone(n, 'ms').riskLevel).toBe('SAFE');
    },
  );

  it.each(['+62 812 3456 7890', '+1 415 555 0100', '+234 803 123 4567', '0044 20 7946 0958', '+44 7700 900123'])(
    'treats foreign number %s as SUSPICIOUS',
    (n) => {
      expect(classifyPhone(n).kind).toBe('foreign');
      const r = analyzePhone(n, 'en');
      expect(r.riskLevel).toBe('SUSPICIOUS');
      expect(r.redFlags).toHaveLength(1);
    },
  );

  it.each(['12345', '0000', '999'])('treats malformed number %s as SUSPICIOUS', (n) => {
    expect(analyzePhone(n, 'ms').riskLevel).toBe('SUSPICIOUS');
  });

  it('names the country code for foreign numbers', () => {
    expect(classifyPhone('+234 803 123 4567').countryCode).toBe('234');
    expect(classifyPhone('+62 812 3456 7890').countryCode).toBe('62');
  });
});

describe('bundled samples', () => {
  it('keeps legit samples SAFE and scam samples non-SAFE', () => {
    for (const s of samples as { id: string; content: string; category: string }[]) {
      const level = analyze(s.content, 'ms').riskLevel;
      if (s.category === 'legit') expect(level, s.id).toBe('SAFE');
      else expect(level, s.id).not.toBe('SAFE');
    }
  });
});
