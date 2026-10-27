'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function SuperAdminSmsGatewayPage() {
  return <ConfigPage config={getPageConfig('super-admin/sms')} />;
}
