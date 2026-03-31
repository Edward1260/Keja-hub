
/**
 * Mock data has been deprecated in favor of real-time Firestore synchronization.
 * This file is kept for type definitions only.
 */

export type Property = {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  location: string;
  price: number;
  amenities: string[];
  propertyType: string;
  numberOfBedrooms: number;
  isAvailable: boolean;
  imageUrl: string;
  rating: number;
  distanceToUoN: string;
  isVerified: boolean;
};

export type StudentPayment = {
  id: string;
  studentName: string;
  studentPhone: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'delayed';
  dueDate: string;
  propertyName: string;
};

export type Dispute = {
  id: string;
  initiator: string;
  subject: string;
  status: 'open' | 'resolved';
  date: string;
};

// Types for the new system
export type MaintenanceRequest = {
  id: string;
  propertyId: string;
  studentId: string;
  landlordId: string;
  description: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  createdAt: any;
};

export type LeaseAgreement = {
  id: string;
  bookingId: string;
  studentId: string;
  landlordId: string;
  status: 'Draft' | 'PendingSignatures' | 'Active' | 'Expired';
  studentSignedAt?: any;
  landlordSignedAt?: any;
};

export type TrustScoreInfo = {
  score: number;
  label: string;
  color: string;
};

export function getTrustScoreInfo(score: number): TrustScoreInfo {
  if (score >= 90) return { score, label: 'Elite', color: 'text-green-500' };
  if (score >= 70) return { score, label: 'Reliable', color: 'text-blue-500' };
  if (score >= 50) return { score, label: 'Average', color: 'text-orange-500' };
  return { score, label: 'Caution', color: 'text-red-500' };
}
