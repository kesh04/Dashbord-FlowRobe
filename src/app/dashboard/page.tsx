"use client";

import * as React from 'react';
import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import { adminApi, errorText, toTableOffer, type AdminOverview } from '@/lib/admin-api';
import { LatestOrders, type OfferData } from '@/components/dashboard/overview/latest-orders';
import { LatestProducts, type Product } from '@/components/dashboard/overview/latest-products';
import { TotalOrders } from '@/components/dashboard/overview/total-orders';
import { TotalUsers } from '@/components/dashboard/overview/total-user';
import { TotalProducts } from '@/components/dashboard/overview/total-products';
import { AverageAuctionPrice } from '@/components/dashboard/overview/average-auction-price';

export default function Page(): React.JSX.Element {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ONE request for the whole overview (counts are aggregated on the server)
    adminApi
      .overview()
      .then(setData)
      .catch((error_) => setError(errorText(error_)));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const products: Product[] = data.latestProducts.map((p) => ({
    id: p.id,
    image: p.image || '/assets/default-product.png',
    name: p.name,
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    price: String(p.price),
  }));

  const orders: OfferData[] = data.latestOrders.map((o) => toTableOffer(o));


  return (
    <Grid container spacing={3}>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <AverageAuctionPrice averages={data.averages} sx={{ height: '100%' }} trend={'up'} />
      </Grid>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <TotalOrders sx={{ height: '100%' }} value={data.counts.orders} trend={'up'} />
      </Grid>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <TotalUsers sx={{ height: '100%' }} value={data.counts.users} trend={'up'} />
      </Grid>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <TotalProducts sx={{ height: '100%' }} value={data.counts.products} trend={'up'} />
      </Grid>
      <Grid size={{ lg: 4, md: 6, xs: 12 }}>
        <LatestProducts products={products} sx={{ height: '100%' }} />
      </Grid>
      <Grid size={{ lg: 8, md: 12, xs: 12 }}>
        <LatestOrders orders={orders} sx={{ height: '100%' }} />
      </Grid>
    </Grid>
  );
}
