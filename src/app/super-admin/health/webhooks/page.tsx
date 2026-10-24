'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function WebhooksPage() {
  return <ConfigPage config={getPageConfig('super-admin/health/webhooks')} />;
}
