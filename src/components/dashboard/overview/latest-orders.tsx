"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import type { SxProps } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

export interface OfferData {
  imageUrl: string;
  id: string;
  productId: string;
  offerAmount: number;
  paymentIntentId?: string;
  email: string;
  status: 'pending' | 'won' | 'refunded';
  deliveryOption: 'pickup' | 'delivery';
  carrier: string;
  subscribe: boolean;
  paymentMethod: string;
  zipcode?: string;
  pickupAddress?: string;
  country?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  totalPrice?: number;
  actiontime: string;
}

const statusMap = {
  pending: { label: 'Pending', color: 'warning' },
  won: { label: 'Won', color: 'success' },
  refunded: { label: 'Refunded', color: 'error' },
} as const;

export interface LatestOrdersProps {
  orders?: OfferData[];
  sx?: SxProps;
}

export function LatestOrders({ orders = [], sx }: LatestOrdersProps): React.JSX.Element {
  const router = useRouter();
  const limitedOrders = orders.slice(0, 5); // Limit to 8 orders

  return (
    <Card sx={sx}>
      <CardHeader title="Latest Orders" />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell sortDirection="desc">Action Time</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {limitedOrders.map((order) => {
              const { label, color } = statusMap[order.status] ?? { label: 'Pending', color: 'warning' };

              return (
                <TableRow hover key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.name || 'N/A'}</TableCell>
                  <TableCell>{dayjs(order.actiontime).format('MMM D, YYYY')}</TableCell>
                  <TableCell>
                    <Chip color={color} label={label} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          color="inherit"
          endIcon={<ArrowRightIcon fontSize="var(--icon-fontSize-md)" />}
          size="small"
          variant="text"
          onClick={() => router.push('/dashboard/orders')}
        >
          View all
        </Button>
      </CardActions>
    </Card>
  );
}