import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "非公式神椿TCGデッキメーカー",
        short_name: "KCG Maker",
        lang: "ja",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#000000",
        description: "神椿TCGのデッキを構築・管理するための非公式ツールです。",
        icons: [
          {
            src: "favicon.png",
            sizes: "1024x1024",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{css,html,ico,js,png,svg,webmanifest,woff2,csv}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              url.pathname.startsWith("/cards/") &&
              url.pathname.endsWith(".webp"),
            handler: "CacheFirst",
            options: {
              cacheName: "cards-cache",
              expiration: {
                maxEntries: 1024,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              [
                "/sheet_three_rows.webp",
                "/sheet_two_rows.webp",
                "/sheet_no_grid.webp",
                "/placeholder.webp",
              ].includes(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "bg-cache",
              expiration: {
                maxEntries: 3,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    warmup: {
      clientFiles: ["./src/components/**/*.vue", "./src/utils/**/*.ts"],
    },
  },
});
