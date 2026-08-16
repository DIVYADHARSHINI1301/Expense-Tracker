/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
        '250': '250ms',
        '350': '350ms',
      },
      animation: {
        'slide-up': 'slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'popIn 0.38s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fadeIn 0.28s ease-out both',
        'scale-in': 'scaleIn 0.26s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
}
