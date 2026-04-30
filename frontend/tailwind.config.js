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
          primary: '#facc15',
          'primary-content': '#0a0a0a',
          secondary: '#f59e0b',
          'secondary-content': '#0a0a0a',
          accent: '#fde047',
          'accent-content': '#0a0a0a',
          neutral: '#171717',
          'neutral-content': '#fafafa',
          'base-100': '#0a0a0a',
          'base-200': '#171717',
          'base-300': '#262626',
          'base-content': '#fafafa',
          info: '#3abff8',
          'info-content': '#0a0a0a',
          success: '#10b981',
          'success-content': '#ffffff',
          warning: '#f59e0b',
          'warning-content': '#0a0a0a',
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
