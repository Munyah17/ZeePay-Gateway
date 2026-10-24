'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ErrorsPage() {
  return <ConfigPage config={getPageConfig('super-admin/health/errors')} />;
}
