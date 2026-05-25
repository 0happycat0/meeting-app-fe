export type ApiResponse<T> = {
  code: number,
  message?: string,
  result: T,
};

export type PageResponse<T> = {
  items: T[],
  total: number,
};