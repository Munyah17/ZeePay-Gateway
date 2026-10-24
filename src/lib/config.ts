export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'dev-encryption-key-change-in-production',
  },
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  },
  environment: process.env.NODE_ENV || 'development',
} as const;
