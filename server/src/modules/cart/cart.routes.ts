import { Router } from 'express';
import { z } from 'zod';
import { cartItemsSchema, cartLineSchema } from '@souk/shared';
import { requireAuth, userId } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getCart, mergeCart, priceLines, setQuantity } from './cart.service.js';

export const cartRouter = Router();

/** Public: prices a guest cart held in the browser. Nothing is stored. */
cartRouter.post('/preview', validate(cartItemsSchema), async (_req, res) => {
  res.json({ data: await priceLines(res.locals.body.items) });
});

cartRouter.get('/', requireAuth, async (_req, res) => {
  res.json({ data: await getCart(userId(res)) });
});

cartRouter.put(
  '/items/:productId',
  requireAuth,
  validate(z.object({ productId: z.coerce.number().int().positive() }), 'params'),
  validate(cartLineSchema.pick({ quantity: true })),
  async (_req, res) => {
    await setQuantity(userId(res), res.locals.params.productId, res.locals.body.quantity);
    res.json({ data: await getCart(userId(res)) });
  },
);

cartRouter.post('/merge', requireAuth, validate(cartItemsSchema), async (_req, res) => {
  await mergeCart(userId(res), res.locals.body.items);
  res.json({ data: await getCart(userId(res)) });
});
