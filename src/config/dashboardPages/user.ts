import { PageConfig } from '@/components/ConfigPage';

export const userPageConfigs: Record<string, PageConfig> = {
  'user/history': {
    title: 'Transaction History',
    description: 'Your complete payment and transfer history',
    stats: [
      { label: 'This Month', value: '$342.50', tone: 'success' },
      { label: 'Transactions', value: 28 },
      { label: 'Pending', value: 2, tone: 'warning' },
      { label: 'Failed', value: 1, tone: 'danger' },
    ],
    table: {
      title: 'All Transactions',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'description', label: 'Description', sortable: false },
        { key: 'method', label: 'Method' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { date: '2024-01-18', description: 'Sent to T. Mukono', method: 'EcoCash', amount: '-$50.00', status: 'Completed' },
        { date: '2024-01-17', description: 'ZESA electricity bill', method: 'Bills', amount: '-$125.50', status: 'Completed' },
        { date: '2024-01-16', description: 'Econet airtime', method: 'Airtime', amount: '-$10.00', status: 'Completed' },
        { date: '2024-01-15', description: 'Received from Grace Store', method: 'Payment', amount: '+$45.00', status: 'Completed' },
        { date: '2024-01-14', description: 'NetOne airtime', method: 'Airtime', amount: '-$5.00', status: 'Pending' },
        { date: '2024-01-13', description: 'City of Harare water bill', method: 'Bills', amount: '-$32.00', status: 'Completed' },
        { date: '2024-01-12', description: 'Sent to R. Dube', method: 'OneMoney', amount: '-$80.00', status: 'Failed' },
        { date: '2024-01-11', description: 'DStv subscription', method: 'Bills', amount: '-$29.00', status: 'Completed' },
        { date: '2024-01-10', description: 'TelOne internet bill', method: 'Bills', amount: '-$55.00', status: 'Completed' },
        { date: '2024-01-09', description: 'Received from employer', method: 'Bank Transfer', amount: '+$400.00', status: 'Completed' },
      ],
      searchableFields: ['description', 'method'],
      filterKey: 'status',
      filterLabel: 'All statuses',
      actions: false,
    },
  },

  'user/settings': {
    title: 'Account Settings',
    description: 'Manage your profile, security, and preferences',
    panels: [
      {
        title: 'Profile',
        items: [
          { label: 'Full name', value: 'John Moyo' },
          { label: 'Email', value: 'john.moyo@example.co.zw' },
          { label: 'Phone', value: '+263 71 234 5678' },
          { label: 'Account type', value: 'Personal' },
        ],
      },
      {
        title: 'Security',
        items: [
          { label: 'Two-factor authentication', badge: 'Active' },
          { label: 'Biometric login', badge: 'Active' },
          { label: 'Last password change', value: '2023-11-20' },
          { label: 'Trusted devices', value: '2 devices' },
        ],
      },
      {
        title: 'Preferences',
        items: [
          { label: 'Default currency', value: 'USD' },
          { label: 'Language', value: 'English' },
          { label: 'Transaction SMS alerts', badge: 'Active' },
          { label: 'Monthly statements', badge: 'Active' },
        ],
      },
      {
        title: 'Limits',
        items: [
          { label: 'Daily send limit', value: '$1,000' },
          { label: 'Per-transaction limit', value: '$500' },
          { label: 'Verified account', badge: 'Active' },
        ],
      },
    ],
  },
};
