"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { adminApi, errorText, toTableOffer } from "@/lib/admin-api";
import { CustomersFilters } from "@/components/dashboard/customer/customers-filters";
import { OrdersTable, type OfferData } from "@/components/dashboard/orders/ordertable";

export default function Page(): React.JSX.Element {
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    adminApi
      .offers()
      .then((list) => setOffers(list.map((o) => toTableOffer(o))))
      .catch((error_) => setError(errorText(error_)))
      .finally(() => setLoading(false));
  }, []);

  const filteredOffers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return offers;
    return offers.filter((o) =>
      [o.name, o.email, o.phone, o.city, o.orderId, o.productId].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [offers, searchQuery]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Orders ({offers.length})</Typography>
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
      ) : filteredOffers.length === 0 ? (
        <Typography>No orders found.</Typography>
      ) : (
        <OrdersTable
          count={filteredOffers.length}
          page={page}
          rows={filteredOffers}
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
