"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

/** One auction winner (the buyer whose bid won the product). */
export interface OfferData {
  id: string;
  orderId: string;
  productId: string;
  headline?: string;
  imageUrl: string;
  offerAmount: number;
  totalPrice?: number;
  name?: string;
  email: string;
  phone?: string;
  deliveryOption: 'pickup' | 'delivery';
  carrier: string;
  address?: string;
  city?: string;
  postalCode?: string;
  zipcode?: string;
  pickupAddress?: string;
  sellerName?: string;
  actiontime: string;
  wonAt?: string | null;
}

const dkk = (v: number) => v.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });

function deliveryText(row: OfferData) {
  if (/seller\s*direct/i.test(row.carrier || '')) return 'Pickup from seller';
  return row.deliveryOption === 'delivery' ? 'DAO home delivery' : 'DAO shop';
}

interface Props {
  count?: number;
  page?: number;
  rows?: OfferData[];
  rowsPerPage?: number;
  loading?: boolean;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WonItemTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  loading = false,
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
}: Props): React.JSX.Element {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.wonAt || b.actiontime).getTime() - new Date(a.wonAt || a.actiontime).getTime()
  );
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '1000px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Winner</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Delivery</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Winning bid</TableCell>
              <TableCell>Total paid</TableCell>
              <TableCell>Seller</TableCell>
              <TableCell>Won on</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading…' : 'No winners yet – nobody has won a product.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
            {paginated.map((row) => (
              <TableRow hover key={row.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {row.imageUrl ? (
                      <Box
                        component="img"
                        src={row.imageUrl}
                        alt={row.headline || 'Product'}
                        sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <Box sx={{ width: 48, height: 48, borderRadius: 1, flexShrink: 0, backgroundColor: 'var(--mui-palette-neutral-200)' }} />
                    )}
                    <Box>
                      <Typography variant="body2">{row.headline || row.productId}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Order {row.orderId}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{row.name || 'N/A'}</TableCell>
                <TableCell>{row.email || 'N/A'}</TableCell>
                <TableCell>{row.phone || 'N/A'}</TableCell>
                <TableCell>{deliveryText(row)}</TableCell>
                <TableCell>
                  {row.deliveryOption === 'delivery'
                    ? [row.address, row.postalCode, row.city].filter((v) => v && v !== 'N/A').join(', ') || 'N/A'
                    : [row.pickupAddress, row.zipcode].filter((v) => v && v !== 'N/A').join(', ') || 'N/A'}
                </TableCell>
                <TableCell>{dkk(row.offerAmount)}</TableCell>
                <TableCell>{dkk(row.totalPrice ?? 0)}</TableCell>
                <TableCell>{row.sellerName || 'N/A'}</TableCell>
                <TableCell>{dayjs(row.wonAt || row.actiontime).format('MMM D, YYYY HH:mm')}</TableCell>
              </TableRow>
            ))}
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