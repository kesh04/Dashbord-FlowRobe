"use client";

import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import dayjs from 'dayjs';

export interface Product {
  id: string;
  productId: string;
  userId: string;
  images: string[];
  price: number;
  headline: string;
  actiontime: any;
  city: string;
  postcode: string;
  displayName: string;
  iban: string;
  swiftBic: string;
  accountType: string;
}

export default function ProductsPage(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const getProductsFn = httpsCallable(functions, 'getProducts');

        // ✅ THIS IS THE FIX
        const result = await getProductsFn({
          userId: 'admin' // any string works
        });

        const fetchedProducts = (result.data as Product[]).map((product) => ({
          ...product,
          actiontime: product.actiontime,
        }));

        setProducts(fetchedProducts);
        setError(null);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
   console.log(products);
   
  return (
    <Card>
      <CardHeader title="All Products" />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Product Id</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Headline</TableCell>
              <TableCell>User Name</TableCell>
              <TableCell>Price</TableCell>
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
                <TableCell colSpan={11} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.productId}</TableCell>
                  <TableCell>
                    {product.images?.[0] ? (
                      <Box
                        component="img"
                        src={product.images[0]}
                        sx={{ width: 48, height: 48 }}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>{product.headline}</TableCell>
                  <TableCell>{product.displayName}</TableCell>
                  <TableCell>{product.price} DKK</TableCell>
                  <TableCell>
                    {dayjs(product.actiontime).format('MMM D, YYYY')}
                  </TableCell>
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
    </Card>
  );
}
