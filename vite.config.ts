import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// `vite build --mode single` inlines every asset into one HTML file (used for
// hosted previews). The default build keeps code-splitting for real deploys.
export default defineConfig(({ mode }) => {
  const isSingleFile = mode === "single";
  return {
    plugins: [react(), tailwindcss(), ...(isSingleFile ? [viteSingleFile()] : [])],
    resolve: { alias: { "@": "/src" } },
    build: {
      outDir: isSingleFile ? "dist-single" : "dist",
      target: "es2022",
      chunkSizeWarningLimit: 900,
    },
  };
});
