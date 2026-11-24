"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { httpsCallable } from "firebase/functions";
import { toast } from "react-toastify";

import { functions } from "@/lib/firebase";
import { adminApi, errorText, toTableOffer, type AdminSeller } from "@/lib/admin-api";
import { CustomersFilters } from "@/components/dashboard/customer/customers-filters";
import { SellerSalesTable, type SaleRow } from "@/components/dashboard/sellers/seller-sales-table";

const dkk = (v: number) => v.toLocaleString("da-DK", { style: "currency", currency: "DKK" });

function SummaryCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card sx={{ flex: 1, minWidth: 200 }}>
      <CardContent>
        <Typography color="text.secondary" variant="overline">
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        {sub ? (
          <Typography color="text.secondary" variant="caption">
            {sub}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Page(): React.JSX.Element {
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      setSellers(await adminApi.sellers(force));
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
    const q = search.toLowerCase();
    if (!q) return sellers;
    return sellers.filter((s) => [s.name, s.email, s.phone].some((v) => (v || "").toLowerCase().includes(q)));
  }, [sellers, search]);

  const totals = useMemo(
    () => ({
      earned: sellers.reduce((a, s) => a + s.earned, 0),
      pending: sellers.reduce((a, s) => a + s.pending, 0),
      sales: sellers.reduce((a, s) => a + s.salesCount, 0),
    }),
    [sellers]
  );

  const handleShippingStatusChange = async (offerId: string, newStatus: string) => {
    try {
      await httpsCallable(functions, "updateShippingStatus")({ offerId, shippingStatus: newStatus });
      toast.success(
        newStatus === "delivered" || newStatus === "picked_up"
          ? "Saved – the seller is paid automatically in 7 days."
          : "Shipping status saved."
      );
      load(true);
    } catch (error_) {
      toast.error(`Failed to update shipping status: ${errorText(error_)}`);
    }
  };

  const handleReleasePayment = async (offerId: string) => {
    if (!globalThis.confirm("Pay the seller now? This sends the money from Stripe and cannot be undone.")) return;
    setReleasingId(offerId);
    try {
      await httpsCallable(functions, "adminReleasePayment")({ offerId });
      toast.success("Seller paid.");
      load(true);
    } catch (error_) {
      toast.error(`Payment release failed: ${errorText(error_)}`);
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Sellers ({sellers.length})</Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard title="Paid to sellers" value={dkk(totals.earned)} sub="Money already sent to sellers" />
        <SummaryCard title="Waiting to be paid" value={dkk(totals.pending)} sub="Held until the buyer receives the item" />
        <SummaryCard title="Items sold" value={String(totals.sales)} />
      </Stack>

      <CustomersFilters onSearch={setSearch} />
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell width={48} />
                <TableCell>Seller</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>IBAN</TableCell>
                <TableCell align="right">Items sold</TableCell>
                <TableCell align="right">Total sold</TableCell>
                <TableCell align="right">Earned (paid)</TableCell>
                <TableCell align="right">Waiting</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      {loading ? "Loading…" : "No sellers yet – nothing has been sold."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
              {filtered.map((s) => {
                const isOpen = open === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <TableRow hover sx={{ cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : s.id)}>
                      <TableCell>
                        <IconButton size="small">{isOpen ? <CaretDownIcon /> : <CaretRightIcon />}</IconButton>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar src={s.avatar} sx={{ width: 36, height: 36 }}>
                            {s.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{s.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {s.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{s.phone || "N/A"}</TableCell>
                      <TableCell>{s.iban || "N/A"}</TableCell>
                      <TableCell align="right">{s.salesCount}</TableCell>
                      <TableCell align="right">{dkk(s.totalSold)}</TableCell>
                      <TableCell align="right">
                        <Typography color="success.main" fontWeight={600}>
                          {dkk(s.earned)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color={s.pending > 0 ? "warning.main" : "text.secondary"}>{dkk(s.pending)}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={8} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                        <Collapse in={isOpen} unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "var(--mui-palette-background-level1)" }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Sales by {s.name}
                            </Typography>
                            <SellerSalesTable
                              rows={s.sales.map((o) => toTableOffer(o) as SaleRow)}
                              count={s.sales.length}
                              rowsPerPage={25}
                              onShippingStatusChange={handleShippingStatusChange}
                              onReleasePayment={handleReleasePayment}
                              releasingId={releasingId}
                            />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Stack>
  );
}
