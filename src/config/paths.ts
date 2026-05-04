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
      path: '/app/home'
    },
    meetings: {
      path: '/app/meetings'
    },
    meetingDetails: {
      path: (id: string) => `app/meetings/${id}`,
    }
  }
} as const;