'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ProvidersPage() {
  return <ConfigPage config={getPageConfig('admin/analytics/providers')} />;
}
