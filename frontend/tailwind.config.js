/** @type {import('tailwindcss').Config} */
module.exports = {
  // Activate dark mode via a class on <html> (controlled by next-themes)
  darkMode: 'class',

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // ── CSS variable-driven color tokens ───────────────────────────────────
      // All colors reference CSS custom properties defined in globals.css.
      // Changing a CSS variable automatically updates every component.
      colors: {
        // Primary brand color (theme-switchable)
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          900: 'hsl(var(--primary-900))',
        },

        // Semantic surface colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Sidebar
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },

        // ── Semantic status colors (NEVER change meaning with theme) ─────────
        // These are fixed — they do NOT inherit from the primary color variable.
        success: {
          DEFAULT: 'hsl(142 71% 45%)',
          foreground: 'hsl(0 0% 100%)',
          subtle: 'hsl(142 71% 95%)',
        },
        warning: {
          DEFAULT: 'hsl(38 92% 50%)',
          foreground: 'hsl(0 0% 10%)',
          subtle: 'hsl(38 92% 95%)',
        },
        danger: {
          DEFAULT: 'hsl(0 72% 51%)',
          foreground: 'hsl(0 0% 100%)',
          subtle: 'hsl(0 72% 95%)',
        },
        info: {
          DEFAULT: 'hsl(214 89% 52%)',
          foreground: 'hsl(0 0% 100%)',
          subtle: 'hsl(214 89% 95%)',
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Menlo', 'monospace'],
      },

      // ── Spacing ───────────────────────────────────────────────────────────
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        topbar: 'var(--topbar-height)',
      },

      // ── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      // ── Box shadow ────────────────────────────────────────────────────────
      boxShadow: {
        card: 'var(--shadow-card)',
        dropdown: 'var(--shadow-dropdown)',
        modal: 'var(--shadow-modal)',
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },

  plugins: [],
};
