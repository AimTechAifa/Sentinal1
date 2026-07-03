import fs from "fs";
import { palette } from "./lib/palette";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const scales = ["brand", "accent", "gray", "success", "error", "warning", "info"] as const;

let lightVars = "\n  /* Automatically generated semantic scales */\n";
let darkVars = "\n  /* Automatically generated inverted scales */\n";

for (const scale of scales) {
  const obj = palette[scale] as Record<string, string>;
  const keys = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b));
  
  for (const k of keys) {
    lightVars += `  --color-${scale}-${k}: ${hexToRgb(obj[k])};\n`;
  }
  
  const reversedKeys = [...keys].reverse();
  for (let i = 0; i < keys.length; i++) {
    const originalKey = keys[i];
    const reversedKey = reversedKeys[i];
    darkVars += `  --color-${scale}-${originalKey}: ${hexToRgb(obj[reversedKey])};\n`;
  }
}

const globalsPath = "./app/globals.css";
let globals = fs.readFileSync(globalsPath, "utf-8");

globals = globals.replace(/\s*\/\* Global dark mode typography overrides to fix caching issues \*\/[\s\S]*?\.theme-dark \.bg-white \{[\s\S]*?\}/g, "");

globals = globals.replace(/(:root,\s*\.theme-light\s*\{)([^}]*)(\})/, (match, p1, p2, p3) => {
  return p1 + p2 + lightVars + p3;
});

globals = globals.replace(/(\.theme-dark\s*\{)([^}]*)(\})/, (match, p1, p2, p3) => {
  return p1 + p2 + darkVars + p3;
});

fs.writeFileSync(globalsPath, globals);

const tailwindPath = "./tailwind.config.ts";
let tailwind = fs.readFileSync(tailwindPath, "utf-8");

const withVarsFn = `
function withVars(obj: any, prefix = ""): any {
  if (typeof obj === "string") return \`rgb(var(--color-\${prefix}) / <alpha-value>)\`;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, withVars(v, prefix ? \`\${prefix}-\${k}\` : k)])
  );
}

const semanticColors = withVars({
  brand: palette.brand,
  accent: palette.accent,
  gray: palette.gray,
  success: palette.success,
  error: palette.error,
  warning: palette.warning,
  info: palette.info,
});
`;

if (!tailwind.includes("function withVars")) {
  tailwind = tailwind.replace('const config: Config = {', withVarsFn + '\nconst config: Config = {');
}

tailwind = tailwind.replace(/colors:\s*\{[\s\S]*?\},/g, `colors: {
        ...semanticColors,
        ai: palette.ai,
        sidebar: palette.sidebar,
        primary: "rgb(var(--color-brand-500) / <alpha-value>)",
        surface: "var(--surface)",
        border: "var(--border)",
      },`);

fs.writeFileSync(tailwindPath, tailwind);
console.log("Successfully generated theme variables!");
