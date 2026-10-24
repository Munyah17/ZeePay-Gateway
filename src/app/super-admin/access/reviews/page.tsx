'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ReviewsPage() {
  return <ConfigPage config={getPageConfig('super-admin/access/reviews')} />;
}
