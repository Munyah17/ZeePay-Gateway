'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function EnvironmentPage() {
  return <ConfigPage config={getPageConfig('super-admin/settings/environment')} />;
}
