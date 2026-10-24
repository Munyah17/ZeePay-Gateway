'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function QueuesPage() {
  return <ConfigPage config={getPageConfig('super-admin/audit/queues')} />;
}
