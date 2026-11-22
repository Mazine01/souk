import type { DocKey, LegalDoc } from './features/legal/documents';

export interface SiteInfo {
  name: string;
  tagline: string;
  product: string;
  owner: string;
  ownerUrl: string;
  /** Set VITE_CONTACT_EMAIL to show an email address; otherwise Contact links to the owner's GitHub. */
  contactEmail?: string;
  demoNotice: string;
  collected: { heading: string; items: string[] }[];
  uses: string[];
  sharing: string[];
  extraRules: string[];
  cookieName: string;
  storage: { key: string; purpose: string }[];
  footerWidth: string;
  columns: { title: string; links: { label: string; to: string }[] }[];
  extraDocs?: Partial<Record<DocKey, LegalDoc>>;
}

const OWNER = { owner: "M'hammed Mazin", ownerUrl: 'https://github.com/Mazine01', contactEmail: import.meta.env.VITE_CONTACT_EMAIL as string | undefined };

export const SITE: SiteInfo = {
  ...OWNER,
  name: 'Souk',
  tagline: 'Handmade ceramics, rugs, lanterns and leather from Moroccan workshops, paid in cash on delivery.',
  product: 'an online shop for handmade Moroccan crafts',
  demoNotice: 'Souk is a demonstration store: orders placed here are not fulfilled, no goods are shipped and no payment is ever taken.',
  collected: [
    { heading: 'Your account:', items: ['name and email', 'a hashed password'] },
    { heading: 'When you order:', items: ['delivery name, phone number and address', 'the items, prices and any note you add'] },
    { heading: 'Payment:', items: ['nothing. Orders are paid in cash on delivery, so we never ask for or store card details.'] },
  ],
  uses: ['to sign you in and keep your basket between visits', 'to take, prepare and track your orders', 'to call you before delivery'],
  sharing: ['Shop staff see orders and delivery details so they can pack and dispatch them.', 'A delivery courier receives the name, phone number and address for your parcel.'],
  extraRules: ['place orders you don’t intend to receive and pay for.'],
  cookieName: 'souk_session',
  storage: [{ key: 'souk_cart_v1', purpose: 'keeps your basket while you are signed out' }],
  footerWidth: 'max-w-[1240px]',
  columns: [
    {
      title: 'Shop',
      links: [
        { label: 'Everything', to: '/shop' },
        { label: 'Ceramics', to: '/shop?category=ceramics' },
        { label: 'Rugs & textiles', to: '/shop?category=rugs' },
        { label: 'Lighting', to: '/shop?category=lighting' },
      ],
    },
    { title: 'Help', links: [{ label: 'Delivery & returns', to: '/delivery-returns' }, { label: 'Track an order', to: '/orders' }, { label: 'Your account', to: '/login' }] },
  ],
  extraDocs: {
    delivery: {
      title: 'Delivery & Returns',
      summary: 'Delivery anywhere in Morocco, paid in cash when your parcel arrives.',
      sections: [
        { heading: 'Delivery', body: [['Delivery takes 2 to 5 working days.', 'It’s free on orders of 800 MAD or more, and 45 MAD otherwise.', 'The courier calls the number on your order before arriving.']] },
        { heading: 'Paying', body: ['You pay the courier in cash when the parcel is in your hands. Please have the exact amount ready if you can.'] },
        { heading: 'Cancelling', body: ['You can cancel from your order page until we start packing it. After that, contact us and we’ll do our best.'] },
        { heading: 'Returns', body: ['If something arrives damaged or isn’t what you ordered, contact us within 14 days of delivery with your order number and a photo. Handmade pieces vary slightly in colour and pattern; that isn’t a fault.'] },
        { heading: 'This is a demonstration store', body: ['Orders on this site are never fulfilled, shipped or charged.'] },
      ],
    },
  },
};
