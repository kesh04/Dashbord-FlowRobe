'use client';

import { httpsCallable } from 'firebase/functions';

import { functions } from '@/lib/firebase';

/**
 * Typed calls to the admin-only Cloud Functions (functions/src/admin/adminApi.ts).
 * Results are cached for 60 s, so switching between pages is instant.
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  city: string;
  postcode: string;
  accountType: 'private' | 'business';
  iban: string;
  swiftBic: string;
  createdAt: string | null;
}

export interface AdminProduct {
  id: string;
  productId: string;
  userId: string;
  images: string[];
  headline: string;
  price: number;
  currentBid: number | null;
  bidCount: number;
  actiontime: string | null;
  createdAt: string | null;
  status: string;
  displayName: string;
  city: string;
  postcode: string;
  iban: string;
  swiftBic: string;
  accountType: string;
  sellerEmail: string;
  sellerPhone: string;
}

export interface AdminOffer {
  id: string;
  orderId: string;
  productId: string;
  headline: string;
  imageUrl: string;
  offerAmount: number;
  totalPrice: number;
  status: string;
  deliveryOption: string;
  carrier: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  zipcode: string;
  pickupAddress: string;
  country: string;
  sellerName: string;
  sellerUserId?: string;
  shippingStatus: string;
  tradeConfirmed: boolean;
  paymentReleased: boolean;
  paymentReleaseAt: string | null;
  cancelReason: string;
  reported: boolean;
  paymentIntentId: string;
  actiontime: string | null;
  createdAt: string | null;
  wonAt: string | null;
  paymentReleasedAt?: string | null;
  payoutStatus?: string;
  payoutAmount?: number | null;
  payoutAt?: string | null;
  stripeTransferId?: string;
  paymentReleaseError?: string;
  trackingNumber?: string;
  labelUrl?: string;
  shipmondoStatus?: string;
  shipmondoStatusText?: string;
  shipmondoStatusAt?: string | null;
  shipBy?: string | null;
  pickupBy?: string | null;
}

export interface AdminSeller {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  iban: string;
  accountType: string;
  salesCount: number;
  totalSold: number;
  earned: number;
  pending: number;
  sales: AdminOffer[];
}

export interface AdminOverview {
  counts: { users: number; products: number; orders: number; won: number };
  averages: { day: number; week: number; month: number; year: number; allTime: number };
  latestProducts: { id: string; name: string; image: string; price: number; updatedAt: string | null }[];
  latestOrders: AdminOffer[];
}

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: unknown }>();

async function call<T>(name: string, data: Record<string, unknown> = {}, force = false): Promise<T> {
  const key = `${name}:${JSON.stringify(data)}`;
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < TTL_MS) return hit.data as T;
  const fn = httpsCallable<Record<string, unknown>, T>(functions, name);
  const res = await fn(data);
  cache.set(key, { at: Date.now(), data: res.data });
  return res.data;
}

export function clearAdminCache(): void {
  cache.clear();
}

export const adminApi = {
  overview: (force = false) => call<AdminOverview>('adminGetOverview', {}, force),
  users: (force = false) => call<AdminUser[]>('adminListUsers', {}, force),
  products: (force = false) => call<AdminProduct[]>('adminListProducts', {}, force),
  offers: (status?: string, force = false) => call<AdminOffer[]>('adminListOffers', status ? { status } : {}, force),
  sellers: (force = false) => call<AdminSeller[]>('adminListSellers', {}, force),
};

export function errorText(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'functions/permission-denied') return 'Your account does not have admin access.';
  if (code === 'functions/unauthenticated') return 'Please sign in again.';
  return 'Could not load data. Please try again.';
}

const TABLE_STATUSES = ['pending', 'won', 'refunded', 'lost', 'outbid', 'cancelled', 'payment_failed'] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

/** Shape used by the Orders / Won / Latest orders tables. */
export function toTableOffer(o: AdminOffer) {
  return {
    imageUrl: o.imageUrl,
    id: o.id,
    orderId: o.orderId || o.id,
    productId: o.productId,
    offerAmount: o.offerAmount,
    paymentIntentId: o.paymentIntentId,
    email: o.email || 'N/A',
    status: ((TABLE_STATUSES as readonly string[]).includes(o.status) ? o.status : 'pending') as TableStatus,
    deliveryOption: (o.deliveryOption === 'delivery' ? 'delivery' : 'pickup') as 'pickup' | 'delivery',
    carrier: o.carrier || 'N/A',
    subscribe: false,
    paymentMethod: '',
    zipcode: o.zipcode || 'N/A',
    pickupAddress: o.pickupAddress || 'N/A',
    country: o.country,
    name: o.name || 'N/A',
    phone: o.phone || 'N/A',
    address: o.address || 'N/A',
    city: o.city || 'N/A',
    postalCode: o.postalCode || 'N/A',
    totalPrice: o.totalPrice,
    actiontime: o.actiontime || o.createdAt || new Date(0).toISOString(),
    sellerName: o.sellerName || 'N/A',
    shippingStatus: o.shippingStatus || 'waiting',
    tradeConfirmed: !!o.tradeConfirmed,
    paymentReleased: !!o.paymentReleased,
    paymentReleaseAt: o.paymentReleaseAt || null,
    paymentReleasedAt: o.paymentReleasedAt || null,
    payoutStatus: o.payoutStatus || '',
    payoutAmount: o.payoutAmount ?? null,
    payoutAt: o.payoutAt || null,
    stripeTransferId: o.stripeTransferId || '',
    paymentReleaseError: o.paymentReleaseError || '',
    reported: !!o.reported,
    trackingNumber: o.trackingNumber || '',
    labelUrl: o.labelUrl || '',
    shipmondoStatus: o.shipmondoStatus || '',
    shipmondoStatusText: o.shipmondoStatusText || '',
    shipmondoStatusAt: o.shipmondoStatusAt || null,
    shipBy: o.shipBy || null,
    pickupBy: o.pickupBy || null,
  };
}
