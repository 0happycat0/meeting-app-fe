import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";
// import fs from "node:fs/promises";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    keycloakify({
      accountThemeImplementation: "none",
      // Không cần file jar, chỉ cần file ftl để cập nhật theme ngay lập tức
      // mà không cần re-run container
      keycloakVersionTargets: {
        "22-to-25": true,
        "all-other-versions": false,
      },
      // postBuild: async (buildContext) => {
      //   // chạy ngay trước khi đóng gói vào file jar
      //   // dist_keycloak/resources/theme
      //   const srcThemeDir = path.join(
      //     buildContext.keycloakifyBuildDirPath,
      //     "resources",
      //     "theme",
      //   );

      //   // ./dist_keycloak
      //   const destThemeDir = path.join(
      //     process.cwd(),
      //     "dist_keycloak",
      //     "theme",
      //   );

      //   try {
      //     await fs.mkdir(destThemeDir, { recursive: true });

      //     // Bước 3: Copy toàn bộ nội dung từ thư mục nguồn sang thư mục đích
      //     // Cấu trúc copy xong sẽ là: dist_keycloakify/keycloakify-starter/...
      //     await fs.cp(srcThemeDir, destThemeDir, {
      //       recursive: true,
      //       force: true, // overwrite file nếu trùng
      //     });

      //     console.log(`\nThư mục theme đã được xuất ra: ${destThemeDir}`);
      //   } catch (error) {
      //     console.error("\nLỗi khi copy thư mục theme:", error);
      //   } finally {
      //     console.log("???");
      //   }
      // },
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
