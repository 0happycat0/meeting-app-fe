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
      path: (joinCode: string) => `/app/preview/${joinCode}`,
      routePath: 'preview/:joinCode',
    },
    lobby: {
      path: (joinCode: string) => `/app/lobby/${joinCode}`,
      routePath: 'lobby/:joinCode',
    },
    join: {
      path: (code: string) => `/app/join/${code}`,
      routePath: 'join/:joinCode',
    },
    room: {
      path: (joinCode: string) => `/app/room/${joinCode}`,
      routePath: 'room/:joinCode',
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