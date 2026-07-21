export interface UserSubscription {
  id?: number;
  userId: number;
  planName: string;
  status: string;
  startDate: string;
  renewalDate?: string | null;
  monthlyCost?: number | null;
  billingCycle?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
