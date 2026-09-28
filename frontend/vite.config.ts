import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `--mode artifact` inlines everything into one HTML file so the prototype can be shared as a single page.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: mode === "artifact" ? [react(), viteSingleFile()] : [react()],
  build: { outDir: mode === "artifact" ? "dist-artifact" : "dist" },
}));
