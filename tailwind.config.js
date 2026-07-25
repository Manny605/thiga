/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Template minimaliste noir & blanc : toute la palette est monochrome.
        // Les noms (vert, ocre) sont conservés pour ne rien casser ailleurs ;
        // seules leurs valeurs deviennent des gris — l'accent, c'est le noir.
        sand: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
        },
        ink: {
          DEFAULT: '#18181B',
          800: '#27272A',
          600: '#52525B',
          400: '#A1A1AA',
        },
        // Vert de marque (#004B2B / #005332) — actions, liens, sections foncées.
        // Les nuances claires et les extrêmes foncés sont dérivés.
        vert: {
          50: '#E6EFE9',
          100: '#C2DBCC',
          200: '#8BBAA0',
          600: '#005332',
          700: '#004B2B',
          800: '#003A21',
          900: '#002A18',
        },
        // Or de marque (#A78B60 / #A18253) — badges, numéros, accents.
        ocre: {
          100: '#EFE8DB',
          300: '#A78B60',
          500: '#A18253',
          700: '#7C6340',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Poppins', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        ar: ['Tajawal', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },
      // Poppins léger sur tout le produit : chaque graisse est décalée d'un cran
      // vers le light, de sorte que même les `font-medium/semibold/bold`
      // existants restent légers, tout en gardant une hiérarchie relative.
      fontWeight: {
        thin: '200',
        extralight: '200',
        light: '300',
        normal: '300',
        medium: '400',
        semibold: '500',
        bold: '600',
        extrabold: '700',
        black: '800',
      },
      letterSpacing: {
        mark: '0.34em',
      },
      // Zéro ombre : le style éditorial repose sur des filets fins, pas d'élévation.
      boxShadow: {
        none: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        card: 'none',
        lift: 'none',
      },
      // Coins nets partout ; seul `full` reste rond (avatars, points, pastilles).
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        rise: 'rise .7s cubic-bezier(.2,.7,.3,1) both',
        fade: 'fade .9s ease both',
      },
    },
  },
  plugins: [],
}
