'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function HistoryPage() {
  return <ConfigPage config={getPageConfig('user/history')} />;
}
