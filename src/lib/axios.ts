import axios from "axios";
import keycloak from "../config/keycloak";
import { paths } from "@/config/paths";
import { getErrorMessage } from "@/config/error-messages";

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
          redirectUri: globalThis.location.origin + paths.auth.redirect.path,
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor để chuẩn hóa lỗi trả về và xử lý toàn cục
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const httpStatus = error.response?.status ?? 500;
    const data = error.response?.data;
    const code = typeof data?.code === "number" ? data.code : httpStatus;

    // Chuẩn hóa lỗi theo cấu trúc ApiError và dịch sang tiếng Việt nếu khớp mã lỗi
    const normalizedError = {
      httpStatus,
      code,
      message: getErrorMessage(code, data?.message || error.message),
    };

    // Xử lý tự động khi token hết hạn / chưa đăng nhập ở phía server
    if (httpStatus === 401) {
      console.warn("Chưa xác thực hoặc phiên đăng nhập hết hạn, yêu cầu đăng nhập lại...");
      keycloak.login({
        redirectUri: globalThis.location.origin + paths.auth.redirect.path,
      });
    }

    return Promise.reject(normalizedError);
  },
);

export default apiClient;

