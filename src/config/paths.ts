export const paths = {
  landing: {
    path: '/',
    routePath: '/',
  },
  auth: {
    login: {
      path: '/login',
      routePath: 'login',
    },
    redirect: {
      path: '/redirect',
      routePath: 'redirect',
    }
  },
  app: {
    root: {
      path: '/app',
      routePath: '/app',
    },
    home: {
      path: '/app/home',
      routePath: 'home',
    },
    meetings: {
      path: '/app/meetings',
      routePath: 'meetings',
    },
    meetingDetails: {
      path: (id: string) => `/app/meetings/${id}`,
      routePath: 'meetings/:meetingId',
    },
    preview: {
      path: (id: string) => `/app/preview/${id}`,
      routePath: 'preview/:meetingId',
    },
    lobby: {
      path: (id: string) => `/app/lobby/${id}`,
      routePath: 'lobby/:meetingId',
    },
    join: {
      path: (code: string) => `/app/join/${code}`,
      routePath: 'join/:joinCode',
    },
    room: {
      path: (id: string) => `/app/room/${id}`,
      routePath: 'room/:meetingId',
    },
    invitations: {
      path: '/app/invitations',
      routePath: 'invitations',
    },
    minutes: {
      path: '/app/minutes',
      routePath: 'minutes',
    },
    minutesDetails: {
      path: (id: string) => `/app/minutes/${id}`,
      routePath: 'minutes/:meetingId',
    }
  },
  admin: {
    root: {
      path: '/admin',
      routePath: 'admin',
    },
    dashboard: {
      path: '/admin/dashboard',
      routePath: 'dashboard',
    },
    users: {
      path: '/admin/users',
      routePath: 'users',
    },
    userDetails: {
      path: (id: string) => `/admin/users/${id}`,
      routePath: 'users/:userId',
    }
  }
} as const;