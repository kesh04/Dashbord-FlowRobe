"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { adminApi, errorText, type AdminOffer } from "@/lib/admin-api";
import { CustomersFilters } from "@/components/dashboard/customer/customers-filters";
import { WonItemTable, type OfferData } from "@/components/dashboard/won/won-item-table";

function toWinner(o: AdminOffer): OfferData {
  return {
    id: o.id,
    orderId: o.orderId || o.id,
    productId: o.productId,
    headline: o.headline,
    imageUrl: o.imageUrl,
    offerAmount: o.offerAmount,
    totalPrice: o.totalPrice,
    name: o.name,
    email: o.email,
    phone: o.phone,
    deliveryOption: o.deliveryOption === "delivery" ? "delivery" : "pickup",
    carrier: o.carrier,
    address: o.address,
    city: o.city,
    postalCode: o.postalCode,
    zipcode: o.zipcode,
    pickupAddress: o.pickupAddress,
    sellerName: o.sellerName,
    actiontime: o.actiontime || o.createdAt || new Date(0).toISOString(),
    wonAt: o.wonAt,
  };
}

export default function Page(): React.JSX.Element {
  const [winners, setWinners] = useState<OfferData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      // only offers whose bid won the auction
      const list = await adminApi.offers("won", force);
      setWinners(list.map((o) => toWinner(o)));
    } catch (error_) {
      setError(errorText(error_));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return winners;
    return winners.filter((o) =>
      [o.name, o.email, o.phone, o.city, o.orderId, o.headline, o.sellerName].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [winners, searchQuery]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Won ({winners.length})</Typography>
      <CustomersFilters
        onSearch={(query) => {
          setSearchQuery(query);
          setPage(0);
        }}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <WonItemTable
        count={filtered.length}
        page={page}
        rows={filtered}
        rowsPerPage={rowsPerPage}
        loading={loading}
        onPageChange={(_e, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number.parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Stack>
  );
}
