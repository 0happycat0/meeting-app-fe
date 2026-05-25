import { API_ENDPOINTS } from "@/config/api-endpoints";
import apiClient from "@/lib/axios";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { User } from "@/types/entities/user";

export const fetchUsers = async (): Promise<ApiResponse<PageResponse<User>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<User>>>(
    API_ENDPOINTS.users,
  );
  return response.data;
};

export const createUser = async (user: User): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>(
    API_ENDPOINTS.users,
    user,
  );
  return response.data.result;
};

export const updateUser = async (user: User): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>(
    API_ENDPOINTS.userById(user.id),
    user,
  );
  return response.data.result;
};

// nếu thành công thì server trả về string "User has been deleted"
export const deleteUser = async (id: string): Promise<string> => {
  const response = await apiClient.delete<ApiResponse<string>>(
    API_ENDPOINTS.userById(id),
  );
  return response.data.result;
};