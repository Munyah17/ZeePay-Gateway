/**
 * Payment state machine
 * Manages valid state transitions for payments
 */

export type PaymentState =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type PaymentEvent =
  | 'create'
  | 'start_processing'
  | 'complete'
  | 'fail'
  | 'cancel'
  | 'retry';

/**
 * State transition rules
 * Maps current state + event -> next state
 */
const stateTransitions: Record<
  PaymentState,
  Record<PaymentEvent, PaymentState | null>
> = {
  pending: {
    create: 'pending',
    start_processing: 'processing',
    complete: 'succeeded',
    fail: 'failed',
    cancel: 'cancelled',
    retry: 'pending',
  },
  processing: {
    create: null, // Invalid
    start_processing: 'processing',
    complete: 'succeeded',
    fail: 'failed',
    cancel: 'cancelled',
    retry: 'pending',
  },
  succeeded: {
    create: null, // Invalid - terminal state
    start_processing: null, // Invalid
    complete: null, // Invalid
    fail: null, // Invalid
    cancel: null, // Invalid
    retry: null, // Invalid
  },
  failed: {
    create: null, // Invalid
    start_processing: null, // Invalid
    complete: null, // Invalid
    fail: 'failed',
    cancel: 'cancelled',
    retry: 'pending', // Can retry failed payments
  },
  cancelled: {
    create: null, // Invalid - terminal state
    start_processing: null, // Invalid
    complete: null, // Invalid
    fail: null, // Invalid
    cancel: 'cancelled',
    retry: null, // Invalid
  },
};

/**
 * Check if a state transition is valid
 */
export function canTransition(
  currentState: PaymentState,
  event: PaymentEvent
): boolean {
  const nextState = stateTransitions[currentState]?.[event];
  return nextState !== null;
}

/**
 * Get the next state for a transition
 */
export function getNextState(
  currentState: PaymentState,
  event: PaymentEvent
): PaymentState | null {
  return stateTransitions[currentState]?.[event] || null;
}

/**
 * Execute a state transition
 * @throws Error if transition is invalid
 */
export function transition(
  currentState: PaymentState,
  event: PaymentEvent
): PaymentState {
  const nextState = getNextState(currentState, event);

  if (nextState === null) {
    throw new Error(
      `Invalid state transition: ${currentState} -> ${event}`
    );
  }

  return nextState;
}

/**
 * Check if a state is terminal (no further transitions possible)
 */
export function isTerminalState(state: PaymentState): boolean {
  return state === 'succeeded' || state === 'cancelled';
}

/**
 * Check if a state allows retry
 */
export function canRetry(state: PaymentState): boolean {
  return state === 'failed';
}

/**
 * Get all valid events for a given state
 */
export function getValidEvents(state: PaymentState): PaymentEvent[] {
  const transitions = stateTransitions[state];
  return Object.entries(transitions)
    .filter(([_, nextState]) => nextState !== null)
    .map(([event]) => event as PaymentEvent);
}
