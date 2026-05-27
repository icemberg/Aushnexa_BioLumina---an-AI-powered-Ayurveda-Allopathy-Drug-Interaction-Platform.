/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        "secondary-fixed": "#e9ddff",
        "surface": "#141317",
        "surface-container-highest": "#363438",
        "surface-container": "#211f24",
        "on-surface": "#e6e1e7",
        "surface-tint": "#cfbcff",
        "primary-fixed": "#e9ddff",
        "on-secondary-fixed": "#1f1635",
        "outline": "#948f9a",
        "inverse-on-surface": "#323034",
        "on-tertiary-fixed": "#241a00",
        "on-tertiary": "#3e2e00",
        "surface-container-high": "#2b292d",
        "surface-dim": "#141317",
        "on-primary-container": "#594983",
        "surface-variant": "#363438",
        "on-surface-variant": "#cac4d0",
        "tertiary-fixed": "#ffdf92",
        "tertiary-container": "#e6c264",
        "on-primary-fixed-variant": "#4d3d76",
        "error-red": "#ffb4ab",
        "secondary": "#cdc0e9",
        "on-error-container": "#ffdad6",
        "inverse-surface": "#e6e1e7",
        "on-secondary-container": "#bbafd7",
        "on-primary-fixed": "#210f48",
        "inverse-primary": "#655590",
        "tertiary": "#ffdf8f",
        "outline-variant": "#49454f",
        "surface-bright": "#3a383d",
        "primary-fixed-dim": "#cfbcff",
        "on-error": "#690005",
        "on-background": "#e6e1e7",
        "on-tertiary-container": "#664f00",
        "glow-teal": "rgba(14, 207, 184, 0.04)",
        "surface-container-low": "#1c1b1f",
        "error-container": "#93000a",
        "surface-lowest": "#0f0d13",
        "secondary-container": "#4b4163",
        "on-primary": "#36265e",
        "secondary-fixed-dim": "#cdc0e9",
        "surface-container-lowest": "#0f0e11",
        "on-tertiary-fixed-variant": "#594400",
        "background": "#141317",
        "tertiary-fixed-dim": "#e7c365",
        "on-secondary-fixed-variant": "#4b4163",
        "error": "#ffb4ab",
        "primary": "#e8ddff",
        "primary-container": "#cfbcff",
        "on-secondary": "#342b4c",
        // Organic Dark overrides/additions
        "organic-dark": "#050A0E",
        "organic-forest": "#0A1F16",
        "saffron": "#E8960C",
        "emerald-light": "#18C96A",
        "matrix-teal": "#0ECFB8",
        "matrix-emerald": "#10B981",
        "matrix-saffron": "#F59E0B",
        "matrix-bg": "#03070F"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-mobile": "16px",
        "unit": "4px",
        "gutter": "24px",
        "margin-desktop": "48px",
        "container-max": "1440px"
      },
      fontFamily: {
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "display-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "technical-sm": ["JetBrains Mono", "monospace"],
        "label-caps": ["JetBrains Mono", "monospace"],
        "body-lg": ["Plus Jakarta Sans", "sans-serif"]
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "display-lg": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "display-lg-mobile": ["40px", { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "technical-sm": ["14px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "500" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }]
      },
      backgroundImage: {
        'organic-gradient': 'radial-gradient(circle at 50% 0%, #0A1F16 0%, #050A0E 70%)',
        'glow-saffron': 'radial-gradient(circle, rgba(232,150,12,0.15) 0%, rgba(232,150,12,0) 70%)',
        'glow-emerald': 'radial-gradient(circle, rgba(24,201,106,0.15) 0%, rgba(24,201,106,0) 70%)',
        'drift': 'radial-gradient(circle at top left, rgba(207, 188, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at bottom right, rgba(14, 207, 184, 0.05) 0%, transparent 40%)'
      },
      animation: {
        'drift': 'drift 20s ease infinite',
      },
      keyframes: {
        drift: {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        }
      }
    },
  },
  plugins: [],
}
