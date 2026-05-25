export const paths = {
  landing: {
    path: '/'
  },
  auth: {
    login: {
      path: '/login'
    },
    redirect: {
      path: '/redirect'
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
  },
  admin: {
    root: {
      path: '/admin'
    },
    users: {
      path: '/admin/users'
    },
    userDetails: {
      path: (id: string) => `/admin/users/${id}`,
    }
  }
} as const;