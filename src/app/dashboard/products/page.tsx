"use client";

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import dayjs from 'dayjs';

import { adminApi, errorText, type AdminProduct } from '@/lib/admin-api';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';

const statusColor: Record<string, 'success' | 'warning' | 'default' | 'error' | 'info'> = {
  active: 'success',
  ended: 'default',
  sold: 'info',
  cancelled: 'error',
  payment_failed: 'error',
  deleted: 'error',
};

export default function ProductsPage(): React.JSX.Element {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // all products + seller details in ONE request (was: getProducts({userId:'admin'}) → always empty)
    adminApi
      .products()
      .then(setProducts)
      .catch((error_) => setError(errorText(error_)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.headline.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const rows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Stack spacing={3}>
      <CustomersFilters
        onSearch={(query) => {
          setSearchQuery(query);
          setPage(0);
        }}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <CardHeader title={`All Products (${products.length})`} />
        <Divider />
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product Id</TableCell>
                <TableCell>Image</TableCell>
                <TableCell>Headline</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Current bid</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Close Date</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Postcode</TableCell>
                <TableCell>Swift BIC</TableCell>
                <TableCell>IBAN</TableCell>
                <TableCell>Account Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} align="center">Loading...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center">No products found.</TableCell>
                </TableRow>
              ) : (
                rows.map((product) => (
                  <TableRow hover key={product.id}>
                    <TableCell>{product.productId}</TableCell>
                    <TableCell>
                      {product.images[0] ? (
                        <Box
                          component="img"
                          src={product.images[0]}
                          loading="lazy"
                          sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
                        />
                      ) : null}
                    </TableCell>
                    <TableCell>{product.headline}</TableCell>
                    <TableCell>{product.displayName}</TableCell>
                    <TableCell>{product.price} DKK</TableCell>
                    <TableCell>{product.currentBid == null ? '-' : `${product.currentBid} DKK`}</TableCell>
                    <TableCell>
                      <Chip size="small" label={product.status} color={statusColor[product.status] ?? 'default'} />
                    </TableCell>
                    <TableCell>{product.actiontime ? dayjs(product.actiontime).format('MMM D, YYYY HH:mm') : '-'}</TableCell>
                    <TableCell>{product.city}</TableCell>
                    <TableCell>{product.postcode}</TableCell>
                    <TableCell>{product.swiftBic}</TableCell>
                    <TableCell>{product.iban}</TableCell>
                    <TableCell>{product.accountType}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
        <Divider />
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number.parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>
    </Stack>
  );
}
