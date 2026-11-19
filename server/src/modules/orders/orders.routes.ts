import { Router } from 'express';
import { z } from 'zod';
import { checkoutSchema } from '@souk/shared';
import { userId } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { changeStatus, checkout, getOrder, listOrders } from './orders.service.js';

export const ordersRouter = Router();
const idParams = z.object({ id: z.coerce.number().int().positive() });

// The body carries an address and a note only. No price, total or item list is ever read from it.
ordersRouter.post('/checkout', validate(checkoutSchema), async (_req, res) => {
  const { address, note, saveAddress } = res.locals.body;
  res.status(201).json({ data: await checkout(userId(res), address, note, saveAddress) });
});

ordersRouter.get('/orders', async (_req, res) => {
  res.json({ data: await listOrders(userId(res)) });
});

ordersRouter.get('/orders/:id', validate(idParams, 'params'), async (_req, res) => {
  res.json({ data: await getOrder(res.locals.params.id, { userId: userId(res) }) });
});

ordersRouter.post('/orders/:id/cancel', validate(idParams, 'params'), async (_req, res) => {
  res.json({ data: await changeStatus(res.locals.params.id, 'CANCELLED', { customerId: userId(res) }) });
});
