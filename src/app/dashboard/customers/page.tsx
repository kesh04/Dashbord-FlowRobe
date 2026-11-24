"use client";

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { adminApi, errorText } from '@/lib/admin-api';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';
import { CustomersTable } from '@/components/dashboard/customer/customers-table';
import type { Customer } from '@/components/dashboard/customer/customers-table';

const defaultAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkDJfPSHbJNWU--A28PviuwAvceqb72s7HTg&s";

export default function Page(): React.JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    adminApi
      .users()
      .then((users) =>
        setCustomers(
          users.map((u) => ({
            id: u.id,
            avatar: u.avatar || defaultAvatar,
            name: u.name,
            email: u.email,
            address: { street: u.address, city: u.city, state: u.postcode || 'N/A', country: 'Denmark' },
            phone: u.phone,
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(0),
            accountTypes: u.accountType,
            swiftBic: u.swiftBic,
            iban: u.iban,
          }))
        )
      )
      .catch((error_) => setError(errorText(error_)))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.address.city.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const paginatedCustomers = filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Customers ({customers.length})</Typography>
      <CustomersFilters
        onSearch={(query) => {
          setSearchQuery(query);
          setPage(0);
        }}
      />
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredCustomers.length === 0 ? (
        <Typography>No users found.</Typography>
      ) : (
        <CustomersTable
          count={filteredCustomers.length}
          page={page}
          rows={paginatedCustomers}
          rowsPerPage={rowsPerPage}
          onPageChange={(_e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number.parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      )}
    </Stack>
  );
}
