export interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  prosAvailable: number;
  image: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  userType: 'homeowner' | 'service_provider';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  rating?: number;
  totalReviews?: number;
}

export interface Project {
  id: number;
  homeownerId: number;
  title: string;
  description: string;
  category: string;
  budget?: string;
  urgency?: string;
  zipCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: number;
  projectId: number;
  serviceProviderId: number;
  status: string;
  price: number;
  contactedAt?: string;
  quotedAt?: string;
  quoteAmount?: number;
  revenue?: number;
  createdAt: string;
}

export interface Quote {
  id: number;
  projectId: number;
  serviceProviderId: number;
  amount: number;
  description?: string;
  timeline?: string;
  status: string;
  createdAt: string;
}

export interface AnalyticsStats {
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
  avgLeadValue: number;
}
