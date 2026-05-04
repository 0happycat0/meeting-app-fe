import axios from "axios";
import keycloak from "../config/keycloak";
import { paths } from "@/config/paths";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để tự động gắn token vào mỗi request
apiClient.interceptors.request.use(
  async (config) => {
    // Nếu user đã đăng nhập qua Keycloak
    if (keycloak.authenticated) {
      try {
        // Cập nhật token nếu nó sẽ hết hạn trong vòng 30 giây tới
        await keycloak.updateToken(30);

        // Gắn token vào header Authorization
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error("Không thể làm mới token, yêu cầu đăng nhập lại", error);
        keycloak.login({
          redirectUri: window.location.origin + paths.app.root.path,
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
