import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    keycloakify({
      accountThemeImplementation: "Single-Page",
      // Không cần file jar, chỉ cần file ftl để cập nhật theme ngay lập tức 
      // mà không cần re-run container
      keycloakVersionTargets: {
        "22-to-25": true,
        "all-other-versions": false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["unmoaned-dale-nonspherical.ngrok-free.dev"],
  },
});
