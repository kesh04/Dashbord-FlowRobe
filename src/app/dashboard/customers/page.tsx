"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { collection, getDocs, query } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';
import { CustomersTable } from '@/components/dashboard/customer/customers-table';
import type { Customer } from '@/components/dashboard/customer/customers-table';
const defaultAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkDJfPSHbJNWU--A28PviuwAvceqb72s7HTg&s";

export default function Page(): React.JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
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
              country: 'Denmark', 
            },
            phone: data.phone || '',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            accountTypes: data.accountTypes || '',
            swiftBic: data.swiftBic || '',
            iban: data.iban || '',
           
          };
        });
        // Sort users by createdAt in descending order (latest first)
        usersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setCustomers(usersData);
        setFilteredCustomers(usersData);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setPage(0); 
  }, [searchQuery, customers]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedCustomers = filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Customers</Typography>
        </Stack>
      </Stack>
      <CustomersFilters onSearch={(query) => setSearchQuery(query)} />
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredCustomers.length === 0 ? (
        <Typography>No users found.</Typography>
      ) : (
        <CustomersTable
          count={filteredCustomers.length}
          page={page}
          rows={paginatedCustomers}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </Stack>
  );
}