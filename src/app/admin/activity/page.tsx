'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ActivityPage() {
  return <ConfigPage config={getPageConfig('admin/activity')} />;
}
