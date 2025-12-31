/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#1C1C1E',
        'surface-elevated': '#2C2C2E',
        primary: '#FF3B30',
        secondary: '#FFD60A',
        accent: '#0A84FF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8E8E93',
        success: '#30D158',
        warning: '#FF9F0A',
        error: '#FF453A',
      },
    },
  },
  plugins: [],
};
