export const paths = {
  landing: {
    path: '/'
  },
  auth: {
    login: {
      path: '/auth/login'
    }
  },
  app: {
    root: {
      path: '/app'
    },
    home: {
      path: ''
    },
    meetings: {
      path: '/meetings'
    },
    meeting: {
      path: (id: string) => `/meeting/${id}`,
    }
  }
} as const;