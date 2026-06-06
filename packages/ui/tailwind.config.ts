import type { Config } from 'tailwindcss'

const config: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          dark: '#5B21B6',
          light: '#EDE9FE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F5F3FF',
          dark: '#1A1A1A',
          'dark-alt': '#242424',
          'dark-hover': '#2E2E2E',
        },
        warm: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E8E5E0',
          300: '#A8A29E',
          400: '#78716C',
          900: '#1C1917',
        },
        // Semantic — context-specific (see design.md badge rules)
        energy: '#F59E0B',
        financial: '#D97706',
        warning: '#F59E0B',
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'sans-serif'],
        display: ['Anybody Variable', 'Anybody', 'sans-serif'], // NEW: Bold headers
        label: ['Space Grotesk', 'Space Mono', 'sans-serif'],   // NEW: Labels
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
        xl: '0 16px 48px rgba(0,0,0,0.16)',
        // NEW: Glow effects
        glow: '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-lg': '0 0 40px rgba(124, 58, 237, 0.5)',
        'glow-fire': '0 0 30px rgba(255, 81, 106, 0.5)',
        'glow-fire-lg': '0 0 50px rgba(255, 81, 106, 0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'checkin-success': 'checkin 200ms ease-out forwards',
        // NEW: Glow animations
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'fire-glow-pulse': 'fireGlowPulse 2.5s ease-in-out infinite',
        'box-glow-pulse': 'boxGlowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 10px rgba(124, 58, 237, 0.3)' },
          '50%': { textShadow: '0 0 25px rgba(124, 58, 237, 0.6)' },
        },
        fireGlowPulse: {
          '0%, 100%': { textShadow: '0 0 15px rgba(255, 81, 106, 0.4)' },
          '50%': { textShadow: '0 0 35px rgba(255, 81, 106, 0.8)' },
        },
        boxGlowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
