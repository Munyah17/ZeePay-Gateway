interface StatusBadgeProps {
  status: string;
  type?: 'payment' | 'refund' | 'merchant' | 'provider' | 'settlement' | 'application' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, type = 'default', size = 'sm' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    const normalizedStatus = status.toLowerCase().replace(/[_\s-]/g, '');

    // Payment statuses
    if (type === 'payment') {
      const paymentStatuses: Record<string, { color: string; label: string }> = {
        created: { color: 'bg-secondary', label: 'Created' },
        pending: { color: 'bg-warning text-dark', label: 'Pending' },
        processing: { color: 'bg-info text-dark', label: 'Processing' },
        succeeded: { color: 'bg-success', label: 'Succeeded' },
        failed: { color: 'bg-danger', label: 'Failed' },
        cancelled: { color: 'bg-secondary', label: 'Cancelled' },
        expired: { color: 'bg-secondary', label: 'Expired' },
      };
      return paymentStatuses[normalizedStatus] || { color: 'bg-secondary', label: status };
    }

    // Refund statuses
    if (type === 'refund') {
      const refundStatuses: Record<string, { color: string; label: string }> = {
        requested: { color: 'bg-info text-dark', label: 'Requested' },
        pending: { color: 'bg-warning text-dark', label: 'Pending' },
        succeeded: { color: 'bg-success', label: 'Succeeded' },
        failed: { color: 'bg-danger', label: 'Failed' },
        rejected: { color: 'bg-danger', label: 'Rejected' },
      };
      return refundStatuses[normalizedStatus] || { color: 'bg-secondary', label: status };
    }

    // Merchant statuses
    if (type === 'merchant') {
      const merchantStatuses: Record<string, { color: string; label: string }> = {
        application: { color: 'bg-info text-dark', label: 'Application' },
        underreview: { color: 'bg-warning text-dark', label: 'Under Review' },
        active: { color: 'bg-success', label: 'Active' },
        restricted: { color: 'bg-warning text-dark', label: 'Restricted' },
        suspended: { color: 'bg-danger', label: 'Suspended' },
        closed: { color: 'bg-secondary', label: 'Closed' },
      };
      return merchantStatuses[normalizedStatus] || { color: 'bg-secondary', label: status };
    }

    // Provider statuses
    if (type === 'provider') {
      const providerStatuses: Record<string, { color: string; label: string }> = {
        planned: { color: 'bg-secondary', label: 'Planned' },
        pendingapproval: { color: 'bg-warning text-dark', label: 'Pending Approval' },
        sandbox: { color: 'bg-info text-dark', label: 'Sandbox' },
        connected: { color: 'bg-success', label: 'Connected' },
        degraded: { color: 'bg-warning text-dark', label: 'Degraded' },
        unavailable: { color: 'bg-danger', label: 'Unavailable' },
        suspended: { color: 'bg-danger', label: 'Suspended' },
      };
      return providerStatuses[normalizedStatus] || { color: 'bg-secondary', label: status };
    }

    // Settlement statuses
    if (type === 'settlement') {
      const settlementStatuses: Record<string, { color: string; label: string }> = {
        expected: { color: 'bg-info text-dark', label: 'Expected' },
        pending: { color: 'bg-warning text-dark', label: 'Pending' },
        reconciled: { color: 'bg-success', label: 'Reconciled' },
        exception: { color: 'bg-danger', label: 'Exception' },
        paid: { color: 'bg-success', label: 'Paid' },
        failed: { color: 'bg-danger', label: 'Failed' },
      };
      return settlementStatuses[normalizedStatus] || { color: 'bg-secondary', label: status };
    }

    // Application statuses
    if (type === 'application') {
      const applicationStatuses: Record<string, { color: string; label: string }> = {
        draft: { color: 'bg-secondary', label: 'Draft' },
        submitted: { color: 'bg-info text-dark', label: 'Submitted' },
        underreview: { color: 'bg-warning text-dark', label: 'Under Review' },
        additionalinformationrequired: { color: 'bg-warning text-dark', label: 'Additional Info Required' },
        approved: { color: 'bg-success', label: 'Approved' },
        rejected: { color: 'bg-danger', label: 'Rejected' },
      };
      return applicationStatuses[normalizedStatus] || { color: 'bg-secondary', label: status };
    }

    // Default fallback
    const defaultStatuses: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-success', label: 'Active' },
      inactive: { color: 'bg-secondary', label: 'Inactive' },
      pending: { color: 'bg-warning text-dark', label: 'Pending' },
      completed: { color: 'bg-success', label: 'Completed' },
      failed: { color: 'bg-danger', label: 'Failed' },
      cancelled: { color: 'bg-secondary', label: 'Cancelled' },
    };
    return defaultStatuses[normalizedStatus] || { color: 'bg-secondary', label: status };
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'small',
    md: '',
    lg: 'fs-6',
  };

  return (
    <span className={`badge ${config.color} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}
