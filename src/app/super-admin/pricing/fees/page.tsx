'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function FeesPage() {
  return <ConfigPage config={getPageConfig('super-admin/pricing/fees')} />;
}
