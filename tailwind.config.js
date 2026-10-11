/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sable chaud : fonds, filets, surfaces. Teinté vers l'ocre plutôt que
        // gris neutre, pour rester dans la lumière du désert.
        sand: {
          50: '#FBF8F3',
          100: '#F5EFE5',
          200: '#EAE2D4',
          300: '#DBCFBC',
          400: '#B3A690',
        },
        // Encre brun-noir. ink-400 reste lisible (≈ 5:1 sur blanc) : c'est la
        // couleur des textes secondaires, pas un gris décoratif.
        ink: {
          DEFAULT: '#1D1A15',
          800: '#2C2821',
          600: '#4F483D',
          400: '#776D5E',
        },
        // Vert de marque (#004B2B / #005332) — actions, liens, sections foncées.
        // Les nuances claires et les extrêmes foncés sont dérivés.
        vert: {
          50: '#E8F1EC',
          100: '#C8DDD0',
          200: '#8FBBA2',
          300: '#5C9A78',
          600: '#005332',
          700: '#004B2B',
          800: '#003A21',
          900: '#002A18',
        },
        // Or de marque (#A78B60 / #A18253) — badges, numéros, accents.
        ocre: {
          50: '#F8F3EA',
          100: '#F0E7D6',
          300: '#C9AE80',
          500: '#A18253',
          700: '#7C6340',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Poppins', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        ar: ['Tajawal', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },
      letterSpacing: {
        mark: '0.34em',
      },
      // Ombres douces et chaudes : les cartes se détachent du fond sable sans
      // effet de « flottement ». `lift` = survol, teinté du vert de marque.
      boxShadow: {
        sm: '0 1px 2px rgb(29 26 21 / 0.06)',
        card: '0 1px 2px rgb(29 26 21 / 0.04), 0 6px 20px -8px rgb(29 26 21 / 0.10)',
        lift: '0 2px 4px rgb(29 26 21 / 0.04), 0 22px 44px -16px rgb(0 75 43 / 0.22)',
        glow: '0 0 0 4px rgb(0 75 43 / 0.10)',
      },
      // Arrondis : valeurs Tailwind par défaut, sauf 2xl/3xl un peu plus ronds.
      borderRadius: {
        '2xl': '1.125rem',
        '3xl': '1.75rem',
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
