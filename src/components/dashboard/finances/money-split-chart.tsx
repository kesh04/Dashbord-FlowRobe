'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';

import { Chart } from '@/components/core/chart';
import type { FinanceMonth } from '@/lib/admin-api';

// Categorical slots 1–3 (validated: CVD ΔE 12.6, normal ΔE 28.1).
// Two slots sit below 3:1 on white → the monthly table below is the relief.
export const SERIES_COLORS = {
  seller: '#257de0',
  shipping: '#f47230',
  serviceFee: '#00b894',
} as const;

const dkk = (v: number) => v.toLocaleString('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 });

function monthLabel(key: string): string {
  const [year = '1970', month = '1'] = key.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

/** Where the buyers' money went, per month: seller / shipping / service fee (stacked). */
export function MoneySplitChart({ months }: { months: FinanceMonth[] }): React.JSX.Element {
  const theme = useTheme();

  const series = [
    { name: 'Paid to sellers', data: months.map((m) => m.sellersEarned) },
    { name: 'Shipping', data: months.map((m) => m.shipping) },
    { name: 'Service fee', data: months.map((m) => m.serviceFees) },
  ];

  const options: ApexOptions = {
    chart: { background: 'transparent', stacked: true, toolbar: { show: false }, fontFamily: 'inherit' },
    colors: [SERIES_COLORS.seller, SERIES_COLORS.shipping, SERIES_COLORS.serviceFee],
    dataLabels: { enabled: false },
    fill: { opacity: 1, type: 'solid' },
    // 2px surface gap between stacked segments
    stroke: { show: true, width: 2, colors: [theme.palette.background.paper] },
    plotOptions: { bar: { columnWidth: '40%', borderRadius: 4, borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last' } },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      labels: { colors: theme.palette.text.primary },
      markers: { size: 6, shape: 'square' },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: theme.palette.mode,
      y: { formatter: (v: number) => dkk(v) },
    },
    theme: { mode: theme.palette.mode },
    xaxis: {
      categories: months.map((m) => monthLabel(m.month)),
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { show: false },
      labels: { style: { colors: theme.palette.text.secondary } },
    },
    yaxis: {
      labels: {
        formatter: (v: number) => dkk(v),
        style: { colors: theme.palette.text.secondary },
      },
    },
  };

  return (
    <Card>
      <CardHeader title="Where the buyers' money went" subheader="Per month – paid to sellers, shipping and service fee" />
      <CardContent>
        {months.length === 0 ? null : <Chart height={340} options={options} series={series} type="bar" width="100%" />}
      </CardContent>
    </Card>
  );
}
