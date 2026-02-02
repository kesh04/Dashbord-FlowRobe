"use client";

import * as React from 'react';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query } from 'firebase/firestore';
import { functions, firestore } from '@/lib/firebase';
import { LatestOrders, OfferData } from '@/components/dashboard/overview/latest-orders';
import { LatestProducts } from '@/components/dashboard/overview/latest-products';
import { TotalOrders } from '@/components/dashboard/overview/total-orders';
import { TotalUsers } from '@/components/dashboard/overview/total-user';
import { TotalProducts } from '@/components/dashboard/overview/total-products';
import { AverageAuctionPrice } from '@/components/dashboard/overview/average-auction-price';
import { Customer } from '@/components/dashboard/customer/customers-table';
import dayjs from 'dayjs';

export interface Product {
  id: string;
  image: string;
  name: string;
  updatedAt: Date;
  price: string;
}

// Define the expected shape of the product data from the Firebase function
interface ProductResponse {
  id: string;
  images: string[];
  headline: string;
  actiontime: string;
  price: string;
}

const defaultAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkDJfPSHbJNWU--A28PviuwAvceqb72s7HTg&s";

export default function Page(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [averagePrices, setAveragePrices] = useState<{ day: number; week: number; month: number; year: number; allTime: number }>({
    day: 0,
    week: 0,
    month: 0,
    year: 0,
    allTime: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products
        const getProductsFn = httpsCallable<
          { excludeUserId?: string },
          ProductResponse[]
        >(functions, 'getProducts');
        const productsResult = await getProductsFn({});
        const fetchedProducts = (productsResult.data as ProductResponse[]).map((product) => ({
          id: product.id,
          image: product.images?.[0] || '/assets/default-product.png',
          name: product.headline || 'Unnamed Product',
          updatedAt: product.actiontime ? new Date(product.actiontime) : new Date(),
          price: product.price || '0',
        }));
        fetchedProducts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setProducts(fetchedProducts);

        // Fetch orders
        const getOffersFn = httpsCallable(functions, 'getOffers');
        const offersResult = await getOffersFn({});
        const offersData: OfferData[] = (offersResult.data as OfferData[]).map((offer) => ({
          imageUrl: offer.imageUrl || '',
          id: offer.id || '',
          productId: offer.productId || '',
          offerAmount: offer.offerAmount || 0,
          paymentIntentId: offer.paymentIntentId || 'N/A',
          email: offer.email || 'N/A',
          status: ['pending', 'won', 'refunded'].includes(offer.status) ? offer.status : 'pending',
          deliveryOption: ['pickup', 'delivery'].includes(offer.deliveryOption) ? offer.deliveryOption : 'pickup',
          carrier: offer.carrier || 'N/A',
          subscribe: offer.subscribe || false,
          paymentMethod: offer.paymentMethod || 'N/A',
          zipcode: offer.zipcode || 'N/A',
          pickupAddress: offer.pickupAddress || 'N/A',
          country: offer.country || 'N/A',
          name: offer.name || 'N/A',
          phone: offer.phone || 'N/A',
          address: offer.address || 'N/A',
          city: offer.city || 'N/A',
          postalCode: offer.postalCode || 'N/A',
          totalPrice: offer.totalPrice || 0,
          actiontime: offer.actiontime || new Date().toISOString(),
        }));
        offersData.sort((a, b) => new Date(b.actiontime).getTime() - new Date(a.actiontime).getTime());
        setOffers(offersData);

        // Calculate average auction prices
        const now = dayjs();
        const validOrders = offersData.filter((offer) => offer.status === 'won' || offer.status === 'refunded');
        const calculateAverage = (orders: OfferData[]) =>
          orders.length > 0 ? orders.reduce((sum, order) => sum + order.offerAmount, 0) / orders.length : 0;

        setAveragePrices({
          day: calculateAverage(validOrders.filter((order) => dayjs(order.actiontime).isAfter(now.subtract(1, 'day')))),
          week: calculateAverage(validOrders.filter((order) => dayjs(order.actiontime).isAfter(now.subtract(7, 'day')))),
          month: calculateAverage(validOrders.filter((order) => dayjs(order.actiontime).isAfter(now.subtract(30, 'day')))),
          year: calculateAverage(validOrders.filter((order) => dayjs(order.actiontime).isAfter(now.subtract(365, 'day')))),
          allTime: calculateAverage(validOrders),
        });

        // Fetch customers
        const usersQuery = query(collection(firestore, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData: Customer[] = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            avatar: data.profileImage || defaultAvatar,
            name: `${data.fname || ''} ${data.Lname || ''}`.trim() || 'Unknown',
            email: data.email || '',
            address: {
              street: data.address || '',
              city: data.city || '',
              state: data.postcode || 'N/A',
              country: 'Denmark', // Default, adjust if needed
            },
            phone: data.phone || '',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          };
        });
        usersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setCustomers(usersData);

        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <AverageAuctionPrice averages={averagePrices} sx={{ height: '100%' }} trend={'up'} />
          </Grid>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <TotalOrders sx={{ height: '100%' }} value={offers.length} trend={'up'} />
          </Grid>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <TotalUsers sx={{ height: '100%' }} value={customers.length} trend={'up'} />
          </Grid>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <TotalProducts sx={{ height: '100%' }} value={products.length} trend={'up'} />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LatestProducts products={products} sx={{ height: '100%' }} />
          </Grid>
          <Grid size={{ lg: 8, md: 12, xs: 12 }}>
            <LatestOrders orders={offers} sx={{ height: '100%' }} />
          </Grid>
        </Grid>
      )}
    </>
  );
}