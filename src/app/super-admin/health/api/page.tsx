'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ApiPage() {
  return <ConfigPage config={getPageConfig('super-admin/health/api')} />;
}
