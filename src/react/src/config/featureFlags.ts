export const featureFlags = {
  devAuthHeaders: import.meta.env.VITE_AUTH_MODE === 'local',
  aiAssistant: import.meta.env.VITE_AI_FEATURES_ENABLED === 'true',
  studioPlugins: import.meta.env.VITE_STUDIO_PLUGINS_ENABLED === 'true',
} as const

