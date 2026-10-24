'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function MerchantsPage() {
  return <ConfigPage config={getPageConfig('super-admin/pricing/merchants')} />;
}
