/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      animation: {
        'pop-in': 'pop-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-up': 'fade-up 400ms ease-out both',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        district: {
          primary: '#a855f7',
          'primary-content': '#ffffff',
          secondary: '#ec4899',
          'secondary-content': '#ffffff',
          accent: '#22d3ee',
          'accent-content': '#0a0b14',
          neutral: '#1f2333',
          'neutral-content': '#f5f5f7',
          'base-100': '#0d1017',
          'base-200': '#181c2a',
          'base-300': '#252a3f',
          'base-content': '#f5f5f7',
          info: '#3abff8',
          'info-content': '#0a0b14',
          success: '#10b981',
          'success-content': '#ffffff',
          warning: '#f59e0b',
          'warning-content': '#0a0b14',
          error: '#ef4444',
          'error-content': '#ffffff',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.625rem',
          '--rounded-badge': '999px',
        },
      },
    ],
    logs: false,
  },
}
