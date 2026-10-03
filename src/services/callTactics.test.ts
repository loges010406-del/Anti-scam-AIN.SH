// Verdicts for the scripted demo calls must land where the demo expects.
import { describe, it, expect } from 'vitest';
import { callVerdict, matchTactics } from './callTactics';

const scamMs = 'Saya Inspektor Rahman dari Ibu Pejabat Polis Bukit Aman. Ini kes sulit. Tolong jangan beritahu sesiapa. Sila bacakan kod OTP. Waran tangkap akan dikeluarkan hari ini juga. Pindahkan semua baki ke akaun selamat kerajaan sekarang juga.';
const legitMs = 'Helo, selamat pagi. Saya Aina dari Klinik Kesihatan Taman Melati. Saya cuma nak ingatkan temujanji susulan anda pada hari Khamis, jam sepuluh pagi. Jangan lupa bawa buku rawatan anda ya. Kalau nak tukar tarikh, boleh datang ke kaunter klinik. Itu sahaja. Terima kasih, semoga sihat selalu.';
const legitEn = 'Hello, good morning. This is Aina from Taman Melati health clinic. I am just reminding you about your follow-up appointment on Thursday at ten in the morning. Please remember to bring your treatment book. If you need to change the date, you can visit the clinic counter. That is all. Thank you and take care.';
const scamEn = 'I am Inspector Rahman from the Bukit Aman police headquarters. This case is confidential. Please do not tell anyone. Read the OTP out to me. An arrest warrant will be issued today. Transfer your full balance to a government safe account right now.';

describe('callVerdict', () => {
  it('flags the scripted scam call as LIKELY SCAM in both languages', () => {
    expect(callVerdict(scamMs, 'ms').level).toBe('LIKELY SCAM');
    expect(callVerdict(scamEn, 'en').level).toBe('LIKELY SCAM');
    expect(matchTactics(scamMs).length).toBeGreaterThanOrEqual(5);
  });
  it('keeps the scripted clinic call SAFE in both languages', () => {
    expect(callVerdict(legitMs, 'ms').level).toBe('SAFE');
    expect(callVerdict(legitEn, 'en').level).toBe('SAFE');
  });
  it('returns SAFE with no tactics for an empty transcript', () => {
    expect(callVerdict('   ', 'ms')).toMatchObject({ level: 'SAFE', score: 0, tactics: [] });
  });
});
