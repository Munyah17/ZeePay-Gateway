import { PageConfig } from '@/components/ConfigPage';

export const superAdminPageConfigs: Record<string, PageConfig> = {
  'super-admin/health': {
    title: 'Platform Health',
    description: 'Overall platform availability and service status',
    stats: [
      { label: 'Uptime (30d)', value: '99.97%', tone: 'success' },
      { label: 'Active Services', value: '12/12' },
      { label: 'Open Incidents', value: 0, tone: 'success' },
      { label: 'Avg. API Latency', value: '86ms' },
    ],
    panels: [
      {
        title: 'Core Services',
        items: [
          { label: 'Payments API', badge: 'Active' },
          { label: 'Hosted Checkout', badge: 'Active' },
          { label: 'Webhook Delivery', badge: 'Active' },
          { label: 'Dashboard', badge: 'Active' },
        ],
      },
      {
        title: 'Infrastructure',
        items: [
          { label: 'Database (primary)', badge: 'Active' },
          { label: 'Database (replica)', badge: 'Active' },
          { label: 'Queue workers', badge: 'Active' },
          { label: 'CDN / Edge', badge: 'Active' },
        ],
      },
    ],
    table: {
      title: 'Recent Health Checks',
      columns: [
        { key: 'time', label: 'Time' },
        { key: 'service', label: 'Service' },
        { key: 'latency', label: 'Latency' },
        { key: 'result', label: 'Result', badge: true },
      ],
      rows: [
        { time: '14:32', service: 'Payments API', latency: '82ms', result: 'Completed' },
        { time: '14:32', service: 'Hosted Checkout', latency: '110ms', result: 'Completed' },
        { time: '14:32', service: 'Webhook Delivery', latency: '95ms', result: 'Completed' },
        { time: '14:31', service: 'Database (primary)', latency: '12ms', result: 'Completed' },
        { time: '14:31', service: 'Queue workers', latency: '—', result: 'Completed' },
      ],
      searchableFields: ['service'],
      actions: false,
    },
  },

  'super-admin/activity': {
    title: 'Global Activity',
    description: 'Cross-tenant activity stream across the entire platform',
    stats: [
      { label: 'Events (1h)', value: 5120 },
      { label: 'Active Merchants', value: 402 },
      { label: 'Active Staff', value: 11 },
      { label: 'Anomalies', value: 2, tone: 'warning' },
    ],
    table: {
      title: 'Activity Stream',
      columns: [
        { key: 'time', label: 'Time' },
        { key: 'scope', label: 'Scope' },
        { key: 'event', label: 'Event' },
        { key: 'detail', label: 'Detail', sortable: false },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { time: '14:32', scope: 'Merchant', event: 'payment.succeeded', detail: 'Grace Store — $45.00 EcoCash', status: 'Completed' },
        { time: '14:31', scope: 'Admin', event: 'settlement.approve', detail: 'Batch #412 approved by finance', status: 'Completed' },
        { time: '14:30', scope: 'System', event: 'provider.degraded', detail: 'Omari latency above threshold', status: 'Pending' },
        { time: '14:29', scope: 'Merchant', event: 'merchant.signup', detail: 'New application: Harare Events Co', status: 'Completed' },
        { time: '14:27', scope: 'Super Admin', event: 'flag.updated', detail: 'smart_routing rollout → 50%', status: 'Completed' },
        { time: '14:25', scope: 'System', event: 'webhook.exhausted', detail: 'Endpoint unreachable: kudatraders.co.zw', status: 'Failed' },
      ],
      searchableFields: ['scope', 'event', 'detail'],
      filterKey: 'scope',
      filterLabel: 'All scopes',
      actions: false,
    },
  },

  'super-admin/organisation/profile': {
    title: 'Company Profile',
    description: 'Organisation identity, registration, and contact details',
    panels: [
      {
        title: 'Legal Entity',
        items: [
          { label: 'Registered name', value: 'ZeePay (Pvt) Ltd' },
          { label: 'Registration number', value: 'ZW-2023-48210' },
          { label: 'Tax ID', value: '2001145577' },
          { label: 'Incorporated', value: '2023-01-04' },
        ],
      },
      {
        title: 'Contact',
        items: [
          { label: 'Headquarters', value: 'Borrowdale, Harare, Zimbabwe' },
          { label: 'Support email', value: 'support@zeepay.co.zw' },
          { label: 'Compliance email', value: 'compliance@zeepay.co.zw' },
          { label: 'Phone', value: '+263 242 000 000' },
        ],
      },
      {
        title: 'Regulatory',
        items: [
          { label: 'RBZ licence', value: 'PSP-0142' },
          { label: 'Licence status', badge: 'Active' },
          { label: 'Next renewal', value: '2025-03-31' },
        ],
      },
      {
        title: 'Branding',
        items: [
          { label: 'Primary domain', value: 'zeepay.co.zw' },
          { label: 'Dashboard domain', value: 'app.zeepay.co.zw' },
          { label: 'Docs domain', value: 'docs.zeepay.co.zw' },
        ],
      },
    ],
  },

  'super-admin/organisation/departments': {
    title: 'Departments',
    description: 'Company departments and headcount allocation',
    table: {
      title: 'Departments',
      columns: [
        { key: 'name', label: 'Department' },
        { key: 'lead', label: 'Lead' },
        { key: 'headcount', label: 'Headcount' },
        { key: 'teams', label: 'Teams' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { name: 'Engineering', lead: 'Farai Ncube', headcount: 8, teams: 'Platform, Integrations', status: 'Active' },
        { name: 'Operations', lead: 'Nyasha Karemba', headcount: 4, teams: 'Payments Ops', status: 'Active' },
        { name: 'Risk & Compliance', lead: 'Tatenda Mukono', headcount: 3, teams: 'KYC, Monitoring', status: 'Active' },
        { name: 'Support', lead: 'Rutendo Dube', headcount: 6, teams: 'Merchant Support', status: 'Active' },
        { name: 'Finance', lead: 'Chipo Moyo', headcount: 3, teams: 'Treasury, Reporting', status: 'Active' },
      ],
      searchableFields: ['name', 'lead'],
    },
  },

  'super-admin/organisation/staff': {
    title: 'Staff Directory',
    description: 'All staff accounts with platform access levels',
    stats: [
      { label: 'Staff', value: 24 },
      { label: 'Super Admins', value: 2, tone: 'primary' },
      { label: 'Admins', value: 18 },
      { label: 'Pending Invites', value: 4, tone: 'warning' },
    ],
    table: {
      title: 'Staff',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'level', label: 'Access Level' },
        { key: 'department', label: 'Department' },
        { key: 'lastActive', label: 'Last Active' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { name: 'Munyaradzi Sithole', email: 'm.sithole@zeepay.co.zw', level: 'Super Admin', department: 'Executive', lastActive: 'Now', status: 'Active' },
        { name: 'Tadiwa Gumbo', email: 't.gumbo@zeepay.co.zw', level: 'Super Admin', department: 'Engineering', lastActive: '20 min ago', status: 'Active' },
        { name: 'Nyasha Karemba', email: 'n.karemba@zeepay.co.zw', level: 'Admin', department: 'Operations', lastActive: '2 h ago', status: 'Active' },
        { name: 'Tatenda Mukono', email: 't.mukono@zeepay.co.zw', level: 'Admin', department: 'Risk & Compliance', lastActive: '5 min ago', status: 'Active' },
        { name: 'Chipo Moyo', email: 'c.moyo@zeepay.co.zw', level: 'Admin', department: 'Finance', lastActive: 'Yesterday', status: 'Active' },
        { name: 'Farai Ncube', email: 'f.ncube@zeepay.co.zw', level: 'Admin', department: 'Engineering', lastActive: '3 d ago', status: 'Inactive' },
      ],
      searchableFields: ['name', 'email', 'department'],
      filterKey: 'level',
      filterLabel: 'All levels',
    },
  },

  'super-admin/organisation/teams': {
    title: 'Teams',
    description: 'Cross-functional teams and their memberships',
    table: {
      title: 'Teams',
      columns: [
        { key: 'team', label: 'Team' },
        { key: 'lead', label: 'Lead' },
        { key: 'members', label: 'Members' },
        { key: 'focus', label: 'Focus', sortable: false },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { team: 'Platform', lead: 'Farai Ncube', members: 5, focus: 'Core payments engine & API', status: 'Active' },
        { team: 'Integrations', lead: 'Tadiwa Gumbo', members: 3, focus: 'Provider adapters & SDKs', status: 'Active' },
        { team: 'Payments Ops', lead: 'Nyasha Karemba', members: 4, focus: 'Settlement runs & provider ops', status: 'Active' },
        { team: 'KYC', lead: 'Tatenda Mukono', members: 2, focus: 'Merchant verification', status: 'Active' },
        { team: 'Merchant Support', lead: 'Rutendo Dube', members: 6, focus: 'Tickets & onboarding help', status: 'Active' },
      ],
      searchableFields: ['team', 'lead', 'focus'],
    },
  },

  'super-admin/access/permissions': {
    title: 'Permissions',
    description: 'All permission scopes available for role assignment',
    stats: [
      { label: 'Total Scopes', value: 34 },
      { label: 'Write Scopes', value: 15 },
      { label: 'Read Scopes', value: 19 },
      { label: 'Sensitive', value: 6, tone: 'warning' },
    ],
    table: {
      title: 'Permission Scopes',
      columns: [
        { key: 'scope', label: 'Scope' },
        { key: 'type', label: 'Type' },
        { key: 'domain', label: 'Domain' },
        { key: 'description', label: 'Description', sortable: false },
        { key: 'sensitive', label: 'Sensitive', badge: true },
      ],
      rows: [
        { scope: 'payments.read', type: 'Read', domain: 'Payments', description: 'View payments and attempts', sensitive: 'Inactive' },
        { scope: 'payments.refund', type: 'Write', domain: 'Payments', description: 'Issue and approve refunds', sensitive: 'Active' },
        { scope: 'merchants.suspend', type: 'Write', domain: 'Merchants', description: 'Suspend or restrict merchants', sensitive: 'Active' },
        { scope: 'settlements.approve', type: 'Write', domain: 'Finance', description: 'Approve settlement batches', sensitive: 'Active' },
        { scope: 'providers.config', type: 'Write', domain: 'Network', description: 'Modify provider credentials/config', sensitive: 'Active' },
        { scope: 'audit.read', type: 'Read', domain: 'Audit', description: 'View audit logs', sensitive: 'Inactive' },
        { scope: 'flags.manage', type: 'Write', domain: 'Platform', description: 'Toggle feature flags', sensitive: 'Active' },
      ],
      searchableFields: ['scope', 'domain', 'description'],
      filterKey: 'type',
      filterLabel: 'All types',
    },
  },

  'super-admin/access/templates': {
    title: 'Permission Templates',
    description: 'Reusable permission bundles for fast role creation',
    table: {
      title: 'Templates',
      columns: [
        { key: 'template', label: 'Template' },
        { key: 'scopes', label: 'Scopes' },
        { key: 'usedBy', label: 'Used By' },
        { key: 'updated', label: 'Updated' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { template: 'Support Agent Base', scopes: '8 read + 2 write', usedBy: '2 roles', updated: '2024-01-10', status: 'Active' },
        { template: 'Finance Operator', scopes: '6 read + 3 write', usedBy: '1 role', updated: '2024-01-08', status: 'Active' },
        { template: 'Compliance Reviewer', scopes: '10 read + 2 write', usedBy: '1 role', updated: '2023-12-20', status: 'Active' },
        { template: 'Auditor Read-Only', scopes: '19 read', usedBy: '1 role', updated: '2023-12-01', status: 'Active' },
      ],
      searchableFields: ['template'],
    },
  },

  'super-admin/access/reviews': {
    title: 'Access Reviews',
    description: 'Periodic reviews of staff access rights',
    stats: [
      { label: 'Due This Quarter', value: 8, tone: 'warning' },
      { label: 'Completed (Q1)', value: 12, tone: 'success' },
      { label: 'Overdue', value: 1, tone: 'danger' },
      { label: 'Access Revoked (Q1)', value: 2 },
    ],
    table: {
      title: 'Reviews',
      columns: [
        { key: 'review', label: 'Review' },
        { key: 'scope', label: 'Scope' },
        { key: 'reviewer', label: 'Reviewer' },
        { key: 'due', label: 'Due' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { review: 'Q1 Admin Access', scope: 'All admin accounts (18)', reviewer: 'M. Sithole', due: '2024-03-31', status: 'Pending' },
        { review: 'Sensitive Scopes Audit', scope: '6 sensitive scopes', reviewer: 'T. Gumbo', due: '2024-02-15', status: 'Under Review' },
        { review: 'Service Accounts', scope: '4 service accounts', reviewer: 'M. Sithole', due: '2024-01-31', status: 'Under Review' },
        { review: 'Q4 2023 Admin Access', scope: 'All admin accounts (16)', reviewer: 'M. Sithole', due: '2023-12-31', status: 'Completed' },
      ],
      searchableFields: ['review', 'reviewer'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/merchants/controls': {
    title: 'Merchant Account Controls',
    description: 'Global controls applied to merchant accounts',
    stats: [
      { label: 'Active Merchants', value: 521 },
      { label: 'Restricted', value: 12, tone: 'warning' },
      { label: 'Suspended', value: 5, tone: 'danger' },
      { label: 'Watchlisted', value: 8 },
    ],
    table: {
      title: 'Control Actions Log',
      columns: [
        { key: 'merchant', label: 'Merchant' },
        { key: 'control', label: 'Control' },
        { key: 'appliedBy', label: 'Applied By' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { merchant: 'Kuda Traders', control: 'Payout hold', appliedBy: 'Risk team', date: '2024-01-18', status: 'Active' },
        { merchant: 'Mutare Gems Export', control: 'Enhanced monitoring', appliedBy: 'Compliance', date: '2024-01-17', status: 'Active' },
        { merchant: 'Kariba Boat Hire', control: 'Volume cap $10k/day', appliedBy: 'Risk team', date: '2024-01-16', status: 'Active' },
        { merchant: 'Old Mill Trading', control: 'Suspension', appliedBy: 'Compliance', date: '2024-01-10', status: 'Active' },
        { merchant: 'Grace Store', control: 'Volume cap (expired)', appliedBy: 'Risk team', date: '2023-11-02', status: 'Inactive' },
      ],
      searchableFields: ['merchant', 'control'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/merchants/onboarding': {
    title: 'Onboarding Policies',
    description: 'Rules governing merchant application and activation',
    panels: [
      {
        title: 'Application Requirements',
        items: [
          { label: 'Business registration doc', badge: 'Active' },
          { label: 'Director ID required', badge: 'Active' },
          { label: 'Bank account proof', badge: 'Active' },
          { label: 'Physical address verification', badge: 'Active' },
        ],
      },
      {
        title: 'Auto-Approval Rules',
        items: [
          { label: 'Low-risk categories', value: 'Auto-approve eligible' },
          { label: 'Risk score threshold', value: '< 30' },
          { label: 'Sandbox-first onboarding', badge: 'Active' },
        ],
      },
      {
        title: 'Restricted Categories',
        items: [
          { label: 'Forex / crypto trading', badge: 'Restricted' },
          { label: 'Gambling', badge: 'Restricted' },
          { label: 'Unlicensed lending', badge: 'Suspended' },
        ],
      },
      {
        title: 'SLA Targets',
        items: [
          { label: 'First review', value: '< 24h' },
          { label: 'Full decision', value: '< 3 business days' },
          { label: 'Current compliance', value: '94%' },
        ],
      },
    ],
  },

  'super-admin/merchants/limits': {
    title: 'Limits & Restrictions',
    description: 'Global transaction and volume limits by merchant tier',
    table: {
      title: 'Limit Rules',
      columns: [
        { key: 'rule', label: 'Rule' },
        { key: 'appliesTo', label: 'Applies To' },
        { key: 'limit', label: 'Limit' },
        { key: 'updated', label: 'Updated' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { rule: 'Single transaction max', appliesTo: 'Starter tier', limit: '$500', updated: '2024-01-01', status: 'Active' },
        { rule: 'Daily volume cap', appliesTo: 'Starter tier', limit: '$2,000', updated: '2024-01-01', status: 'Active' },
        { rule: 'Single transaction max', appliesTo: 'Growth tier', limit: '$5,000', updated: '2024-01-01', status: 'Active' },
        { rule: 'New merchant hold', appliesTo: 'All new merchants', limit: 'First payout held 7 days', updated: '2023-12-15', status: 'Active' },
        { rule: 'High-risk multiplier', appliesTo: 'Watchlisted', limit: '50% of tier limits', updated: '2023-12-01', status: 'Active' },
      ],
      searchableFields: ['rule', 'appliesTo'],
    },
  },

  'super-admin/merchants/restrictions': {
    title: 'Account Restrictions',
    description: 'Merchants under active account restrictions',
    stats: [
      { label: 'Restricted', value: 12, tone: 'warning' },
      { label: 'Suspended', value: 5, tone: 'danger' },
      { label: 'Under Appeal', value: 2 },
      { label: 'Lifted (30d)', value: 4, tone: 'success' },
    ],
    table: {
      title: 'Restricted Accounts',
      columns: [
        { key: 'merchant', label: 'Merchant' },
        { key: 'restriction', label: 'Restriction' },
        { key: 'reason', label: 'Reason' },
        { key: 'since', label: 'Since' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { merchant: 'Kuda Traders', restriction: 'Payouts held', reason: 'Refund ratio above 20%', since: '2024-01-18', status: 'Active' },
        { merchant: 'Mutare Gems Export', restriction: 'EDD required', reason: 'High-risk category', since: '2024-01-17', status: 'Active' },
        { merchant: 'Kariba Boat Hire', restriction: 'Volume cap', reason: 'Velocity spike', since: '2024-01-16', status: 'Active' },
        { merchant: 'Old Mill Trading', restriction: 'Suspended', reason: 'KYC documents expired', since: '2024-01-10', status: 'Active' },
        { merchant: 'ZimBargains Online', restriction: 'Suspended', reason: 'Chargeback threshold breach', since: '2023-12-28', status: 'Active' },
      ],
      searchableFields: ['merchant', 'restriction', 'reason'],
    },
  },

  'super-admin/providers/activation': {
    title: 'Provider Activation',
    description: 'Enable or disable payment providers platform-wide',
    table: {
      title: 'Providers',
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'type', label: 'Type' },
        { key: 'countries', label: 'Countries' },
        { key: 'liveSince', label: 'Live Since' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { provider: 'EcoCash', type: 'Mobile Money', countries: 'ZW', liveSince: '2023-01-15', status: 'Active' },
        { provider: 'InnBucks', type: 'Mobile Money', countries: 'ZW', liveSince: '2023-03-20', status: 'Active' },
        { provider: 'Omari', type: 'Mobile Money', countries: 'ZW', liveSince: '2023-06-10', status: 'Degraded' },
        { provider: 'OneMoney', type: 'Mobile Money', countries: 'ZW', liveSince: '2023-11-01', status: 'Sandbox' },
        { provider: 'ZIPIT Network', type: 'Bank Transfer', countries: 'ZW', liveSince: '2023-02-28', status: 'Active' },
        { provider: 'Stripe', type: 'Card Processing', countries: 'Global', liveSince: '2024-01-10', status: 'Sandbox' },
        { provider: 'MTN MoMo', type: 'Mobile Money', countries: 'ZM', liveSince: '—', status: 'Planned' },
      ],
      searchableFields: ['provider', 'type'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/providers/countries': {
    title: 'Country Availability',
    description: 'Provider coverage and availability per country',
    table: {
      title: 'Provider × Country Matrix',
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'zw', label: 'Zimbabwe' },
        { key: 'za', label: 'South Africa' },
        { key: 'zm', label: 'Zambia' },
        { key: 'bw', label: 'Botswana' },
      ],
      rows: [
        { provider: 'EcoCash', zw: 'Active', za: '—', zm: '—', bw: '—' },
        { provider: 'InnBucks', zw: 'Active', za: '—', zm: '—', bw: '—' },
        { provider: 'Omari', zw: 'Degraded', za: '—', zm: '—', bw: '—' },
        { provider: 'ZIPIT Network', zw: 'Active', za: '—', zm: '—', bw: '—' },
        { provider: 'Stripe', zw: 'Active', za: 'Active', zm: 'Active', bw: 'Active' },
        { provider: 'MTN MoMo', zw: '—', za: '—', zm: 'Planned', bw: '—' },
      ],
      searchableFields: ['provider'],
      actions: false,
    },
  },

  'super-admin/providers/credentials': {
    title: 'Credentials Status',
    description: 'Health and rotation status of provider API credentials',
    table: {
      title: 'Credential Health',
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'env', label: 'Environment' },
        { key: 'lastRotated', label: 'Last Rotated' },
        { key: 'expires', label: 'Expires' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { provider: 'EcoCash', env: 'Production', lastRotated: '2024-01-02', expires: '2024-04-02', status: 'Active' },
        { provider: 'InnBucks', env: 'Production', lastRotated: '2023-12-15', expires: '2024-03-15', status: 'Active' },
        { provider: 'Omari', env: 'Production', lastRotated: '2023-11-20', expires: '2024-02-20', status: 'Pending' },
        { provider: 'ZIPIT Network', env: 'Production', lastRotated: '2024-01-08', expires: '2024-07-08', status: 'Active' },
        { provider: 'Stripe', env: 'Sandbox', lastRotated: '2024-01-10', expires: 'Never', status: 'Active' },
      ],
      searchableFields: ['provider', 'env'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/providers/approvals': {
    title: 'Integration Approvals',
    description: 'Provider integrations pending approval to go live',
    stats: [
      { label: 'Pending Approval', value: 2, tone: 'warning' },
      { label: 'Approved (Q1)', value: 3, tone: 'success' },
      { label: 'In Certification', value: 1 },
      { label: 'Rejected', value: 0 },
    ],
    table: {
      title: 'Approval Pipeline',
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'stage', label: 'Stage' },
        { key: 'testsPassed', label: 'Tests Passed' },
        { key: 'requested', label: 'Requested' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { provider: 'OneMoney', stage: 'Production approval', testsPassed: '48/50', requested: '2024-01-15', status: 'Under Review' },
        { provider: 'MTN MoMo (Zambia)', stage: 'Certification', testsPassed: '31/50', requested: '2024-01-10', status: 'Under Review' },
        { provider: 'Stripe', stage: 'Production approval', testsPassed: '50/50', requested: '2024-01-08', status: 'Pending' },
        { provider: 'Visa Direct', stage: 'Sandbox', testsPassed: '42/50', requested: '2024-01-05', status: 'Under Review' },
      ],
      searchableFields: ['provider', 'stage'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/payments/currencies': {
    title: 'Supported Currencies',
    description: 'Currencies enabled for payment collection and payout',
    table: {
      title: 'Currencies',
      columns: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Currency' },
        { key: 'countries', label: 'Countries' },
        { key: 'collection', label: 'Collection' },
        { key: 'payout', label: 'Payout' },
      ],
      rows: [
        { code: 'USD', name: 'US Dollar', countries: 'ZW, ZA, ZM, BW', collection: 'Active', payout: 'Active' },
        { code: 'ZWG', name: 'Zimbabwe Gold', countries: 'ZW', collection: 'Active', payout: 'Active' },
        { code: 'ZAR', name: 'South African Rand', countries: 'ZA', collection: 'Active', payout: 'Active' },
        { code: 'ZMW', name: 'Zambian Kwacha', countries: 'ZM', collection: 'Active', payout: 'Pending' },
        { code: 'BWP', name: 'Botswana Pula', countries: 'BW', collection: 'Active', payout: 'Pending' },
        { code: 'EUR', name: 'Euro', countries: 'International', collection: 'Pending', payout: 'Inactive' },
      ],
      searchableFields: ['code', 'name'],
      actions: false,
    },
  },

  'super-admin/payments/methods': {
    title: 'Payment Methods',
    description: 'Global enablement of payment method categories',
    table: {
      title: 'Method Configuration',
      columns: [
        { key: 'method', label: 'Method' },
        { key: 'category', label: 'Category' },
        { key: 'providers', label: 'Providers' },
        { key: 'currencies', label: 'Currencies' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { method: 'EcoCash', category: 'Mobile Money', providers: 'EcoCash', currencies: 'USD, ZWG', status: 'Active' },
        { method: 'InnBucks', category: 'Mobile Money', providers: 'InnBucks', currencies: 'USD', status: 'Active' },
        { method: 'Omari', category: 'Mobile Money', providers: 'Omari', currencies: 'USD, ZWG', status: 'Active' },
        { method: 'OneMoney', category: 'Mobile Money', providers: 'OneMoney', currencies: 'USD, ZWG', status: 'Sandbox' },
        { method: 'Visa', category: 'Card', providers: 'Stripe', currencies: 'USD, ZAR, ZMW, BWP', status: 'Sandbox' },
        { method: 'Mastercard', category: 'Card', providers: 'Stripe', currencies: 'USD, ZAR, ZMW, BWP', status: 'Sandbox' },
        { method: 'Bank Transfer', category: 'Bank', providers: 'ZIPIT', currencies: 'USD, ZWG', status: 'Active' },
      ],
      searchableFields: ['method', 'category', 'providers'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/payments/countries': {
    title: 'Country Rules',
    description: 'Per-country payment rules and regulatory constraints',
    table: {
      title: 'Country Rules',
      columns: [
        { key: 'country', label: 'Country' },
        { key: 'maxTxn', label: 'Max Transaction' },
        { key: 'kyc', label: 'KYC Level' },
        { key: 'notes', label: 'Notes', sortable: false },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { country: 'Zimbabwe', maxTxn: '$10,000', kyc: 'Full KYB', notes: 'RBZ reporting above $5,000/day', status: 'Active' },
        { country: 'South Africa', maxTxn: 'R50,000', kyc: 'FICA', notes: 'SARB exchange controls apply', status: 'Active' },
        { country: 'Zambia', maxTxn: 'K25,000', kyc: 'Standard', notes: 'BoZ reporting requirements', status: 'Active' },
        { country: 'Botswana', maxTxn: 'P30,000', kyc: 'Standard', notes: 'Limited payout rails', status: 'Active' },
      ],
      searchableFields: ['country'],
    },
  },

  'super-admin/payments/routing': {
    title: 'Routing Policies',
    description: 'Global payment routing logic and failover rules',
    panels: [
      {
        title: 'Routing Strategy',
        items: [
          { label: 'Smart routing', badge: 'Pending' },
          { label: 'Primary strategy', value: 'Cost-optimised' },
          { label: 'Fallback enabled', badge: 'Active' },
          { label: 'Max failover hops', value: '2' },
        ],
      },
      {
        title: 'Failover Rules',
        items: [
          { label: 'Trigger', value: 'Provider timeout or 5xx' },
          { label: 'Retry window', value: '60 seconds' },
          { label: 'Circuit breaker', value: '50% errors over 5 min' },
        ],
      },
    ],
    table: {
      title: 'Routing Rules',
      columns: [
        { key: 'rule', label: 'Rule' },
        { key: 'condition', label: 'Condition', sortable: false },
        { key: 'route', label: 'Route To' },
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { rule: 'EcoCash primary', condition: 'currency=USD & method=ecocash', route: 'EcoCash direct', priority: 1, status: 'Active' },
        { rule: 'Cards via Stripe', condition: 'method=card', route: 'Stripe', priority: 1, status: 'Active' },
        { rule: 'MoMo fallback', condition: 'ecocash unavailable', route: 'OneMoney', priority: 2, status: 'Pending' },
        { rule: 'High-value bank', condition: 'amount > $500 & method=bank', route: 'ZIPIT', priority: 1, status: 'Active' },
      ],
      searchableFields: ['rule', 'condition', 'route'],
    },
  },

  'super-admin/pricing/fees': {
    title: 'Fee Plans',
    description: 'Platform-wide fee plan definitions',
    table: {
      title: 'Fee Plans',
      columns: [
        { key: 'plan', label: 'Plan' },
        { key: 'rate', label: 'Rate' },
        { key: 'flat', label: 'Flat Fee' },
        { key: 'merchants', label: 'Merchants' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { plan: 'Standard', rate: '1.5% mobile / 2.0% card', flat: '$0.10 / $0.30', merchants: 489, status: 'Active' },
        { plan: 'Volume Discount 100k', rate: '1.2% mobile / 1.8% card', flat: '$0.10 / $0.25', merchants: 41, status: 'Active' },
        { plan: 'Volume Discount 500k', rate: '1.0% mobile / 1.5% card', flat: '$0.08 / $0.20', merchants: 12, status: 'Active' },
        { plan: 'Enterprise Custom', rate: 'Negotiated', flat: 'Negotiated', merchants: 8, status: 'Active' },
        { plan: 'Nonprofit', rate: '0.8% all methods', flat: '$0.05', merchants: 6, status: 'Pending' },
      ],
      searchableFields: ['plan'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/pricing/merchants': {
    title: 'Merchant Pricing',
    description: 'Custom and overridden pricing for individual merchants',
    stats: [
      { label: 'Custom Priced', value: 12 },
      { label: 'Discounted', value: 53 },
      { label: 'On Standard', value: 482 },
      { label: 'Pending Review', value: 3, tone: 'warning' },
    ],
    table: {
      title: 'Custom Pricing',
      columns: [
        { key: 'merchant', label: 'Merchant' },
        { key: 'plan', label: 'Plan' },
        { key: 'rate', label: 'Effective Rate' },
        { key: 'approvedBy', label: 'Approved By' },
        { key: 'since', label: 'Since' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { merchant: 'Grace Store', plan: 'Volume Discount 500k', rate: '1.0% / 1.5%', approvedBy: 'C. Moyo', since: '2024-01-01', status: 'Active' },
        { merchant: 'Bulawayo Electronics', plan: 'Volume Discount 500k', rate: '1.0% / 1.5%', approvedBy: 'C. Moyo', since: '2024-01-01', status: 'Active' },
        { merchant: 'Chitungwiza Mart', plan: 'Volume Discount 100k', rate: '1.2% / 1.8%', approvedBy: 'C. Moyo', since: '2023-12-15', status: 'Active' },
        { merchant: 'Nyanga Tours', plan: 'Enterprise Custom', rate: '0.9% flat', approvedBy: 'M. Sithole', since: '2024-01-10', status: 'Active' },
        { merchant: 'Harare Events Co', plan: 'Custom (proposed)', rate: '1.3% / 1.9%', approvedBy: '—', since: '—', status: 'Pending' },
      ],
      searchableFields: ['merchant', 'plan'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/pricing/providers': {
    title: 'Provider Costs',
    description: 'Interchange and provider cost basis for margin analysis',
    table: {
      title: 'Cost Basis',
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'cost', label: 'Provider Cost' },
        { key: 'ourFee', label: 'Our Fee' },
        { key: 'margin', label: 'Margin' },
        { key: 'updated', label: 'Updated' },
      ],
      rows: [
        { provider: 'EcoCash', cost: '1.0% + $0.05', ourFee: '1.5% + $0.10', margin: '0.5% + $0.05', updated: '2024-01-01' },
        { provider: 'InnBucks', cost: '0.95% + $0.04', ourFee: '1.5% + $0.10', margin: '0.55% + $0.06', updated: '2024-01-01' },
        { provider: 'Omari', cost: '1.1% + $0.05', ourFee: '1.5% + $0.10', margin: '0.4% + $0.05', updated: '2024-01-01' },
        { provider: 'ZIPIT', cost: '0.5% + $0.02', ourFee: '0.8% + $0.05', margin: '0.3% + $0.03', updated: '2024-01-01' },
        { provider: 'Stripe (cards)', cost: '1.4% + $0.20', ourFee: '2.0% + $0.30', margin: '0.6% + $0.10', updated: '2024-01-01' },
      ],
      searchableFields: ['provider'],
      actions: false,
    },
  },

  'super-admin/pricing/history': {
    title: 'Pricing History',
    description: 'Historical changes to fee plans and merchant pricing',
    table: {
      title: 'Change Log',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'change', label: 'Change' },
        { key: 'scope', label: 'Scope' },
        { key: 'changedBy', label: 'Changed By' },
        { key: 'approved', label: 'Approved', badge: true },
      ],
      rows: [
        { date: '2024-01-10', change: 'Nyanga Tours → 0.9% flat', scope: 'Merchant pricing', changedBy: 'C. Moyo', approved: 'Active' },
        { date: '2024-01-01', change: 'New fee schedule effective', scope: 'All plans', changedBy: 'M. Sithole', approved: 'Active' },
        { date: '2023-12-15', change: 'Volume 100k tier created', scope: 'Fee plans', changedBy: 'C. Moyo', approved: 'Active' },
        { date: '2023-11-01', change: 'EcoCash rate 1.7% → 1.5%', scope: 'Standard plan', changedBy: 'M. Sithole', approved: 'Active' },
        { date: '2023-10-15', change: 'ZIPIT flat fee $0.08 → $0.05', scope: 'Standard plan', changedBy: 'C. Moyo', approved: 'Active' },
      ],
      searchableFields: ['change', 'scope', 'changedBy'],
      actions: false,
    },
  },

  'super-admin/finance/settlements': {
    title: 'Settlement Approvals',
    description: 'Approve or hold settlement batches before payout',
    alert: { tone: 'warning', message: '2 settlement batches over $50,000 are awaiting dual approval.' },
    stats: [
      { label: 'Awaiting Approval', value: 4, tone: 'warning' },
      { label: 'Approved Today', value: 3, tone: 'success' },
      { label: 'Value Pending', value: '$96,400' },
      { label: 'On Hold', value: 1, tone: 'danger' },
    ],
    table: {
      title: 'Settlement Queue',
      columns: [
        { key: 'batch', label: 'Batch' },
        { key: 'merchants', label: 'Merchants' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'approvals', label: 'Approvals' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { batch: 'Batch #415', merchants: 62, amount: '$58,200', currency: 'USD', approvals: '1/2', status: 'Pending' },
        { batch: 'Batch #414', merchants: 48, amount: '$38,200', currency: 'USD', approvals: '0/2', status: 'Pending' },
        { batch: 'Batch #413', merchants: 12, amount: 'ZWG 142,000', currency: 'ZWG', approvals: '1/2', status: 'Pending' },
        { batch: 'Batch #412', merchants: 55, amount: '$44,800', currency: 'USD', approvals: '2/2', status: 'Completed' },
        { batch: 'Batch #411', merchants: 3, amount: '$8,900', currency: 'USD', approvals: '—', status: 'Failed' },
      ],
      searchableFields: ['batch', 'currency'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/finance/adjustments': {
    title: 'Financial Adjustments',
    description: 'Manual credits, debits, and corrections to merchant balances',
    stats: [
      { label: 'Adjustments (30d)', value: 9 },
      { label: 'Credits', value: '$1,240', tone: 'success' },
      { label: 'Debits', value: '$380', tone: 'danger' },
      { label: 'Pending Approval', value: 2, tone: 'warning' },
    ],
    table: {
      title: 'Adjustments',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'merchant', label: 'Merchant' },
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { id: 'ADJ-118', merchant: 'Grace Store', type: 'Credit', amount: '$45.00', reason: 'Duplicate fee correction', status: 'Pending' },
        { id: 'ADJ-117', merchant: 'Market Square', type: 'Debit', amount: '$120.00', reason: 'Chargeback loss', status: 'Pending' },
        { id: 'ADJ-116', merchant: 'Kuda Traders', type: 'Credit', amount: '$310.00', reason: 'Settlement error fix', status: 'Completed' },
        { id: 'ADJ-115', merchant: 'Nyanga Tours', type: 'Credit', amount: '$75.00', reason: 'Goodwill credit', status: 'Completed' },
        { id: 'ADJ-114', merchant: 'Old Mill Trading', type: 'Debit', amount: '$260.00', reason: 'Negative balance recovery', status: 'Completed' },
      ],
      searchableFields: ['id', 'merchant', 'reason'],
      filterKey: 'type',
      filterLabel: 'All types',
    },
  },

  'super-admin/finance/limits': {
    title: 'Approval Limits',
    description: 'Financial approval thresholds requiring multi-signoff',
    table: {
      title: 'Approval Thresholds',
      columns: [
        { key: 'action', label: 'Action' },
        { key: 'threshold', label: 'Threshold' },
        { key: 'approvers', label: 'Approvers Required' },
        { key: 'roles', label: 'Eligible Roles' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { action: 'Settlement batch', threshold: '> $10,000', approvers: 2, roles: 'Finance Manager + Super Admin', status: 'Active' },
        { action: 'Settlement batch', threshold: '> $50,000', approvers: 2, roles: 'Super Admin ×2', status: 'Active' },
        { action: 'Manual adjustment', threshold: '> $500', approvers: 2, roles: 'Finance Manager + Super Admin', status: 'Active' },
        { action: 'Refund override', threshold: '> $1,000', approvers: 2, roles: 'Support Lead + Finance', status: 'Active' },
        { action: 'Fee waiver', threshold: 'Any', approvers: 1, roles: 'Super Admin', status: 'Active' },
      ],
      searchableFields: ['action', 'roles'],
    },
  },

  'super-admin/finance/reconciliation': {
    title: 'Reconciliation Oversight',
    description: 'Platform-level view of reconciliation across providers',
    stats: [
      { label: 'Reconciled (30d)', value: '99.2%', tone: 'success' },
      { label: 'Exceptions Open', value: 6, tone: 'warning' },
      { label: 'Oldest Exception', value: '3 days' },
      { label: 'Auto-match Rate', value: '97.8%' },
    ],
    table: {
      title: 'Exceptions',
      columns: [
        { key: 'id', label: 'Exception' },
        { key: 'provider', label: 'Provider' },
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount' },
        { key: 'age', label: 'Age' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { id: 'EXC-044', provider: 'Omari', type: 'Amount mismatch', amount: '$12.40', age: '3 days', status: 'Pending' },
        { id: 'EXC-043', provider: 'ZIPIT', type: 'Missing credit', amount: '$210.00', age: '2 days', status: 'Under Review' },
        { id: 'EXC-042', provider: 'EcoCash', type: 'Duplicate debit', amount: '$45.00', age: '1 day', status: 'Pending' },
        { id: 'EXC-041', provider: 'InnBucks', type: 'Fee discrepancy', amount: '$8.20', age: '1 day', status: 'Under Review' },
        { id: 'EXC-040', provider: 'Stripe', type: 'FX variance', amount: '$31.50', age: '5 hours', status: 'Pending' },
      ],
      searchableFields: ['id', 'provider', 'type'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/risk/rules': {
    title: 'Risk Rules',
    description: 'Global risk engine rules and their enforcement actions',
    stats: [
      { label: 'Active Rules', value: 18 },
      { label: 'Blocking Rules', value: 6 },
      { label: 'Review Rules', value: 9 },
      { label: 'Monitor-only', value: 3 },
    ],
    table: {
      title: 'Rules',
      columns: [
        { key: 'rule', label: 'Rule' },
        { key: 'condition', label: 'Condition', sortable: false },
        { key: 'action', label: 'Action' },
        { key: 'hits7d', label: 'Hits (7d)' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { rule: 'Velocity spike', condition: 'Daily volume > 10× trailing avg', action: 'Review', hits7d: 17, status: 'Active' },
        { rule: 'High-value new device', condition: 'Amount > $2,000 & unknown device', action: 'Block', hits7d: 4, status: 'Active' },
        { rule: 'Refund ratio', condition: 'Refunds > 15% of volume (7d)', action: 'Review', hits7d: 28, status: 'Active' },
        { rule: 'Geo mismatch', condition: 'IP country ≠ card country', action: 'Monitor', hits7d: 12, status: 'Active' },
        { rule: 'Sanctions name match', condition: 'OFAC/UN list fuzzy match', action: 'Block', hits7d: 1, status: 'Active' },
        { rule: 'Amount above p95', condition: 'Txn > merchant 95th percentile', action: 'Review', hits7d: 41, status: 'Active' },
      ],
      searchableFields: ['rule', 'condition'],
      filterKey: 'action',
      filterLabel: 'All actions',
    },
  },

  'super-admin/risk/thresholds': {
    title: 'Review Thresholds',
    description: 'Numeric thresholds controlling automatic risk actions',
    table: {
      title: 'Thresholds',
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'review', label: 'Review At' },
        { key: 'block', label: 'Block At' },
        { key: 'window', label: 'Window' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { metric: 'Transaction amount', review: '$2,000', block: '$10,000', window: 'Per txn', status: 'Active' },
        { metric: 'Daily volume', review: '$10,000', block: '$50,000', window: '24h', status: 'Active' },
        { metric: 'Failed attempts', review: '3', block: '8', window: '1h', status: 'Active' },
        { metric: 'Refund ratio', review: '10%', block: '25%', window: '7d', status: 'Active' },
        { metric: 'Chargeback ratio', review: '0.5%', block: '1.0%', window: '30d', status: 'Active' },
      ],
      searchableFields: ['metric'],
      actions: false,
    },
  },

  'super-admin/risk/escalation': {
    title: 'Escalation Policies',
    description: 'How risk events escalate across severity levels',
    table: {
      title: 'Escalation Paths',
      columns: [
        { key: 'severity', label: 'Severity' },
        { key: 'notify', label: 'Notify' },
        { key: 'escalate', label: 'Escalate After' },
        { key: 'escalateTo', label: 'Escalate To' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { severity: 'Low', notify: 'Risk team (digest)', escalate: '72h', escalateTo: 'Risk Analyst', status: 'Active' },
        { severity: 'Medium', notify: 'Risk team (immediate)', escalate: '24h', escalateTo: 'Compliance Officer', status: 'Active' },
        { severity: 'High', notify: 'Compliance + Super Admin', escalate: '4h', escalateTo: 'Super Admin', status: 'Active' },
        { severity: 'Critical', notify: 'All Super Admins + on-call', escalate: '1h', escalateTo: 'Executive', status: 'Active' },
      ],
      searchableFields: ['severity', 'notify'],
      actions: false,
    },
  },

  'super-admin/risk/restrictions': {
    title: 'Restricted Activities',
    description: 'Prohibited and restricted business activities policy',
    table: {
      title: 'Restricted Categories',
      columns: [
        { key: 'category', label: 'Category' },
        { key: 'level', label: 'Restriction Level' },
        { key: 'examples', label: 'Examples', sortable: false },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { category: 'Illegal goods/services', level: 'Prohibited', examples: 'Drugs, weapons, counterfeit goods', status: 'Active' },
        { category: 'Gambling', level: 'Prohibited', examples: 'Unlicensed betting, lotteries', status: 'Active' },
        { category: 'Crypto/forex trading', level: 'Restricted', examples: 'Requires RBZ licence + EDD', status: 'Active' },
        { category: 'Money services', level: 'Restricted', examples: 'Remittances require additional licence', status: 'Active' },
        { category: 'Adult content', level: 'Restricted', examples: 'Case-by-case review', status: 'Active' },
        { category: 'Pharmaceuticals', level: 'Restricted', examples: 'Requires pharmacy licence', status: 'Active' },
      ],
      searchableFields: ['category', 'examples'],
      filterKey: 'level',
      filterLabel: 'All levels',
      actions: false,
    },
  },

  'super-admin/security/logins': {
    title: 'Login History',
    description: 'Staff and admin authentication history',
    stats: [
      { label: 'Logins (24h)', value: 34 },
      { label: 'Failed Attempts', value: 3, tone: 'warning' },
      { label: 'New Devices', value: 1 },
      { label: 'Locked Accounts', value: 0 },
    ],
    table: {
      title: 'Recent Logins',
      columns: [
        { key: 'time', label: 'Time' },
        { key: 'user', label: 'User' },
        { key: 'method', label: 'Method' },
        { key: 'ip', label: 'IP Address' },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { time: '2024-01-18 14:10', user: 'm.sithole@zeepay.co.zw', method: 'Password + MFA', ip: '41.220.x.x', location: 'Harare, ZW', status: 'Completed' },
        { time: '2024-01-18 13:45', user: 't.gumbo@zeepay.co.zw', method: 'SSO', ip: '102.128.x.x', location: 'Harare, ZW', status: 'Completed' },
        { time: '2024-01-18 11:20', user: 'n.karemba@zeepay.co.zw', method: 'Password + MFA', ip: '77.246.x.x', location: 'Bulawayo, ZW', status: 'Completed' },
        { time: '2024-01-18 09:02', user: 'unknown', method: 'Password', ip: '185.x.x.x', location: 'Unknown', status: 'Failed' },
        { time: '2024-01-17 18:40', user: 'c.moyo@zeepay.co.zw', method: 'Password + MFA', ip: '41.220.x.x', location: 'Harare, ZW', status: 'Completed' },
      ],
      searchableFields: ['user', 'ip', 'location'],
      filterKey: 'status',
      filterLabel: 'All statuses',
      actions: false,
    },
  },

  'super-admin/security/sessions': {
    title: 'Active Sessions',
    description: 'Currently authenticated admin and staff sessions',
    stats: [
      { label: 'Active Sessions', value: 14 },
      { label: 'Admins Online', value: 11 },
      { label: 'Idle > 20min', value: 2, tone: 'warning' },
      { label: 'Expiring Soon', value: 3 },
    ],
    table: {
      title: 'Sessions',
      columns: [
        { key: 'user', label: 'User' },
        { key: 'device', label: 'Device' },
        { key: 'ip', label: 'IP' },
        { key: 'started', label: 'Started' },
        { key: 'idle', label: 'Idle' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { user: 'm.sithole@zeepay.co.zw', device: 'Chrome / Windows', ip: '41.220.x.x', started: '13:40', idle: '2 min', status: 'Active' },
        { user: 't.gumbo@zeepay.co.zw', device: 'Safari / macOS', ip: '102.128.x.x', started: '13:45', idle: '8 min', status: 'Active' },
        { user: 't.mukono@zeepay.co.zw', device: 'Chrome / Windows', ip: '41.220.x.x', started: '09:15', idle: '25 min', status: 'Active' },
        { user: 'r.dube@zeepay.co.zw', device: 'Firefox / Windows', ip: '77.246.x.x', started: '08:55', idle: '1 min', status: 'Active' },
        { user: 'n.karemba@zeepay.co.zw', device: 'Chrome / Android', ip: '77.246.x.x', started: '11:20', idle: '45 min', status: 'Pending' },
      ],
      searchableFields: ['user', 'device', 'ip'],
    },
  },

  'super-admin/security/mfa': {
    title: 'MFA Policies',
    description: 'Multi-factor authentication requirements and enrolment',
    stats: [
      { label: 'Staff with MFA', value: '24/24', tone: 'success' },
      { label: 'Enforcement', value: 'Mandatory' },
      { label: 'TOTP', value: 22 },
      { label: 'Hardware Keys', value: 2 },
    ],
    table: {
      title: 'MFA Policy Rules',
      columns: [
        { key: 'appliesTo', label: 'Applies To' },
        { key: 'methods', label: 'Allowed Methods' },
        { key: 'grace', label: 'Enrolment Grace' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { appliesTo: 'Super Admins', methods: 'TOTP + hardware key', grace: 'None — required at setup', status: 'Active' },
        { appliesTo: 'Admins', methods: 'TOTP', grace: '24 hours', status: 'Active' },
        { appliesTo: 'Service accounts', methods: 'Key-based only', grace: 'N/A', status: 'Active' },
        { appliesTo: 'Merchants (optional)', methods: 'TOTP, SMS', grace: 'Optional, encouraged', status: 'Active' },
      ],
      searchableFields: ['appliesTo', 'methods'],
      actions: false,
    },
  },

  'super-admin/security/alerts': {
    title: 'Suspicious Access',
    description: 'Anomalous access patterns and security alerts',
    alert: { tone: 'danger', message: '1 unresolved suspicious login from an unrecognised location.' },
    stats: [
      { label: 'Open Alerts', value: 3, tone: 'warning' },
      { label: 'Critical', value: 1, tone: 'danger' },
      { label: 'Resolved (30d)', value: 12 },
      { label: 'Blocked IPs (30d)', value: 5 },
    ],
    table: {
      title: 'Security Alerts',
      columns: [
        { key: 'id', label: 'Alert' },
        { key: 'type', label: 'Type' },
        { key: 'detail', label: 'Detail', sortable: false },
        { key: 'raised', label: 'Raised' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { id: 'SEC-092', type: 'Unrecognised location', detail: 'Failed login for admin account from 185.x.x.x', raised: '09:02', status: 'Pending' },
        { id: 'SEC-091', type: 'Impossible travel', detail: 'Session from Harare then Lagos within 1h', raised: 'Yesterday', status: 'Under Review' },
        { id: 'SEC-090', type: 'Brute force', detail: '8 failed attempts on support account', raised: 'Yesterday', status: 'Completed' },
        { id: 'SEC-089', type: 'Privilege escalation attempt', detail: 'API call to super-admin scope denied', raised: '2024-01-16', status: 'Completed' },
      ],
      searchableFields: ['id', 'type', 'detail'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/audit/records': {
    title: 'Audit Records',
    description: 'Complete immutable audit trail for compliance',
    stats: [
      { label: 'Records (30d)', value: '12,480' },
      { label: 'Privileged Actions', value: 96 },
      { label: 'Retention', value: '7 years' },
      { label: 'Integrity Checks', value: 'Passing', tone: 'success' },
    ],
    table: {
      title: 'Audit Trail',
      columns: [
        { key: 'time', label: 'Timestamp' },
        { key: 'actor', label: 'Actor' },
        { key: 'action', label: 'Action' },
        { key: 'resource', label: 'Resource' },
        { key: 'hash', label: 'Record Hash' },
      ],
      rows: [
        { time: '2024-01-18 14:22:10', actor: 'm.sithole', action: 'flag.update', resource: 'smart_routing', hash: 'a3f9…e21c' },
        { time: '2024-01-18 13:41:55', actor: 'c.moyo', action: 'settlement.approve', resource: 'Batch #412', hash: '7b2d…90f1' },
        { time: '2024-01-18 12:30:08', actor: 't.mukono', action: 'kyc.approve', resource: 'Hwange Safari Tours', hash: 'c81e…4aa7' },
        { time: '2024-01-18 11:02:44', actor: 't.gumbo', action: 'provider.credential.rotate', resource: 'ZIPIT', hash: 'f5a0…b8d3' },
        { time: '2024-01-18 09:15:31', actor: 'system', action: 'backup.completed', resource: 'primary-db', hash: '9c14…77e2' },
      ],
      searchableFields: ['actor', 'action', 'resource'],
      actions: false,
    },
  },

  'super-admin/audit/queues': {
    title: 'Approval Queues',
    description: 'Pending approvals requiring super-admin sign-off',
    stats: [
      { label: 'Awaiting Approval', value: 7, tone: 'warning' },
      { label: 'Approved Today', value: 5, tone: 'success' },
      { label: 'Rejected (7d)', value: 1 },
      { label: 'Avg. Wait', value: '3.2h' },
    ],
    table: {
      title: 'Queue',
      columns: [
        { key: 'id', label: 'Request' },
        { key: 'type', label: 'Type' },
        { key: 'requestedBy', label: 'Requested By' },
        { key: 'amount', label: 'Value' },
        { key: 'waiting', label: 'Waiting' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { id: 'APR-221', type: 'Settlement batch #415', requestedBy: 'Finance system', amount: '$58,200', waiting: '2h', status: 'Pending' },
        { id: 'APR-220', type: 'Provider go-live (Stripe)', requestedBy: 'Integrations', amount: '—', waiting: '5h', status: 'Pending' },
        { id: 'APR-219', type: 'Merchant tier upgrade', requestedBy: 'Ops', amount: 'Grace Store → Scale', waiting: '1d', status: 'Pending' },
        { id: 'APR-218', type: 'Fee waiver', requestedBy: 'Support', amount: '$120', waiting: '1d', status: 'Pending' },
        { id: 'APR-217', type: 'Credential rotation', requestedBy: 'Security', amount: 'Omari keys', waiting: '2d', status: 'Under Review' },
      ],
      searchableFields: ['id', 'type', 'requestedBy'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/audit/history': {
    title: 'Change History',
    description: 'Configuration change history across the platform',
    table: {
      title: 'Changes',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'change', label: 'Change' },
        { key: 'area', label: 'Area' },
        { key: 'by', label: 'By' },
        { key: 'rollback', label: 'Rollback' },
      ],
      rows: [
        { date: '2024-01-18', change: 'smart_routing rollout 25% → 50%', area: 'Feature flags', by: 'm.sithole', rollback: 'Available' },
        { date: '2024-01-17', change: 'Omari timeout 5s → 10s', area: 'Provider config', by: 'n.karemba', rollback: 'Available' },
        { date: '2024-01-15', change: 'Risk threshold: block at $10,000', area: 'Risk rules', by: 't.mukono', rollback: 'Available' },
        { date: '2024-01-12', change: 'ZMW payout corridor enabled', area: 'Countries', by: 't.gumbo', rollback: 'Available' },
        { date: '2024-01-10', change: 'Stripe added as card processor', area: 'Providers', by: 't.gumbo', rollback: 'Completed' },
      ],
      searchableFields: ['change', 'area', 'by'],
      actions: false,
    },
  },

  'super-admin/settings/features': {
    title: 'Feature Flags',
    description: 'Platform-level feature flag control with rollout stages',
    table: {
      title: 'Flags',
      columns: [
        { key: 'flag', label: 'Flag' },
        { key: 'description', label: 'Description', sortable: false },
        { key: 'rollout', label: 'Rollout' },
        { key: 'owner', label: 'Owner' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { flag: 'smart_routing', description: 'Auto-select best provider per transaction', rollout: '50%', owner: 'Platform', status: 'Pending' },
        { flag: 'instant_settlement', description: 'Same-day settlement for Scale tier', rollout: '25%', owner: 'Finance', status: 'Pending' },
        { flag: 'hosted_checkout_v2', description: 'New hosted checkout UI', rollout: '100%', owner: 'Platform', status: 'Active' },
        { flag: 'multi_currency_wallets', description: 'USD + ZWG merchant wallets', rollout: '0%', owner: 'Platform', status: 'Inactive' },
        { flag: 'zambia_launch', description: 'Zambia market enablement', rollout: '10%', owner: 'Ops', status: 'Pending' },
      ],
      searchableFields: ['flag', 'description', 'owner'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/settings/maintenance': {
    title: 'Maintenance Mode',
    description: 'Control planned maintenance windows and platform availability',
    panels: [
      {
        title: 'Current State',
        items: [
          { label: 'Maintenance mode', badge: 'Inactive' },
          { label: 'Last window', value: '2024-01-08 03:00–04:30 CAT' },
          { label: 'Next scheduled', value: 'None' },
        ],
      },
      {
        title: 'Maintenance Scope',
        items: [
          { label: 'Block new payments', badge: 'Inactive' },
          { label: 'Block dashboard login', badge: 'Inactive' },
          { label: 'API read-only mode', badge: 'Inactive' },
          { label: 'Merchant-facing banner', badge: 'Inactive' },
        ],
      },
    ],
    table: {
      title: 'Scheduled Windows',
      columns: [
        { key: 'window', label: 'Window' },
        { key: 'scope', label: 'Scope' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { window: '2024-01-08 03:00–04:30 CAT', scope: 'Database failover test', reason: 'Quarterly DR drill', status: 'Completed' },
        { window: '2024-02-04 02:00–03:00 CAT', scope: 'Payments API deploy', reason: 'v1.4 release', status: 'Pending' },
      ],
      searchableFields: ['scope', 'reason'],
      filterKey: 'status',
      filterLabel: 'All statuses',
      actions: false,
    },
  },

  'super-admin/settings/notifications': {
    title: 'Notification Templates',
    description: 'Email and SMS templates sent by the platform',
    table: {
      title: 'Templates',
      columns: [
        { key: 'template', label: 'Template' },
        { key: 'channel', label: 'Channel' },
        { key: 'trigger', label: 'Trigger' },
        { key: 'updated', label: 'Updated' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { template: 'payment_receipt', channel: 'Email + SMS', trigger: 'payment.succeeded', updated: '2024-01-05', status: 'Active' },
        { template: 'payment_failed', channel: 'Email', trigger: 'payment.failed', updated: '2024-01-05', status: 'Active' },
        { template: 'settlement_paid', channel: 'Email', trigger: 'settlement.paid', updated: '2023-12-20', status: 'Active' },
        { template: 'kyc_approved', channel: 'Email + SMS', trigger: 'merchant.approved', updated: '2023-12-15', status: 'Active' },
        { template: 'kyc_info_required', channel: 'Email', trigger: 'verification.info_required', updated: '2023-12-15', status: 'Active' },
        { template: 'dispute_opened', channel: 'Email + SMS', trigger: 'dispute.created', updated: '2024-01-02', status: 'Active' },
      ],
      searchableFields: ['template', 'trigger'],
      filterKey: 'channel',
      filterLabel: 'All channels',
    },
  },

  'super-admin/settings/environment': {
    title: 'Environment Settings',
    description: 'Environment configuration and deployment targets',
    panels: [
      {
        title: 'Production',
        items: [
          { label: 'API base URL', value: 'api.zeepay.co.zw' },
          { label: 'Region', value: 'af-south-1' },
          { label: 'Database', value: 'Primary + 2 replicas' },
          { label: 'Status', badge: 'Active' },
        ],
      },
      {
        title: 'Sandbox',
        items: [
          { label: 'API base URL', value: 'sandbox.api.zeepay.co.zw' },
          { label: 'Simulated providers', badge: 'Active' },
          { label: 'Data refresh', value: 'Weekly (Mon 02:00)' },
          { label: 'Status', badge: 'Active' },
        ],
      },
      {
        title: 'Secrets & Keys',
        items: [
          { label: 'Key management', value: 'Managed KMS' },
          { label: 'Rotation policy', value: '90 days' },
          { label: 'Last full rotation', value: '2024-01-02' },
        ],
      },
      {
        title: 'Backups',
        items: [
          { label: 'Schedule', value: 'Hourly incremental, daily full' },
          { label: 'Retention', value: '35 days' },
          { label: 'Last verified restore', value: '2024-01-08' },
        ],
      },
    ],
  },

  'super-admin/analytics': {
    title: 'Platform Analytics',
    description: 'Global platform metrics across all tenants and regions',
    stats: [
      { label: 'GMV (MTD)', value: '$412,800', tone: 'success', sub: '↑ 14.2% MoM' },
      { label: 'Platform Revenue (MTD)', value: '$18,240' },
      { label: 'Transactions (MTD)', value: '11,204' },
      { label: 'Active Merchants', value: 521 },
    ],
    table: {
      title: 'Daily Metrics (7d)',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'volume', label: 'Volume' },
        { key: 'txns', label: 'Transactions' },
        { key: 'success', label: 'Success Rate' },
        { key: 'newMerchants', label: 'New Merchants' },
      ],
      rows: [
        { date: '2024-01-18', volume: '$28,400', txns: 812, success: '97.9%', newMerchants: 3 },
        { date: '2024-01-17', volume: '$31,200', txns: 902, success: '98.1%', newMerchants: 5 },
        { date: '2024-01-16', volume: '$26,900', txns: 764, success: '97.4%', newMerchants: 2 },
        { date: '2024-01-15', volume: '$29,800', txns: 845, success: '98.3%', newMerchants: 4 },
        { date: '2024-01-14', volume: '$24,100', txns: 690, success: '97.8%', newMerchants: 2 },
        { date: '2024-01-13', volume: '$22,700', txns: 648, success: '98.0%', newMerchants: 1 },
      ],
      searchableFields: ['date'],
      actions: false,
    },
  },

  'super-admin/compliance': {
    title: 'Compliance Overview',
    description: 'Platform-wide compliance posture and regulatory obligations',
    stats: [
      { label: 'Open Reviews', value: 5, tone: 'warning' },
      { label: 'Verified Merchants', value: '489/521', tone: 'success' },
      { label: 'Regulatory Reports Due', value: 1 },
      { label: 'Policy Violations (30d)', value: 0, tone: 'success' },
    ],
    panels: [
      {
        title: 'Licences & Filings',
        items: [
          { label: 'RBZ PSP licence', badge: 'Active' },
          { label: 'Next renewal', value: '2025-03-31' },
          { label: 'Quarterly RBZ report', value: 'Due 2024-02-15' },
          { label: 'PCI-DSS attestation', badge: 'Active' },
        ],
      },
      {
        title: 'Programme Health',
        items: [
          { label: 'KYC completion rate', value: '93.9%' },
          { label: 'Sanctions screening', badge: 'Active' },
          { label: 'AML monitoring rules', value: '18 active' },
          { label: 'Staff compliance training', value: '100% current' },
        ],
      },
    ],
    table: {
      title: 'Upcoming Obligations',
      columns: [
        { key: 'obligation', label: 'Obligation' },
        { key: 'authority', label: 'Authority' },
        { key: 'due', label: 'Due Date' },
        { key: 'owner', label: 'Owner' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { obligation: 'Q4 transaction report', authority: 'RBZ', due: '2024-02-15', owner: 'Compliance', status: 'Pending' },
        { obligation: 'Annual AML audit', authority: 'External auditor', due: '2024-04-30', owner: 'Compliance', status: 'Pending' },
        { obligation: 'PCI-DSS SAQ renewal', authority: 'Acquiring bank', due: '2024-06-30', owner: 'Security', status: 'Pending' },
        { obligation: 'Licence renewal filing', authority: 'RBZ', due: '2025-01-31', owner: 'Legal', status: 'Pending' },
      ],
      searchableFields: ['obligation', 'authority'],
      actions: false,
    },
  },

  'super-admin/approvals/merchants': {
    title: 'Merchant Approvals',
    description: 'Merchant-level changes requiring super-admin approval',
    stats: [
      { label: 'Pending', value: 6, tone: 'warning' },
      { label: 'Approved (7d)', value: 9, tone: 'success' },
      { label: 'Rejected (7d)', value: 1 },
      { label: 'Avg. Decision', value: '4.8h' },
    ],
    table: {
      title: 'Approval Requests',
      columns: [
        { key: 'id', label: 'Request' },
        { key: 'merchant', label: 'Merchant' },
        { key: 'change', label: 'Change', sortable: false },
        { key: 'requestedBy', label: 'Requested By' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { id: 'MA-118', merchant: 'Grace Store', change: 'Tier upgrade to Scale', requestedBy: 'Ops', status: 'Pending' },
        { id: 'MA-117', merchant: 'Kariba Boat Hire', change: 'Lift volume cap', requestedBy: 'Risk team', status: 'Pending' },
        { id: 'MA-116', merchant: 'Mutare Gems Export', change: 'Reinstate after EDD', requestedBy: 'Compliance', status: 'Pending' },
        { id: 'MA-115', merchant: 'Harare Events Co', change: 'Custom pricing', requestedBy: 'Sales', status: 'Pending' },
        { id: 'MA-114', merchant: 'Old Mill Trading', change: 'Appeal: lift suspension', requestedBy: 'Merchant', status: 'Under Review' },
        { id: 'MA-113', merchant: 'Chitungwiza Mart', change: 'Payout account change', requestedBy: 'Merchant', status: 'Completed' },
      ],
      searchableFields: ['id', 'merchant', 'change'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/health/api': {
    title: 'API Availability',
    description: 'API endpoint availability and latency monitoring',
    stats: [
      { label: 'Availability (24h)', value: '100%', tone: 'success' },
      { label: 'Avg. Latency', value: '86ms' },
      { label: 'p99 Latency', value: '410ms' },
      { label: 'Requests (24h)', value: '1.2M' },
    ],
    table: {
      title: 'Endpoint Health (1h)',
      columns: [
        { key: 'endpoint', label: 'Endpoint' },
        { key: 'requests', label: 'Requests' },
        { key: 'errors', label: 'Errors' },
        { key: 'p50', label: 'p50' },
        { key: 'p99', label: 'p99' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { endpoint: 'POST /v1/payments', requests: '18,420', errors: '12', p50: '95ms', p99: '480ms', status: 'Active' },
        { endpoint: 'GET /v1/payments/:id', requests: '32,110', errors: '3', p50: '34ms', p99: '210ms', status: 'Active' },
        { endpoint: 'POST /v1/refunds', requests: '890', errors: '1', p50: '120ms', p99: '520ms', status: 'Active' },
        { endpoint: 'GET /v1/merchants', requests: '4,310', errors: '0', p50: '28ms', p99: '160ms', status: 'Active' },
        { endpoint: 'POST /v1/webhooks/test', requests: '240', errors: '0', p50: '65ms', p99: '300ms', status: 'Active' },
      ],
      searchableFields: ['endpoint'],
      actions: false,
    },
  },

  'super-admin/health/jobs': {
    title: 'Background Jobs',
    description: 'Queue workers and scheduled job execution',
    stats: [
      { label: 'Queue Depth', value: 42 },
      { label: 'Failed Jobs (24h)', value: 3, tone: 'warning' },
      { label: 'Workers', value: '8/8', tone: 'success' },
      { label: 'Avg. Job Time', value: '340ms' },
    ],
    table: {
      title: 'Job Queues',
      columns: [
        { key: 'queue', label: 'Queue' },
        { key: 'pending', label: 'Pending' },
        { key: 'processing', label: 'Processing' },
        { key: 'failed', label: 'Failed (24h)' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { queue: 'webhooks', pending: 28, processing: 6, failed: 2, status: 'Active' },
        { queue: 'settlements', pending: 4, processing: 2, failed: 0, status: 'Active' },
        { queue: 'notifications', pending: 9, processing: 4, failed: 1, status: 'Active' },
        { queue: 'reconciliation', pending: 1, processing: 1, failed: 0, status: 'Active' },
        { queue: 'reports', pending: 0, processing: 0, failed: 0, status: 'Active' },
      ],
      searchableFields: ['queue'],
      filterKey: 'status',
      filterLabel: 'All statuses',
      actions: false,
    },
  },

  'super-admin/health/webhooks': {
    title: 'Webhook Processing',
    description: 'Outbound webhook delivery pipeline health',
    stats: [
      { label: 'Delivered (24h)', value: '98.4%', tone: 'success' },
      { label: 'Retrying', value: 31, tone: 'warning' },
      { label: 'Exhausted (24h)', value: 8, tone: 'danger' },
      { label: 'Avg. Delivery Time', value: '1.2s' },
    ],
    table: {
      title: 'Failing Endpoints',
      columns: [
        { key: 'endpoint', label: 'Endpoint' },
        { key: 'merchant', label: 'Merchant' },
        { key: 'failures', label: 'Failures' },
        { key: 'lastError', label: 'Last Error' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { endpoint: 'https://kudatraders.co.zw/hooks', merchant: 'Kuda Traders', failures: 14, lastError: 'Connection refused', status: 'Failed' },
        { endpoint: 'https://api.msq.co.zw/zeepay', merchant: 'Market Square', failures: 6, lastError: 'HTTP 500', status: 'Pending' },
        { endpoint: 'https://hooks.byoelec.co.zw', merchant: 'Bulawayo Electronics', failures: 2, lastError: 'Timeout', status: 'Pending' },
        { endpoint: 'https://oldmill.co.zw/hooks', merchant: 'Old Mill Trading', failures: 9, lastError: 'DNS resolution failed', status: 'Failed' },
      ],
      searchableFields: ['endpoint', 'merchant'],
      filterKey: 'status',
      filterLabel: 'All statuses',
    },
  },

  'super-admin/health/errors': {
    title: 'Error Rates',
    description: 'Platform error rates and top error sources',
    stats: [
      { label: 'Error Rate (1h)', value: '0.18%', tone: 'success' },
      { label: '5xx (24h)', value: 96 },
      { label: '4xx (24h)', value: '4,120' },
      { label: 'Error Budget Left', value: '94%' },
    ],
    table: {
      title: 'Top Errors (24h)',
      columns: [
        { key: 'error', label: 'Error' },
        { key: 'endpoint', label: 'Endpoint' },
        { key: 'count', label: 'Count' },
        { key: 'firstSeen', label: 'First Seen' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { error: 'provider_timeout', endpoint: 'POST /v1/payments', count: 41, firstSeen: '06:20', status: 'Pending' },
        { error: 'validation_failed', endpoint: 'POST /v1/payments', count: 28, firstSeen: '00:05', status: 'Completed' },
        { error: 'rate_limited', endpoint: 'GET /v1/payments/:id', count: 15, firstSeen: '08:12', status: 'Completed' },
        { error: 'webhook_signature_invalid', endpoint: 'POST /v1/webhooks/test', count: 9, firstSeen: '11:40', status: 'Pending' },
        { error: 'db_connection_reset', endpoint: '—', count: 3, firstSeen: '13:02', status: 'Under Review' },
      ],
      searchableFields: ['error', 'endpoint'],
      filterKey: 'status',
      filterLabel: 'All statuses',
      actions: false,
    },
  },

  'super-admin/health/incidents': {
    title: 'Service Incidents',
    description: 'Platform incident history and post-incident reviews',
    stats: [
      { label: 'Open Incidents', value: 0, tone: 'success' },
      { label: 'This Quarter', value: 2 },
      { label: 'MTTR', value: '38 min' },
      { label: 'Uptime (90d)', value: '99.97%', tone: 'success' },
    ],
    table: {
      title: 'Incident History',
      columns: [
        { key: 'id', label: 'Incident' },
        { key: 'title', label: 'Title' },
        { key: 'severity', label: 'Severity' },
        { key: 'started', label: 'Started' },
        { key: 'duration', label: 'Duration' },
        { key: 'status', label: 'Status', badge: true },
      ],
      rows: [
        { id: 'SIR-012', title: 'EcoCash provider outage', severity: 'High', started: '2023-12-28 14:20', duration: '2h 10m', status: 'Completed' },
        { id: 'SIR-011', title: 'Elevated webhook latency', severity: 'Low', started: '2023-12-15 09:45', duration: '35m', status: 'Completed' },
        { id: 'SIR-010', title: 'Database replica lag', severity: 'Medium', started: '2023-11-30 22:10', duration: '48m', status: 'Completed' },
        { id: 'SIR-009', title: 'Checkout deploy regression', severity: 'Medium', started: '2023-11-12 16:00', duration: '22m', status: 'Completed' },
      ],
      searchableFields: ['id', 'title'],
      filterKey: 'severity',
      filterLabel: 'All severities',
    },
  },
};
