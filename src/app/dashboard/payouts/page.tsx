'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function PayoutsPage() {
  return <ConfigPage config={getPageConfig('dashboard/payouts')} />;
}
