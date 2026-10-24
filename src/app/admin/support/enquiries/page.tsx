'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function EnquiriesPage() {
  return <ConfigPage config={getPageConfig('admin/support/enquiries')} />;
}
