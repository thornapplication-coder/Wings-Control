/** @type {import('tailwindcss').Config} */
// Colours: Eurowings corporate palette (EW brand reference, 2026 templates).
// Status colours are classic red / amber / green per the EW status-report exception;
// they are deliberately NOT brand magenta so that "critical" never reads as "brand".
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#AF1E65', // Light Burgundy – primary
          dark: '#871C54',    // Dark Burgundy
          darker: '#701745',  // Darker Burgundy
          light: '#D41370',   // Lighter Burgundy
          tint: '#F7E8EF',    // 10 % tint of primary for selected states
        },
        sky: {
          DEFAULT: '#00A6CF', // Dark Skyblue
          light: '#6BCCE0',   // Light Skyblue
          lighter: '#E6F5F9', // Lighter Skyblue
        },
        ink: {
          DEFAULT: '#212529', // Darker Grey
          body: '#333333',
          muted: '#575757',
          soft: '#787878',
        },
        line: '#D7D7D7',
        surface: { DEFAULT: '#FFFFFF', subtle: '#F8F9FA', muted: '#F1F3F5' },
        status: {
          green: '#1E8E3E', greenBg: '#E7F4EA',
          amber: '#B26A00', amberDot: '#F2A900', amberBg: '#FDF3E1',
          red: '#C62828', redBg: '#FBEAEA',
          grey: '#BDBABA', greyBg: '#F1F3F5',
        },
      },
      fontFamily: {
        sans: ['Mulish', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(33,37,41,0.04), 0 1px 3px rgba(33,37,41,0.06)',
        pop: '0 8px 24px rgba(33,37,41,0.12)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
    },
  },
  plugins: [],
};
