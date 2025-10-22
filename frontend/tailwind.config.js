/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e9cca',
          dark: '#4a4a66',
        },
        gray: {
          text: '#1f2937',
          muted: '#6b7280',
          light: '#f8fafc',
        },
        success: '#10b981',
        warning: '#f97316',
      },
      backgroundImage: {
        'header-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}


