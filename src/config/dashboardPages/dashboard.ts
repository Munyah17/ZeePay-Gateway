import { PageConfig } from '@/components/ConfigPage';

export const dashboardPageConfigs: Record<string, PageConfig> = {
  'dashboard/webhooks/deliveries': {
    title: 'Webhook Deliveries',
    description: 'Delivery history and retry status for your webhook endpoints',
    stats: [
      { label: 'Delivered (24h)', value: '99.1%', tone: 'success' },
      { label: 'Retrying', value: 3, tone: 'warning' },
      { label: 'Failed (24h)', value: 2, tone: 'danger' },
      { label: 'Avg. Response Time', value: '210ms' },
    ],
    table: {
      title: 'Recent Deliveries',
      columns: [
        { key: 'id', label: 'Delivery ID' },
        { key: 'event', label: 'Event' },
        { key: 'endpoint', label: 'Endpoint' },
        { key: 'attempts', label: 'Attempts' },
        { key: 'response', label: 'Response' },
        { key: 'time', label: 'Time' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { id: 'del_9f21', event: 'payment.succeeded', endpoint: '/hooks/zeepay', attempts: 1, response: '200 OK', time: '14:32', status: 'Completed' },
        { id: 'del_9f20', event: 'payment.succeeded', endpoint: '/hooks/zeepay', attempts: 1, response: '200 OK', time: '14:28', status: 'Completed' },
        { id: 'del_9f19', event: 'refund.succeeded', endpoint: '/hooks/zeepay', attempts: 2, response: '200 OK', time: '14:15', status: 'Completed' },
        { id: 'del_9f18', event: 'payment.failed', endpoint: '/hooks/zeepay', attempts: 3, response: 'HTTP 500', time: '13:58', status: 'Pending' },
        { id: 'del_9f17', event: 'payment.succeeded', endpoint: '/hooks/zeepay', attempts: 5, response: 'Timeout', time: '13:40', status: 'Failed' },
        { id: 'del_9f16', event: 'payout.paid', endpoint: '/hooks/zeepay', attempts: 1, response: '200 OK', time: '13:12', status: 'Completed' },
        { id: 'del_9f15', event: 'payment.succeeded', endpoint: '/hooks/zeepay', attempts: 1, response: '200 OK', time: '12:58', status: 'Completed' },
      ],
      searchableFields: ['id', 'event', 'endpoint'],
      filterKey: 'status',
      filterLabel: 'All statuses',
      actions: false,
    },
  },
};
