/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./containers/**/*.{js,jsx,ts,tsx}",
    "./assets/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        // ==========================================
        // TEXT COLORS — Light Mode
        // ==========================================
        "text-primary-light": "#000000",

        // ==========================================
        // TEXT COLORS — Dark Mode
        // ==========================================
        "text-primary-dark": "#FFFFFF",
        "text-secondary-dark": "#50fa7b",
        "text-tertiary-dark": "#9ca3af",
        "text-quaternary-dark": "#50fa7b",
        "text-quinary-dark": "#d1d5db",
        "text-senary-dark": "#ef4444",
        "text-septenary-dark": "#B0B0B0",
        "text-octonary-dark": "#6b7280",

        // ==========================================
        // BACKGROUND COLORS — Light Mode
        // ==========================================
        "bg-primary-light": "#FFFFFF",

        // ==========================================
        // BACKGROUND COLORS — Dark Mode
        // ==========================================
        "bg-primary-dark": "#000000",
        "bg-secondary-dark": "#0a0a0a",
        "bg-tertiary-dark": "#141414",
        "bg-quaternary-dark": "#1a1a1a",
        "bg-quinary-dark": "#FFFFFF",
        "bg-senary-dark": "#50fa7b",
        "bg-septenary-dark": "#111111",
        "bg-octonary-dark": "#1f1f1f",
        "bg-nonary-dark": "#2a2a2a",
        "bg-denary-dark": "#b91c1c",

        // ==========================================
        // BORDER COLORS — Light Mode
        // ==========================================
        "border-primary-light": "#636363",

        // ==========================================
        // BORDER COLORS — Dark Mode
        // ==========================================
        "border-primary-dark": "#1f1f1f",
        "border-secondary-dark": "#2a2a2a",
        "border-tertiary-dark": "#333333",
      },
    },
  },
  plugins: [],
};

// =============================================================================
// THEME NAMING RULES & CONVENTIONS — READ BEFORE ADDING NEW COLORS
// =============================================================================
//
// 1. NAMING PATTERN:
//    {purpose}-{priority}-{mode}
//    Examples: "text-primary-dark", "bg-secondary-light", "border-tertiary-dark"
//
// 2. PURPOSE PREFIXES:
//    - text-*    → For text/font colors        → usage: text-text-primary-dark
//    - bg-*      → For background colors        → usage: bg-bg-primary-dark
//    - border-*  → For border colors            → usage: border-border-primary-dark
//
// 3. PRIORITY ORDER (use next available):
//    primary → secondary → tertiary → quaternary → quinary →
//    senary → septenary → octonary → nonary → denary
//
// 4. MODE SUFFIX:
//    - *-light   → Light mode color
//    - *-dark    → Dark mode color
//
// 5. RULES:
//    - ALWAYS add new colors inside the correct section (text/bg/border + light/dark)
//    - ALWAYS use the next available priority name in order
//    - NEVER use random names — stick to the naming convention above
//    - NEVER leave a value empty (use a valid hex like "#000000" or remove the entry)
//    - ALWAYS add both light AND dark variants when introducing a new purpose
//    - ALWAYS use lowercase hex values for consistency (e.g. #1f2937 not #1F2937)
//
// 6. ADDING A NEW CATEGORY (e.g. shadow, ring, accent):
//    - Add a new comment section block following the same format
//    - Use the same priority naming: {category}-primary-light, {category}-primary-dark, etc.
//
// 7. USAGE IN COMPONENTS:
//    <Text className="text-text-primary-dark" />
//    <View className="bg-bg-tertiary-dark border border-border-primary-dark" />
//
// =============================================================================
