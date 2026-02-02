"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { CustomersFilters } from "@/components/dashboard/customer/customers-filters";
import { WonItemTable, type OfferData } from "@/components/dashboard/won/WonItemTable";

export default function Page(): React.JSX.Element {
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<OfferData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const router = useRouter();

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const getOffers = httpsCallable(functions, "getOffers");
      const result = await getOffers({});
      const offersData: OfferData[] = (result.data as any[]).map((offer: any) => ({
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
        sellerName: offer.sellerName || 'N/A',
        shippingStatus: offer.shippingStatus || "waiting", // ← IMPORTANT
      }));

      offersData.sort((a, b) => new Date(b.actiontime).getTime() - new Date(a.actiontime).getTime());
      setOffers(offersData);
    } catch (err) {
      console.error(err);
      setError("Failed to load won orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [router]);

  useEffect(() => {
    const filtered = offers.filter(
      (offer) =>
        offer.status === 'won' &&
        (
          (offer.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (offer.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (offer.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (offer.city || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    setFilteredOffers(filtered);
    setPage(0);
  }, [searchQuery, offers]);

  const handleShippingStatusChange = async (offerId: string, newStatus: string) => {
    // Optimistic update
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, shippingStatus: newStatus } : o));

    try {
      const updateShippingStatus = httpsCallable(functions, "updateShippingStatus");
      await updateShippingStatus({ offerId, shippingStatus: newStatus });
    } catch (err) {
      console.error("Failed to update shipping status", err);
      alert("Failed to update shipping status – changes reverted");
      await fetchOffers(); // Re-fetch to revert on error
    }
  };

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
          <Typography variant="h4">Won Orders</Typography>
        </Stack>
      </Stack>
      <CustomersFilters onSearch={(query) => setSearchQuery(query)} />
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredOffers.length === 0 ? (
        <Typography>No won orders found.</Typography>
      ) : (
        <WonItemTable
          count={filteredOffers.length}
          page={page}
          rows={filteredOffers}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onShippingStatusChange={handleShippingStatusChange}
        />
      )}
    </Stack>
  );
}