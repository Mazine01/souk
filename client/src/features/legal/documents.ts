import type { SiteInfo } from '../../site';

export type DocKey = 'privacy' | 'terms' | 'cookies' | 'delivery';
export type Block = string | string[];
export interface LegalDoc {
  title: string;
  summary: string;
  sections: { heading: string; body: Block[] }[];
}

export const LAST_UPDATED = '20 November 2026';

export const DOC_PATHS: Record<DocKey, string> = {
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  delivery: '/delivery-returns',
};

export function documents(s: SiteInfo): Partial<Record<DocKey, LegalDoc>> {
  const contact = s.contactEmail ? `email ${s.contactEmail}` : `contact the maintainer through ${s.ownerUrl.replace('https://', '')}`;
  return {
    privacy: {
      title: 'Privacy Policy',
      summary: `This policy explains what ${s.name} collects, why, and the choices you have. In short: we collect only what the service needs to work, we don’t sell or share it for advertising, and we don’t use tracking or analytics tools.`,
      sections: [
        { heading: 'Who we are', body: [`${s.name} is ${s.product}, built and maintained by ${s.owner}. ${s.demoNotice}`] },
        { heading: 'What we collect', body: s.collected.flatMap((c) => [c.heading, c.items]) },
        { heading: 'How we use it', body: [s.uses] },
        {
          heading: 'Who can see it',
          body: [
            [...s.sharing, 'Our hosting and database providers store the data on our behalf and may not use it for their own purposes.', 'We never sell personal data or share it with advertisers.'],
          ],
        },
        {
          heading: 'How we protect it',
          body: [
            [
              'Passwords are stored only as salted argon2 hashes; nobody, including us, can read them.',
              'All traffic between your browser, our servers and the database is encrypted (TLS).',
              'Every request is checked on the server so accounts can only reach the data they are allowed to see.',
            ],
          ],
        },
        {
          heading: 'How long we keep it',
          body: ['We keep your data while your account exists. If you ask us to delete your account, we remove your personal data within 30 days, except where we must keep a record by law.'],
        },
        {
          heading: 'Your rights',
          body: [`You can ask to see, correct, export or delete the personal data we hold about you. To make a request, ${contact}. We reply within 30 days.`],
        },
        { heading: 'Changes to this policy', body: ['If we change this policy, we update the date at the top of this page. Significant changes are announced in the app.'] },
      ],
    },
    terms: {
      title: 'Terms of Service',
      summary: `These terms apply when you use ${s.name}. By creating an account or using the service, you agree to them.`,
      sections: [
        { heading: 'The service', body: [`${s.name} is ${s.product}. ${s.demoNotice}`] },
        {
          heading: 'Your account',
          body: [['Give accurate information when you sign up and keep your password private.', 'You are responsible for activity on your account. Tell us straight away if you think someone else has used it.', 'You must be at least 16 years old to create an account.']],
        },
        { heading: 'Acceptable use', body: ['You agree not to:', ['break the law or infringe anyone’s rights through the service;', 'try to access accounts or data that aren’t yours, or probe, scan or disrupt the service;', 'upload malicious files or content;', ...s.extraRules]] },
        { heading: 'Your content', body: ['You keep ownership of what you add to the service. You give us permission to store and display it only so the service can work for you.'] },
        {
          heading: 'Availability and liability',
          body: [`The service is provided “as is”, without warranties of any kind. We aim to keep it available and your data safe, but we can’t guarantee uninterrupted access. To the extent the law allows, ${s.owner} is not liable for indirect or consequential losses arising from use of the service.`],
        },
        { heading: 'Suspension and closing accounts', body: ['We may suspend accounts that break these terms. You can stop using the service and ask us to delete your account at any time.'] },
        { heading: 'Contact', body: [`Questions about these terms? ${contact.charAt(0).toUpperCase()}${contact.slice(1)}.`] },
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      summary: `${s.name} uses one essential cookie to keep you signed in, and stores a few preferences in your browser. There are no advertising, analytics or third-party cookies.`,
      sections: [
        {
          heading: 'Essential cookie',
          body: [
            [`${s.cookieName}: keeps you signed in. It is httpOnly (scripts on the page can’t read it), sent only over secure connections in production, and expires after 7 days or when you sign out.`],
            'This cookie is strictly necessary for signing in, so it doesn’t need consent. Without it, you can browse public pages but can’t use your account.',
          ],
        },
        {
          heading: 'Stored in your browser',
          body: s.storage.length
            ? ['These preferences stay on your device and are never sent to us:', s.storage.map((x) => `${x.key}: ${x.purpose}`)]
            : [`${s.name} doesn’t store anything else in your browser.`],
        },
        { heading: 'Managing cookies', body: ['You can delete cookies and site data at any time in your browser settings. Doing so signs you out' + (s.storage.length ? ' and resets the preferences above.' : '.')] },
      ],
    },
    ...s.extraDocs,
  };
}
