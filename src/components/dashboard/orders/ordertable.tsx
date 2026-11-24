"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";

import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { useSelection } from "@/hooks/use-selection";
import dayjs from "dayjs";

export interface OfferData {
  imageUrl: string;
  id: string;
  productId: string;
  offerAmount: number;
  paymentIntentId?: string;
  email: string;
  status: 'pending' | 'won' | 'refunded' | 'lost' | 'outbid' | 'cancelled' | 'payment_failed';
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
  orderId:string;
  sellerName?:string

}

const statusMap = {
  pending: { label: 'Pending', color: 'warning' },
  won: { label: 'Won', color: 'success' },
  refunded: { label: 'Refunded', color: 'error' },
  lost: { label: 'Lost', color: 'default' },
  outbid: { label: 'Outbid', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'error' },
  payment_failed: { label: 'Payment failed', color: 'error' },
} as const;

interface OrdersTableProps {
  count?: number;
  page?: number;
  rows?: OfferData[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function OrdersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
}: OrdersTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => {
    return rows.map((offer) => offer.id);
  }, [rows]);

  const {  selected } = useSelection(rowIds);



  // Sort rows: 'won' status first, then by actiontime (newest first)
  const sortedRows = [...rows].sort((a, b) => {
    if (a.status === 'won' && b.status !== 'won') return -1;
    if (a.status !== 'won' && b.status === 'won') return 1;
    return new Date(b.actiontime).getTime() - new Date(a.actiontime).getTime();
  });

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              {/* <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (event.target.checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                />
              </TableCell> */}
            
              <TableCell>SN</TableCell>
            
              <TableCell>Order ID</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Delivery Option</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Zipcode</TableCell>
              <TableCell>Product ID</TableCell>
              <TableCell>Offer Amount</TableCell>
              <TableCell>Payment Intent ID</TableCell>
              <TableCell>Total Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => {
              const isSelected = selected?.has(row.id);
              const { label, color } = statusMap[row.status] ?? {
                label: 'Pending',
                color: 'warning',
              };

              return (
                <TableRow hover key={row.id} selected={isSelected}>
                  {/* <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          selectOne(row.id);
                        } else {
                          deselectOne(row.id);
                        }
                      }}
                    />
                  </TableCell> */}
                 
                  <TableCell>{row.sellerName}</TableCell>
                  <TableCell>{row.orderId}</TableCell>
                  <TableCell>
                    {row.imageUrl ? (
                      <Box
                        component="img"
                        src={row.imageUrl}
                        alt={row.name || 'Order'}
                        sx={{ width: 48, height: 48, borderRadius: 1 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          backgroundColor: 'var(--mui-palette-neutral-200)',
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{row.name || 'N/A'}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone || 'N/A'}</TableCell>
                  <TableCell>{row.deliveryOption}</TableCell>
                  <TableCell>
                    {row.deliveryOption === 'delivery' ? row.address || 'N/A' : row.pickupAddress || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {row.deliveryOption === 'delivery' ? row.postalCode || 'N/A' : row.zipcode || 'N/A'}
                  </TableCell>
                  <TableCell>{row.productId}</TableCell>
                  <TableCell>
                    {row.offerAmount.toLocaleString('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{row.paymentIntentId || 'N/A'}</TableCell>
                  <TableCell>
                    {(row.totalPrice ?? 0).toLocaleString('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Chip color={color} label={label} size="small" />
                  </TableCell>
                  <TableCell>{dayjs(row.actiontime).format('MMM D, YYYY')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <TablePagination
        component="div"
        count={count}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
}