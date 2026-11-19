import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import type { Product } from '@souk/shared';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog, Drawer } from '../../components/ui/Dialogs';
import { SelectField, TextField } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { ApiError } from '../../lib/api';
import { useCategories, useDeleteProduct, useSaveProduct } from '../../lib/queries';

interface Values {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  origin: string;
  images: string;
  featured: boolean;
  isActive: boolean;
}

export function ProductEditor({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const save = useSaveProduct();
  const del = useDeleteProduct();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const { register, handleSubmit, setError, watch, formState: { errors } } = useForm<Values>({
    defaultValues: product
      ? { name: product.name, description: product.description, price: String(product.priceCents / 100), stock: String(product.stock), categoryId: String(product.categoryId), origin: product.origin ?? '', images: product.images.join('\n'), featured: product.featured, isActive: product.isActive }
      : { name: '', description: '', price: '', stock: '0', categoryId: '', origin: '', images: '', featured: false, isActive: true },
  });
  const firstImage = watch('images').split('\n')[0]?.trim();

  const onSubmit = handleSubmit((v) =>
    save.mutate(
      { id: product?.id, body: { ...v, images: v.images.split('\n').map((s) => s.trim()).filter(Boolean) } },
      {
        onSuccess: (p) => { toast(product ? `${p.name} saved.` : `${p.name} added to the shop.`); onClose(); },
        onError: (e) => {
          if (e instanceof ApiError && e.fields) for (const [f, m] of Object.entries(e.fields)) setError(f.split('.')[0] as keyof Values, { message: m });
          else toast(e.message, { tone: 'error' });
        },
      },
    ),
  );

  return (
    <>
      <Drawer
        open
        onOpenChange={(o) => !o && onClose()}
        title={product ? `Edit ${product.name}` : 'Add a product'}
        footer={
          <div className="flex w-full justify-between gap-2">
            {product ? <Button variant="ghost" className="-ml-2 !text-danger hover:!bg-danger-soft" onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden="true" />Remove</Button> : <span />}
            <div className="flex gap-2"><Button onClick={onClose}>Cancel</Button><Button type="submit" form="product-form" variant="primary" loading={save.isPending}>{product ? 'Save product' : 'Add product'}</Button></div>
          </div>
        }
      >
        <form id="product-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <TextField label="Name" error={errors.name?.message} {...register('name')} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="desc" className="text-sm font-medium">Description</label>
            <textarea id="desc" rows={5} className={`rounded-control border bg-surface px-3 py-2 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:text-sm ${errors.description ? 'border-danger' : 'border-rule-strong'}`} {...register('description')} />
            {errors.description && <p role="alert" className="text-sm text-danger">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Price (MAD)" inputMode="decimal" error={errors.price?.message} {...register('price')} />
            <TextField label="In stock" inputMode="numeric" error={errors.stock?.message} {...register('stock')} />
            <SelectField label="Category" error={errors.categoryId?.message} {...register('categoryId')}>
              <option value="" disabled>Choose one</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <TextField label="Made in (town)" error={errors.origin?.message} {...register('origin')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="images" className="text-sm font-medium">Image links, one per line</label>
            <div className="flex gap-3">
              {firstImage && <img src={firstImage} alt="" className="h-20 w-20 shrink-0 rounded-control bg-sunken object-cover" />}
              <textarea id="images" rows={3} placeholder="https://…" className={`tabular w-full rounded-control border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none ${errors.images ? 'border-danger' : 'border-rule-strong'}`} {...register('images')} />
            </div>
            {errors.images ? <p role="alert" className="text-sm text-danger">{errors.images.message}</p> : <p className="text-xs text-ink-muted">The first image is the one shown in the shop grid.</p>}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" {...register('featured')} />Feature on the home page</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" {...register('isActive')} />Show in the shop</label>
        </form>
      </Drawer>
      {product && (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={`Remove ${product.name}?`}
          body="If anyone has ordered it, it’s hidden from the shop instead, so their order history stays complete."
          confirmLabel="Remove product"
          loading={del.isPending}
          onConfirm={() => del.mutate(product.id, {
            onSuccess: (r) => { toast(r.result === 'hidden' ? `${product.name} hidden from the shop (it has orders).` : `${product.name} deleted.`); setConfirm(false); onClose(); },
            onError: (e) => toast(e.message, { tone: 'error' }),
          })}
        />
      )}
    </>
  );
}
