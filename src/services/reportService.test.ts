/**
 * Tests for reportService (Requirement 20).
 *
 * Covers:
 * - Property 17: Report contains every provided field
 *   (Validates: Requirements 20.1)
 *
 * fast-check is run with at least 100 iterations per property.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildReport } from './reportService';
import type { ReportInput } from '../types';

const NUM_RUNS = 100;

describe('Feature: semak-dulu, Property 17 — report contains every provided field', () => {
  // A generator over realistic ReportInput shapes, including empty fields and
  // arrays of indicators. Values are trimmed by the service, so we constrain
  // the generators to avoid leading/trailing whitespace confusing the
  // "contains" assertion for non-empty values.
  const nonBlank = fc
    .string({ minLength: 1, maxLength: 60 })
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const reportInput: fc.Arbitrary<ReportInput> = fc.record({
    scamType: fc.oneof(fc.constant(''), nonBlank),
    message: fc.oneof(fc.constant(''), nonBlank),
    sender: fc.oneof(fc.constant(''), nonBlank),
    date: fc.oneof(fc.constant(''), nonBlank),
    link: fc.oneof(fc.constant(''), nonBlank),
    indicators: fc.array(nonBlank, { maxLength: 8 }),
  });

  it('includes every non-empty field value and every detected indicator', () => {
    fc.assert(
      fc.property(reportInput, (input) => {
        const report = buildReport(input);

        for (const value of [
          input.scamType,
          input.message,
          input.sender,
          input.date,
          input.link,
        ]) {
          if (value.trim().length > 0) {
            expect(report.includes(value.trim())).toBe(true);
          }
        }

        for (const indicator of input.indicators) {
          expect(report.includes(indicator)).toBe(true);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('is always a non-empty string regardless of input', () => {
    fc.assert(
      fc.property(reportInput, (input) => {
        const report = buildReport(input);
        expect(typeof report).toBe('string');
        expect(report.length).toBeGreaterThan(0);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('reportService.buildReport — examples and edge cases', () => {
  it('contains every provided field for a fully populated report (R20.1)', () => {
    const input: ReportInput = {
      scamType: 'Bank impersonation',
      message: 'Your account is locked. Verify now at the link.',
      sender: '+60123456789',
      date: '2024-05-01',
      link: 'http://bank-verify.example',
      indicators: ['Urgency pressure', 'Suspicious link', 'Requests OTP'],
    };

    const report = buildReport(input);

    expect(report).toContain(input.scamType);
    expect(report).toContain(input.message);
    expect(report).toContain(input.sender);
    expect(report).toContain(input.date);
    expect(report).toContain(input.link);
    for (const indicator of input.indicators) {
      expect(report).toContain(indicator);
    }
  });

  it('renders a placeholder for empty fields and a no-indicators note', () => {
    const input: ReportInput = {
      scamType: '',
      message: '',
      sender: '',
      date: '',
      link: '',
      indicators: [],
    };

    const report = buildReport(input);

    // Still produces a readable, non-empty block.
    expect(report.length).toBeGreaterThan(0);
    expect(report).toContain('None detected');
    // Placeholder for blank fields.
    expect(report).toContain('-');
  });

  it('ignores blank/whitespace-only indicators', () => {
    const input: ReportInput = {
      scamType: 'Parcel scam',
      message: 'Pay a small fee to release your parcel.',
      sender: 'Courier',
      date: '',
      link: '',
      indicators: ['  ', 'Fake delivery fee', ''],
    };

    const report = buildReport(input);

    expect(report).toContain('Fake delivery fee');
    // Only the one real indicator line is present.
    expect(report.match(/^- /gm)?.length).toBe(1);
  });
});
