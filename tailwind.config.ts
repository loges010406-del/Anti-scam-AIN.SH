import type { Config } from 'tailwindcss';

/**
 * Tailwind theme tokens for Semak Dulu (ScamShield).
 *
 * Encodes the navy palette, risk colours, card radius, 18px base font,
 * UI typeface, and the accessibility sizing tokens (48px primary buttons,
 * 44px tap targets). See design.md "Tailwind theme tokens (Requirement 24)".
 *
 * _Requirements: 24.1, 24.2, 24.3, 24.4, 25.6_
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Navy theme palette (R24.1)
        navy: { DEFAULT: '#0A1F44', deep: '#06142E', mid: '#12306B' },
        accent: '#3B82F6', // primary action blue
        surface: '#EAF0FB', // light surface / cards on light bg
        // Risk level colours (icon + text + colour, never colour alone â€” R25.1)
        risk: {
          safe: '#16A34A',
          suspicious: '#F59E0B',
          scam: '#DC2626',
        },
      },
      borderRadius: { card: '16px' }, // R24 (16px card radius)
      fontSize: { base: '18px' }, // R24.3 (18px base font)
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'], // R24.4
      },
      minHeight: { btn: '48px' }, // R24.2 (48px primary buttons)
      minWidth: { tap: '44px' }, // R25.6 (44px tap targets)
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        blob: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '33%': { transform: 'translate(24px,-18px) scale(1.08)' }, '66%': { transform: 'translate(-18px,14px) scale(0.95)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        popIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fadeIn 220ms ease-out both',
        blob: 'blob 18s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'pop-in': 'popIn 260ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10,31,68,0.06), 0 8px 24px -8px rgba(10,31,68,0.12)',
        glow: '0 18px 40px -18px rgba(37,99,235,0.55), 0 4px 12px -4px rgba(10,31,68,0.25)',
        lift: '0 2px 4px rgba(10,31,68,0.04), 0 16px 32px -12px rgba(10,31,68,0.18)',
      },
    },
  },
  plugins: [],
};

export default config;


