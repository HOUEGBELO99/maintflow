import type { Config } from 'tailwindcss';

/**
 * MaintFlow design tokens — extracted verbatim from the prototype palette
 * (mobile `C` object + back-office CSS variables). Keep these in sync with the
 * Flutter app_theme.dart mirror.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand greens (industrial maintenance signature)
        brand: {
          DEFAULT: '#00C24A',
          hover: '#00A93D',
          deep: '#0A3D1F',
          bright: '#00FF00',
          50: '#ECFDF1',
          100: '#D2FADD',
          200: '#A4F2BC',
        },
        // Foundations
        ink: '#0E1410',
        body: '#1A1F1B',
        mute: '#5C6A60',
        faint: '#8A968F',
        line: { DEFAULT: '#E4E9E4', soft: '#EEF2EE', strong: '#C9D2C9' },
        surface: { DEFAULT: '#FFFFFF', soft: '#F7F9F7', muted: '#F2F5F2' },
        // Status
        ok: '#00C24A',
        warning: '#F59E0B',
        critical: '#DC2626',
        info: '#2563EB',
        // Status soft bg/fg pairs (pills)
        okBg: '#ECFDF1',
        okFg: '#047B32',
        warnBg: '#FEF3C7',
        warnFg: '#B45309',
        critBg: '#FEE2E2',
        critFg: '#B91C1C',
        infoBg: '#DBEAFE',
        infoFg: '#1D4ED8',
        // Sidebar / nav (dark surface even in light theme)
        nav: {
          bg: '#0E1410',
          soft: '#161D17',
          border: '#1F2820',
          text: '#D5E0D7',
          muted: '#7E8C82',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        md: '10px',
        lg: '14px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
