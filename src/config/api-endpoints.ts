export const API_ENDPOINTS = {
  users: "/users",
  userById: (id: string) => `/users/${id}`,

  meeting: "/meetings",
  meetingById: (id: string) => `/meetings/${id}`,
} as const;