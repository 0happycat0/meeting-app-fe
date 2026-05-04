import { API_ENDPOINTS } from "@/config/api-endpoints";
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/entities/user";

export const fetchUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>(
    API_ENDPOINTS.users,
  );
  return response.data.result;
};
