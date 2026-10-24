'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ControlsPage() {
  return <ConfigPage config={getPageConfig('super-admin/merchants/controls')} />;
}
