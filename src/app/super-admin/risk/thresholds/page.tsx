'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ThresholdsPage() {
  return <ConfigPage config={getPageConfig('super-admin/risk/thresholds')} />;
}
