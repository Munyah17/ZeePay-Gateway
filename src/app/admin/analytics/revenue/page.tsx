'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function RevenuePage() {
  return <ConfigPage config={getPageConfig('admin/analytics/revenue')} />;
}
