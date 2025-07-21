export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  },
} as const;

// Type-safe environment variables
declare global {
  interface ImportMetaEnv {
    VITE_API_BASE_URL?: string;
  }
} 