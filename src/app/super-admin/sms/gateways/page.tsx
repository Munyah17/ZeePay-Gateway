'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function SuperAdminSmsGatewaysPage() {
  return <ConfigPage config={getPageConfig('super-admin/sms/gateways')} />;
}
