'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function FailedPaymentsPage() {
  return <ConfigPage config={getPageConfig('admin/support/failed-payments')} />;
}
