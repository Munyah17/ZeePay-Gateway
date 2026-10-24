'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ApplicationsPage() {
  return <ConfigPage config={getPageConfig('admin/merchants/applications')} />;
}
