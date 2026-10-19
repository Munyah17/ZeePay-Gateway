import { supabaseAdmin } from '../database/client';
import { generateSignature } from './signature';

export interface WebhookPayload {
  eventType: string;
  data: Record<string, any>;
}

/**
 * Create a webhook event
 */
export async function createWebhookEvent(
  eventType: string,
  data: Record<string, any>
): Promise<string> {
  const { data: event, error } = await supabaseAdmin
    .from('webhook_events')
    .insert({
      event_type: eventType,
      data,
    })
    .select()
    .single();

  if (error || !event) {
    throw new Error(`Failed to create webhook event: ${error?.message}`);
  }

  return event.id;
}

/**
 * Deliver webhook to a single endpoint
 */
export async function deliverWebhook(
  webhookEndpointId: string,
  webhookEventId: string,
  url: string,
  secret: string
): Promise<void> {
  // Get the event data
  const { data: event, error: eventError } = await supabaseAdmin
    .from('webhook_events')
    .select('*')
    .eq('id', webhookEventId)
    .single();

  if (eventError || !event) {
    throw new Error(`Failed to fetch webhook event: ${eventError?.message}`);
  }

  // Prepare payload
  const payload = JSON.stringify({
    id: event.id,
    event: event.event_type,
    data: event.data,
    created_at: event.created_at,
  });

  // Generate signature
  const signature = generateSignature(payload, secret);

  // Create delivery record
  const { data: delivery, error: deliveryError } = await supabaseAdmin
    .from('webhook_deliveries')
    .insert({
      webhook_endpoint_id: webhookEndpointId,
      webhook_event_id: webhookEventId,
      status: 'pending',
      attempt_count: 0,
    })
    .select()
    .single();

  if (deliveryError || !delivery) {
    throw new Error(`Failed to create webhook delivery: ${deliveryError?.message}`);
  }

  // Attempt delivery
  let attemptCount = 0;
  let success = false;
  let statusCode: number | undefined;
  let responseBody: string | undefined;

  while (attemptCount < 3 && !success) {
    attemptCount++;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ZeePay-Signature': signature,
          'X-ZeePay-Event-Id': event.id,
        },
        body: payload,
      });

      statusCode = response.status;
      responseBody = await response.text();

      if (response.ok) {
        success = true;
      }
    } catch (error) {
      console.error(`Webhook delivery attempt ${attemptCount} failed:`, error);
    }

    if (!success && attemptCount < 3) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attemptCount - 1) * 1000));
    }
  }

  // Update delivery record
  const { error: updateError } = await supabaseAdmin
    .from('webhook_deliveries')
    .update({
      status: success ? 'delivered' : 'failed',
      http_status_code: statusCode,
      response_body: responseBody,
      attempt_count: attemptCount,
      delivered_at: success ? new Date().toISOString() : null,
      next_retry_at: !success ? new Date(Date.now() + 60000).toISOString() : null, // Retry in 1 minute
    })
    .eq('id', delivery.id);

  if (updateError) {
    throw new Error(`Failed to update webhook delivery: ${updateError.message}`);
  }
}

/**
 * Deliver webhook to all matching endpoints for a merchant
 */
export async function deliverWebhookToMerchant(
  merchantId: string,
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  // Create the webhook event
  const webhookEventId = await createWebhookEvent(eventType, data);

  // Get all active webhook endpoints for this merchant that are subscribed to this event
  const { data: endpoints, error } = await supabaseAdmin
    .from('webhook_endpoints')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .contains('events', [eventType]);

  if (error) {
    throw new Error(`Failed to fetch webhook endpoints: ${error.message}`);
  }

  if (!endpoints || endpoints.length === 0) {
    return; // No endpoints to deliver to
  }

  // Deliver to each endpoint in parallel
  const deliveryPromises = endpoints.map((endpoint) =>
    deliverWebhook(endpoint.id, webhookEventId, endpoint.url, endpoint.secret)
  );

  await Promise.allSettled(deliveryPromises);
}

/**
 * Get webhook delivery history for an endpoint
 */
export async function getWebhookDeliveries(
  webhookEndpointId: string,
  limit: number = 50
) {
  const { data, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*, webhook_events(event_type, data)')
    .eq('webhook_endpoint_id', webhookEndpointId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch webhook deliveries: ${error.message}`);
  }

  return data;
}
