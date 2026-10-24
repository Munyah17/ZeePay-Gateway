'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function CredentialsPage() {
  return <ConfigPage config={getPageConfig('super-admin/providers/credentials')} />;
}
