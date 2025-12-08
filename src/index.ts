/**
 * Pubflow React Adapter
 *
 * Main entry point for the Pubflow React adapter
 */

// Re-export core (except for items we're re-implementing)
export * from '@pubflow/core';

// Export components
export * from './components/BridgeView';
export * from './components/BridgeTable';
export * from './components/BridgeForm';
export * from './components/BridgeList';
export * from './components/OfflineIndicator';
export * from './components/AdvancedFilter';

// Export authentication components
export * from './components/auth';

// Export theme components
export * from './components/theme';

// Export context
export * from './context/PubflowProvider';

// Export hooks
export * from './hooks/useAuth';
export * from './hooks/useAuthGuard';
export * from './hooks/useBridgeApi';
export * from './hooks/useBridgeApiRaw';
export * from './hooks/useBridgeQuery';
export * from './hooks/useBridgeMutation';

export * from './hooks/useSearchQueryBuilder';

// Explicitly re-export to avoid conflicts
import { useBridgeCrud } from './hooks/useBridgeCrud';
export { useBridgeCrud };

// Export storage
export * from './storage/BrowserStorageAdapter';

// Export utils
export * from './utils/auth-utils';

// Export Bridge Payments (from core)
export { BridgePaymentClient } from '@pubflow/core';
export type {
  BridgePaymentConfig,
  PaymentRequestOptions,
  CreatePaymentIntentRequest,
  PaymentIntent,
  Payment,
  PaymentMethodType,
  PaymentMethod,
  UpdatePaymentMethodRequest,
  AddressType,
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  SubscriptionStatus,
  Subscription,
  CreateSubscriptionRequest,
  CancelSubscriptionRequest,
  OrganizationRole,
  Organization,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationMember,
  AddOrganizationMemberRequest,
  UpdateOrganizationMemberRoleRequest,
  ConvertGuestToUserRequest,
  ConvertGuestToUserResponse,
  PaginationParams,
  ListResponse
} from '@pubflow/core';
