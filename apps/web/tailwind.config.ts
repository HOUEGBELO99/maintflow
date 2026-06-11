import type { Config } from 'tailwindcss';

/** MaintFlow design tokens — derived from the prototype palette. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16A34A', // MaintFlow green
          50: '#E8F5E9',
          500: '#16A34A',
          600: '#15803D',
        },
        ink: '#0E1410', // prototype dark background
        critical: '#DC2626',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
