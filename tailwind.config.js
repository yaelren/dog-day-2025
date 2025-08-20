/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'pawse-brown': '#2B1F1C',
        'pawse-gold': '#FFD700',
        'pawse-purple': '#A855F7',
        'pawse-blue': '#3B82F6',
        'pawse-pink': '#EC4899',
      },
      width: {
        'display': '4640px'
      },
      height: {
        'display': '1760px',
        'strip': '587px' // 1760 / 3
      },
      animation: {
        'scroll-left': 'scrollLeft var(--scroll-speed) linear infinite',
        'scroll-right': 'scrollRight var(--scroll-speed) linear infinite',
      },
      keyframes: {
        scrollLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        scrollRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
}