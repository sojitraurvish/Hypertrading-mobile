import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config";

const fullConfig = resolveConfig(tailwindConfig);

/**
 * useTailwindTheme — Access Tailwind theme values (colors, spacing, etc.)
 * directly in code for cases where className doesn't work (e.g. icon colors,
 * SVG fills, animated values, or any native prop that needs a raw color string).
 *
 * Usage:
 *   const theme = useTailwindTheme();
 *   <BackIcon color={isDarkMode ? theme.colors["text-primary-dark"] : theme.colors["text-primary-light"]} />
 *   <SomeChart strokeColor={theme.colors["bg-primary-dark"]} />
 */
export function useTailwindTheme() {
  return fullConfig.theme;
}

// Export type for when you need to type theme-dependent props
export type TailwindTheme = typeof fullConfig.theme;
