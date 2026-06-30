/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#DA1222',
        'brand-red-hover': '#B50E1A',
        'brand-red-light': '#FDE8EA',
        'brand-bg': '#F3F4F6',
        'brand-card': '#FFFFFF',
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
