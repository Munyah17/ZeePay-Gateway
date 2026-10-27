'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function SmsSettingsPage() {
  return <ConfigPage config={getPageConfig('admin/sms/settings')} />;
}
