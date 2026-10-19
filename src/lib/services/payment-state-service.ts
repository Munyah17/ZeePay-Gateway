import { supabaseAdmin } from '../database/client';
import {
  transition,
  canTransition,
  getNextState,
  PaymentState,
  PaymentEvent,
} from './state-machine';
import { deliverWebhookToMerchant } from '../webhooks/delivery';

/**
 * Update payment state with validation
 */
export async function updatePaymentState(
  paymentId: string,
  event: PaymentEvent,
  metadata?: Record<string, any>
): Promise<PaymentState> {
  // Get current payment state
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('id, status, merchant_id, amount, currency, merchant_reference')
    .eq('id', paymentId)
    .single();

  if (fetchError || !payment) {
    throw new Error(`Payment not found: ${paymentId}`);
  }

  const currentState = payment.status as PaymentState;

  // Validate transition
  if (!canTransition(currentState, event)) {
    throw new Error(
      `Invalid state transition: ${currentState} -> ${event}`
    );
  }

  // Get next state
  const nextState = getNextState(currentState, event);

  if (!nextState) {
    throw new Error(
      `Cannot transition from ${currentState} via ${event}`
    );
  }

  // Update payment state
  const updateData: any = {
    status: nextState,
    updated_at: new Date().toISOString(),
  };

  // Set completed_at for terminal states
  if (nextState === 'succeeded' || nextState === 'cancelled') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update(updateData)
    .eq('id', paymentId);

  if (updateError) {
    throw new Error(`Failed to update payment state: ${updateError.message}`);
  }

  // Trigger webhook based on new state
  await triggerWebhookForState(
    payment.merchant_id,
    paymentId,
    nextState,
    {
      id: payment.id,
      reference: payment.merchant_reference,
      amount: payment.amount,
      currency: payment.currency,
      ...metadata,
    }
  );

  return nextState;
}

/**
 * Trigger webhook based on payment state
 */
async function triggerWebhookForState(
  merchantId: string,
  paymentId: string,
  state: PaymentState,
  data: Record<string, any>
): Promise<void> {
  let eventType: string | null = null;

  switch (state) {
    case 'succeeded':
      eventType = 'payment.succeeded';
      break;
    case 'failed':
      eventType = 'payment.failed';
      break;
    case 'cancelled':
      eventType = 'payment.cancelled';
      break;
    default:
      // Don't send webhooks for intermediate states
      return;
  }

  if (eventType) {
    await deliverWebhookToMerchant(merchantId, eventType, {
      paymentId,
      ...data,
    });
  }
}

/**
 * Get payment state history
 */
export async function getPaymentStateHistory(paymentId: string) {
  // For now, return the current state
  // In a full implementation, you'd have a separate state_history table
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('status, updated_at')
    .eq('id', paymentId)
    .single();

  if (error || !data) {
    throw new Error(`Payment not found: ${paymentId}`);
  }

  return [
    {
      state: data.status,
      timestamp: data.updated_at,
    },
  ];
}

/**
 * Bulk update payment states (e.g., for reconciliation)
 */
export async function bulkUpdatePaymentStates(
  updates: Array<{ paymentId: string; event: PaymentEvent }>
): Promise<Array<{ paymentId: string; success: boolean; error?: string }>> {
  const results = await Promise.allSettled(
    updates.map(async ({ paymentId, event }) => {
      try {
        const newState = await updatePaymentState(paymentId, event);
        return { paymentId, success: true, newState };
      } catch (error) {
        return {
          paymentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return results.map((result) =>
    result.status === 'fulfilled' ? result.value : { paymentId: '', success: false, error: 'Promise rejected' }
  );
}
