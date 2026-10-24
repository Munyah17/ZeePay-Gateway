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
  'dashboard/payouts': {
    title: 'Payouts & Disbursements',
    description: 'Send money out to customer wallets — bulk disbursements, POS change, and subscriber payouts',
    alert: {
      tone: 'info',
      message: 'Disbursements via EcoCash EPG — Enterprise Cash-In, Disburse Change and Merchant to Subscriber. Synchronous and PIN-free.',
    },
    stats: [
      { label: 'Payouts (30d)', value: '1,284' },
      { label: 'Disbursed (30d)', value: '$48,920.00', tone: 'success' },
      { label: 'In Progress', value: 3, tone: 'warning' },
      { label: 'Failed (30d)', value: 7, tone: 'danger' },
    ],
    table: {
      title: 'Recent Payouts',
      columns: [
        { key: 'ref', label: 'External Ref' },
        { key: 'service', label: 'Service' },
        { key: 'recipient', label: 'Recipient' },
        { key: 'amount', label: 'Amount' },
        { key: 'txnId', label: 'EcoCash Txn' },
        { key: 'time', label: 'Time' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { ref: 'pay_1786088141', service: 'Enterprise Cash-In', recipient: '263777000000', amount: '$1.00', txnId: 'CI260807.0934.T6335049', time: '14:48', status: 'Completed' },
        { ref: 'pay_1786097300', service: 'Disburse Change', recipient: '263777000000', amount: '$2.00', txnId: 'CI260807.1208.T6335239', time: '14:12', status: 'Completed' },
        { ref: 'pay_1786088200', service: 'Merchant → Subscriber', recipient: '263784123456', amount: '$170.00', txnId: 'CP260826.1752.T6347991', time: '13:52', status: 'Completed' },
        { ref: 'pay_1786075512', service: 'Enterprise Cash-In', recipient: '263771234567', amount: '$45.00', txnId: 'CI260807.0930.T6335022', time: '13:20', status: 'Completed' },
        { ref: 'pay_1786069920', service: 'Merchant → Subscriber', recipient: '263778900123', amount: '$22.50', txnId: 'CP260826.1748.T6347950', time: '12:45', status: 'Pending' },
        { ref: 'pay_1786064410', service: 'Disburse Change', recipient: '263779876543', amount: '$0.75', txnId: '—', time: '12:15', status: 'Failed' },
      ],
      searchableFields: ['ref', 'recipient', 'txnId'],
      filterKey: 'status',
      filterLabel: 'All statuses',
      actions: true,
    },
    panels: [
      {
        title: 'Disbursement Services',
        items: [
          { label: 'Enterprise Cash-In — bulk payouts (payroll, growers, grants)', value: 'ENTERPRISECASHINV2' },
          { label: 'Disburse Change — POS change into the wallet', value: 'CHANGEDISBURSEV2' },
          { label: 'Merchant to Subscriber — single payout', value: 'MERCHTOSUBV2' },
          { label: 'Lookup — reconcile by externalReference', value: 'EXTERNALTRANSACTIONLOOKUP' },
        ],
      },
      {
        title: 'Good to Know',
        items: [
          { label: 'Synchronous — result returns on the API call', badge: 'No callback needed' },
          { label: 'externalReference is idempotent — resends return the original', badge: 'Safe retries' },
          { label: 'No customer PIN required for disbursements', badge: 'API-only' },
          { label: 'Sandbox numbers must be whitelisted first', badge: 'IC50103' },
        ],
      },
    ],
  },
};
