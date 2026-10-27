'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function SmsGatewaysPage() {
  return <ConfigPage config={getPageConfig('admin/sms/gateways')} />;
}
