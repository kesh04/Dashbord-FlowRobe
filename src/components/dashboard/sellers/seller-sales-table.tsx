"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export interface SaleRow {
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
  orderId: string;
  sellerName?: string;
  shippingStatus: string;
  tradeConfirmed?: boolean;
  paymentReleased?: boolean;
  paymentReleaseAt?: string | null;
  paymentReleasedAt?: string | null;
  payoutStatus?: string;
  payoutAmount?: number | null;
  payoutAt?: string | null;
  stripeTransferId?: string;
  paymentReleaseError?: string;
  reported?: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  shipmondoStatus?: string;
  shipmondoStatusText?: string;
  shipmondoStatusAt?: string | null;
  shipBy?: string | null;
  pickupBy?: string | null;
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const fmtDate = (v?: string | null) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '');
const dkk = (v: number) => v.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });
const isSellerDirect = (row: SaleRow) => /seller\s*direct/i.test(row.carrier || '');

/** Did the buyer get the item? */
function buyerStatus(row: SaleRow): { label: string; color: ChipColor; detail?: string } {
  if (isSellerDirect(row)) {
    return row.tradeConfirmed
      ? { label: '✓ Picked up from seller', color: 'success', detail: 'Buyer pressed ✓' }
      : { label: 'Not picked up yet', color: 'warning', detail: row.pickupBy ? `Pick up by ${fmtDate(row.pickupBy)}` : 'Waiting for buyer ✓' };
  }
  const tracking = row.shipmondoStatusText
    ? `${row.shipmondoStatusText}${row.shipmondoStatusAt ? ` · ${fmtDate(row.shipmondoStatusAt)}` : ''}`
    : undefined;
  switch (row.shippingStatus) {
    case 'delivered': {
      return { label: '✓ Delivered to home', color: 'success', detail: tracking };
    }
    case 'picked_up': {
      return { label: '✓ Picked up at DAO shop', color: 'success', detail: tracking };
    }
    case 'ready_for_pickup': {
      return { label: 'In DAO shop – not collected', color: 'info', detail: tracking };
    }
    case 'shipped': {
      return { label: 'On the way', color: 'info', detail: tracking };
    }
    default: {
      return {
        label: 'Not shipped yet',
        color: 'warning',
        detail: row.shipBy ? `Seller must ship by ${fmtDate(row.shipBy)}` : tracking,
      };
    }
  }
}

/** Has the seller been paid? */
function sellerPayment(row: SaleRow): { label: string; color: ChipColor; detail?: string } {
  if (row.status === 'refunded' || row.status === 'cancelled') {
    return { label: 'Not paid – refunded to buyer', color: 'error' };
  }
  if (row.paymentReleased) {
    const when = fmtDate(row.paymentReleasedAt);
    const p = (row.payoutStatus || '').toLowerCase();
    if (p.includes('fail') || p.includes('retry')) {
      return { label: 'Sent to Stripe – bank payout retrying', color: 'warning', detail: when };
    }
    if (p === 'paid') return { label: '✓ Paid to seller bank', color: 'success', detail: fmtDate(row.payoutAt) || when };
    return {
      label: '✓ Paid (transfer sent)',
      color: 'success',
      detail: [when, row.payoutAmount == null ? '' : dkk(row.payoutAmount), p ? `payout: ${p}` : '']
        .filter(Boolean)
        .join(' · '),
    };
  }
  if (row.paymentReleaseError) return { label: 'Release failed', color: 'error', detail: row.paymentReleaseError };
  if (row.reported) return { label: 'On hold – reported', color: 'error' };
  if (row.paymentReleaseAt) {
    return { label: 'Scheduled', color: 'info', detail: `Paid automatically ${fmtDate(row.paymentReleaseAt)}` };
  }
  return {
    label: 'Held by FlowRobe',
    color: 'default',
    detail: isSellerDirect(row) ? 'Paid when buyer presses ✓' : 'Paid 7 days after delivery',
  };
}

function StatusCell({ s }: { s: { label: string; color: ChipColor; detail?: string } }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 170 }}>
      <Chip color={s.color} label={s.label} size="small" sx={{ alignSelf: 'flex-start' }} />
      {s.detail ? (
        <Typography variant="caption" color="text.secondary">
          {s.detail}
        </Typography>
      ) : null}
    </Stack>
  );
}

interface OrdersTableProps {
  count?: number;
  page?: number;
  rows?: SaleRow[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShippingStatusChange?: (offerId: string, newStatus: string) => void;
  onReleasePayment?: (offerId: string) => void;
  releasingId?: string | null;
  loading?: boolean;
}

export function SellerSalesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  onShippingStatusChange,
  onReleasePayment,
  releasingId,
  loading = false,
}: OrdersTableProps): React.JSX.Element {
  const sortedRows = [...rows].sort((a, b) => new Date(b.actiontime).getTime() - new Date(a.actiontime).getTime());
  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: '1100px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Buyer</TableCell>
              <TableCell>Delivery</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Buyer received?</TableCell>
              <TableCell>Seller paid?</TableCell>
              <TableCell>Shipping status (manual)</TableCell>
              <TableCell>Sold</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">{loading ? 'Loading…' : 'No sales yet.'}</Typography>
                </TableCell>
              </TableRow>
            ) : null}
            {paginatedRows.map((row) => {
              const canRelease = row.status === 'won' && !row.paymentReleased && !!onReleasePayment;
              return (
                <TableRow hover key={row.id}>
                  <TableCell>
                    <Typography variant="body2">{row.orderId}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.productId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.imageUrl ? (
                      <Box
                        component="img"
                        src={row.imageUrl}
                        alt={row.name || 'Order'}
                        sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ width: 48, height: 48, borderRadius: 1, backgroundColor: 'var(--mui-palette-neutral-200)' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.name || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {row.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.phone || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {isSellerDirect(row) ? 'Pickup from seller' : row.deliveryOption === 'delivery' ? 'DAO home' : 'DAO shop'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {row.deliveryOption === 'delivery'
                        ? `${row.address || ''} ${row.postalCode || ''}`
                        : `${row.pickupAddress || ''} ${row.zipcode || ''}`}
                    </Typography>
                    {row.trackingNumber ? (
                      <Typography variant="caption" display="block">
                        Tracking: {row.trackingNumber}
                      </Typography>
                    ) : null}
                    {row.labelUrl ? (
                      <Link href={row.labelUrl} target="_blank" rel="noopener" variant="caption">
                        Label
                      </Link>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{dkk(row.offerAmount)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total {dkk(row.totalPrice ?? 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusCell s={buyerStatus(row)} />
                  </TableCell>
                  <TableCell>
                    <StatusCell s={sellerPayment(row)} />
                    {canRelease ? (
                      <Tooltip title="Pay the seller now (skips the waiting time)">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                            disabled={releasingId === row.id}
                            onClick={() => onReleasePayment?.(row.id)}
                          >
                            {releasingId === row.id ? 'Paying…' : 'Pay seller now'}
                          </Button>
                        </span>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {isSellerDirect(row) ? (
                      <Typography variant="caption" color="text.secondary">
                        Buyer confirms with ✓
                      </Typography>
                    ) : (
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select
                          value={row.shippingStatus || 'waiting'}
                          onChange={(e) => onShippingStatusChange?.(row.id, e.target.value as string)}
                        >
                          <MenuItem value="waiting">Wait</MenuItem>
                          <MenuItem value="shipped">Delivered for shipping</MenuItem>
                          <MenuItem value="ready_for_pickup">Ready for pickup</MenuItem>
                          <MenuItem value="delivered">Delivered (home)</MenuItem>
                          <MenuItem value="picked_up">Picked up (DAO shop)</MenuItem>
                        </Select>
                      </FormControl>
                    )}
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