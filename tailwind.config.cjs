module.exports = {
  content: [
    './index.html',
    './**/*.{js,ts,jsx,tsx,html}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light-bg': '#E0E5EC',
        'light-primary': '#5E7BBD',
        'dark-bg': '#2C303A',
        'dark-primary': '#7A9DDB',
      },
      boxShadow: {
        'neumorphism-light': '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
        'neumorphism-light-inset': 'inset 6px 6px 10px #a3b1c6, inset -6px -6px 10px #ffffff',
        'neumorphism-dark': '9px 9px 16px #22252e, -9px -9px 16px #363b46',
        'neumorphism-dark-inset': 'inset 6px 6px 10px #22252e, inset -6px -6px 10px #363b46',
      }
    }
  },
  plugins: [],
}
