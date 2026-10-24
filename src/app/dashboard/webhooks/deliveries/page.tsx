'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function DeliveriesPage() {
  return <ConfigPage config={getPageConfig('dashboard/webhooks/deliveries')} />;
}
