export const APP_ROUTES = {
  home: 'home',
  memberDetails: 'member-details',
  privacy: 'privacy',
} as const

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES]
