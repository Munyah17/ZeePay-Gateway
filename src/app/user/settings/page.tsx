'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function SettingsPage() {
  return <ConfigPage config={getPageConfig('user/settings')} />;
}
