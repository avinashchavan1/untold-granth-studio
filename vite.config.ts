import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

// Channel branding for the app shell: page title, Google Fonts and app icon from channel.json
// (app_title, brand.app_theme.google_fonts, brand.app_theme.icon). Missing values keep the template defaults.
const CH = JSON.parse(readFileSync(resolve(__dirname, "channel.json"), "utf8"));
const T = CH.brand?.app_theme ?? {};
const ICON_SRC = T.icon && existsSync(resolve(__dirname, T.icon)) ? resolve(__dirname, T.icon) : null;
const ICON_URL = ICON_SRC ? `/app-icon${extname(ICON_SRC)}` : "/favicon.svg";
const ICON_TYPE = ({ ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" } as Record<string, string>)[extname(ICON_URL)] ?? "image/png";

function channelBrand(): Plugin {
  return {
    name: "channel-brand",
    config: () => ({ define: { __APP_ICON__: JSON.stringify(ICON_URL) } }),
    transformIndexHtml: (html) => {
      let out = html.replace(/<title>.*?<\/title>/, `<title>${CH.app_title ?? "Storyreel Studio"}</title>`)
        .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${ICON_URL}" type="${ICON_TYPE}" />\n    <link rel="apple-touch-icon" href="${ICON_URL}" />`);
      if (T.google_fonts) out = out.replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/, T.google_fonts);
      if (T.style) out = out.replace("<body class=\"", `<body class="theme-${T.style} `);   // e.g. "sticker": bold outlines + hard shadows (src/index.css)
      if (T.theme_color) out = out.replace("</head>", `  <meta name="theme-color" content="${T.theme_color}" />\n  </head>`);
      return out;
    },
    configureServer: (server) => {
      if (ICON_SRC) server.middlewares.use(ICON_URL, (_req, res) => { res.setHeader("Content-Type", ICON_TYPE); res.end(readFileSync(ICON_SRC)); });
    },
    generateBundle() {
      if (ICON_SRC) this.emitFile({ type: "asset", fileName: ICON_URL.slice(1), source: readFileSync(ICON_SRC) });
    },
  };
}

export default defineConfig({ plugins: [react(), channelBrand()] });
