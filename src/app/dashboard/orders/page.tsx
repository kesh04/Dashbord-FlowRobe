"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { CustomersFilters } from "@/components/dashboard/customer/customers-filters";
import { OrdersTable, type OfferData } from "@/components/dashboard/orders/ordertable";

export default function Page(): React.JSX.Element {
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<OfferData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const getOffers = httpsCallable(functions, "getOffers");
        const result = await getOffers({});
        const offersData: OfferData[] = (result.data as OfferData[]).map((offer) => ({
          ...offer,
          actiontime: offer.actiontime || new Date().toISOString(),
          status: ['pending', 'won', 'refunded'].includes(offer.status) ? offer.status : 'pending',
          offerAmount: offer.offerAmount || 0,
          name: offer.name || 'N/A',
          email: offer.email || 'N/A',
          phone: offer.phone || 'N/A',
          zipcode: offer.zipcode || 'N/A',
          pickupAddress: offer.pickupAddress || 'N/A',
          address: offer.address || 'N/A',
          city: offer.city || 'N/A',
          postalCode: offer.postalCode || 'N/A',
          totalPrice: offer.totalPrice || 0,
          imageUrl: offer.imageUrl || '',
          productId: offer.productId || '',
          paymentIntentId: offer.paymentIntentId || 'N/A',
          carrier: offer.carrier || 'N/A',
          paymentMethod: offer.paymentMethod || 'N/A',
          deliveryOption: ['pickup', 'delivery'].includes(offer.deliveryOption) ? offer.deliveryOption : 'pickup',
          subscribe: offer.subscribe || false,
          sellerName:offer.sellerName,

        }));
        // Sort offers by actiontime (newest first)
        offersData.sort((a, b) => new Date(b.actiontime).getTime() - new Date(a.actiontime).getTime());
        setOffers(offersData);
        setFilteredOffers(offersData);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [router]);

  useEffect(() => {
    const filtered = offers.filter(
      (offer) =>
        (offer.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (offer.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (offer.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (offer.city || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOffers(filtered);
    setPage(0);
  }, [searchQuery, offers]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: "1 1 auto" }}>
          <Typography variant="h4">Orders</Typography>
        </Stack>
      </Stack>
      <CustomersFilters onSearch={(query) => setSearchQuery(query)} />
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredOffers.length === 0 ? (
        <Typography>No orders found.</Typography>
      ) : (
        <OrdersTable
          count={filteredOffers.length}
          page={page}
          rows={filteredOffers}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </Stack>
  );
}