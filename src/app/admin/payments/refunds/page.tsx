'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function RefundsPage() {
  return <ConfigPage config={getPageConfig('admin/payments/refunds')} />;
}
