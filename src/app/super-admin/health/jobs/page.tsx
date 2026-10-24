'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function JobsPage() {
  return <ConfigPage config={getPageConfig('super-admin/health/jobs')} />;
}
