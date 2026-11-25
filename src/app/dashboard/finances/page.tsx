'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

import { adminApi, errorText, type AdminFinances, type FinanceRange } from '@/lib/admin-api';
import { MoneySplitChart, SERIES_COLORS } from '@/components/dashboard/finances/money-split-chart';

const dkk = (v: number) => v.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });

const RANGES: { value: FinanceRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

function StatCard({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  color?: string;
}): React.JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          {color ? <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} /> : null}
          <Typography color="text.secondary" variant="overline">
            {title}
          </Typography>
        </Stack>
        <Typography variant="h4" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {sub ? (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            {sub}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Page(): React.JSX.Element {
  const [range, setRange] = useState<FinanceRange>('30d');
  const [data, setData] = useState<AdminFinances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: FinanceRange, force = false) => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.finances(r, force));
    } catch (error_) {
      setError(errorText(error_));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [load, range]);

  const t = data?.totals;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Typography variant="h4">Finances</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={range}
            onChange={(_e, v: FinanceRange | null) => {
              if (v) setRange(v);
            }}
          >
            {RANGES.map((r) => (
              <ToggleButton key={r.value} value={r.value}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Button size="small" onClick={() => load(range, true)} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading && !data ? <Typography color="text.secondary">Loading…</Typography> : null}

      {t ? (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard title="Buyers paid" value={dkk(t.buyersPaid)} sub={`${t.orders} paid orders`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Sellers earned"
                color={SERIES_COLORS.seller}
                value={dkk(t.sellersEarned)}
                sub={`${dkk(t.sellersPaidOut)} paid out · ${dkk(t.sellersPending)} waiting`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard title="Shipping" color={SERIES_COLORS.shipping} value={dkk(t.shipping)} sub="Paid on to Shipmondo" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Service fees"
                color={SERIES_COLORS.serviceFee}
                value={dkk(t.serviceFees)}
                sub="2% + 10 DKK per order"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Stripe fees"
                value={dkk(t.stripeFees)}
                sub={t.stripeFeesEstimated > 0 ? `${t.stripeFeesEstimated} orders estimated – press Refresh` : 'Taken from Stripe'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard title="FlowRobe earned (net)" value={dkk(t.flowrobeNet)} sub="Service fees − Stripe fees" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Refunded"
                value={dkk(data?.refunds.amount ?? 0)}
                sub={`${data?.refunds.orders ?? 0} cancelled / refunded orders`}
              />
            </Grid>
          </Grid>

          <MoneySplitChart months={data?.monthly ?? []} />

          {/* table view of the chart (also the accessible version) */}
          <Card>
            <CardHeader title="Per month" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Buyers paid</TableCell>
                    <TableCell align="right">Sellers earned</TableCell>
                    <TableCell align="right">Shipping</TableCell>
                    <TableCell align="right">Service fees</TableCell>
                    <TableCell align="right">Stripe fees</TableCell>
                    <TableCell align="right">FlowRobe net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.monthly ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No paid orders in this period.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {[...(data?.monthly ?? [])].reverse().map((m) => (
                    <TableRow key={m.month} hover>
                      <TableCell>{dayjs(`${m.month}-01`).format('MMMM YYYY')}</TableCell>
                      <TableCell align="right">{m.orders}</TableCell>
                      <TableCell align="right">{dkk(m.buyersPaid)}</TableCell>
                      <TableCell align="right">{dkk(m.sellersEarned)}</TableCell>
                      <TableCell align="right">{dkk(m.shipping)}</TableCell>
                      <TableCell align="right">{dkk(m.serviceFees)}</TableCell>
                      <TableCell align="right">{dkk(m.stripeFees)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {dkk(m.flowrobeNet)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>

          <Card>
            <CardHeader title="Orders" subheader="Every paid order and how its money was split (latest 500)" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell>Delivery</TableCell>
                    <TableCell align="right">Buyer paid</TableCell>
                    <TableCell align="right">Seller</TableCell>
                    <TableCell align="right">Shipping</TableCell>
                    <TableCell align="right">Service fee</TableCell>
                    <TableCell align="right">Stripe fee</TableCell>
                    <TableCell align="right">Net</TableCell>
                    <TableCell>Seller paid?</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.orders ?? []).map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell>{dayjs(o.date).format('MMM D, YYYY')}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{o.headline || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.orderId}
                        </Typography>
                      </TableCell>
                      <TableCell>{o.buyer || '—'}</TableCell>
                      <TableCell>{o.seller || '—'}</TableCell>
                      <TableCell>{o.delivery}</TableCell>
                      <TableCell align="right">{dkk(o.buyerPaid)}</TableCell>
                      <TableCell align="right">{dkk(o.sellerEarned)}</TableCell>
                      <TableCell align="right">{dkk(o.shipping)}</TableCell>
                      <TableCell align="right">{dkk(o.serviceFee)}</TableCell>
                      <TableCell align="right">
                        {o.stripeFeeEstimated ? (
                          <Tooltip title="Estimated – the real fee is loaded from Stripe on the next refresh">
                            <span>≈ {dkk(o.stripeFee)}</span>
                          </Tooltip>
                        ) : (
                          dkk(o.stripeFee)
                        )}
                      </TableCell>
                      <TableCell align="right">{dkk(o.flowrobeNet)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={o.sellerPaid ? 'success' : 'warning'}
                          label={o.sellerPaid ? '✓ Paid' : 'Waiting'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </>
      ) : null}
    </Stack>
  );
}
