'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function DepartmentsPage() {
  return <ConfigPage config={getPageConfig('admin/organisation/departments')} />;
}
