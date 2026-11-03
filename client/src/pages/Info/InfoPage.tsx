import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/Layout';

type PageKey = 'about' | 'privacy' | 'terms' | 'disclaimer' | 'contact';

const P = ({ children }: { children: ReactNode }) => <p className="mb-4 leading-relaxed text-ink-soft">{children}</p>;
const H = ({ children }: { children: ReactNode }) => <h2 className="mb-2 mt-8 text-lg font-bold">{children}</h2>;
const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="mb-4 list-disc space-y-1.5 pl-6 text-ink-soft">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
);

const PAGES: Record<PageKey, { title: string; description: string; body: ReactNode }> = {
  about: {
    title: 'About SchemeSetu',
    description: 'Bridging you to the benefits you deserve.',
    body: (
      <>
        <P>
          Millions of people in India may be eligible for scholarships and welfare schemes but struggle to find them. Information
          is spread across many portals, eligibility rules are written in difficult language, and deadlines are easy to miss.
        </P>
        <P>
          SchemeSetu brings scheme information into one place. You create a single profile, and a transparent rule engine checks
          each scheme&apos;s conditions against it — explaining which conditions you meet, which you don&apos;t, and which need more information.
        </P>
        <H>What SchemeSetu is — and isn&apos;t</H>
        <UL
          items={[
            'It is an independent discovery and preparation tool, built as a Web Technology course project.',
            'It is not an official government portal and is not affiliated with any ministry or department.',
            'It does not submit applications or read application status from government systems.',
            'Eligibility results are preliminary. The official scheme source is always authoritative.',
          ]}
        />
        <H>How scheme data is maintained</H>
        <P>
          Each scheme links to its official source and shows whether an administrator has verified it against that source and when.
          Deadlines are shown only when verified; otherwise they are labelled “not verified”. Clearly marked demo records are
          hypothetical and exist only to demonstrate features.
        </P>
        <Link to="/schemes" className="btn-primary mt-2">Explore schemes</Link>
      </>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'What we collect, why, and your choices.',
    body: (
      <>
        <H>What we collect</H>
        <UL
          items={[
            'Account details: your name, email address and a securely hashed password (we never store your actual password).',
            'Optional eligibility profile: details such as state, education, income bracket, category and disability status. Every field is optional, and “Prefer not to say” is always available.',
            'Your saved schemes, document checklist tick marks and the application statuses and notes you record.',
          ]}
        />
        <H>What we never collect</H>
        <UL items={['Aadhaar numbers, bank account numbers, OTPs or passwords for other services.', 'Copies of certificates or identity documents — the checklist only stores tick marks.']} />
        <H>How we use it</H>
        <P>
          Your profile is used only to check scheme eligibility for you. Administrators see aggregate scheme statistics, not individual
          profiles.
        </P>
        <H>Security</H>
        <P>Sessions use short-lived tokens in secure, HttpOnly cookies. Requests are validated and rate-limited, and logs avoid personal data.</P>
        <H>Your choices</H>
        <P>
          You can edit any profile answer at any time, and you can permanently delete your account and all associated data from the{' '}
          <Link to="/profile" className="link">profile page</Link>.
        </P>
      </>
    ),
  },
  terms: {
    title: 'Terms of Use',
    description: 'Please read these terms before using SchemeSetu.',
    body: (
      <>
        <UL
          items={[
            'SchemeSetu provides information to help you discover schemes. It does not guarantee eligibility, selection or approval for any scheme.',
            'Always verify details — eligibility, benefits, documents and deadlines — on the official source before applying.',
            'Application tracking is a personal record you maintain; it is not connected to government systems.',
            'AI-generated explanations may contain mistakes and are not official advice.',
            'Do not misuse the service, attempt to access other users’ data, or interfere with its operation.',
            'This is a student project provided “as is”, without warranties of any kind.',
          ]}
        />
      </>
    ),
  },
  disclaimer: {
    title: 'Disclaimer',
    description: 'Important limitations of the information on SchemeSetu.',
    body: (
      <>
        <P>
          SchemeSetu is an independent platform and is not an official website of the Government of India or any state government. Scheme
          information is compiled from publicly available sources and may be incomplete or out of date. Records not yet verified by an
          administrator are labelled “Unverified details”.
        </P>
        <P>
          Eligibility checks are automated and preliminary. They consider only the conditions SchemeSetu can check from your profile; other
          conditions are listed for you to verify yourself. Final eligibility is decided only by the implementing authority.
        </P>
        <P>Records labelled “Demo” are hypothetical and do not represent real schemes.</P>
      </>
    ),
  },
  contact: {
    title: 'Contact',
    description: 'Questions, corrections or feedback.',
    body: (
      <>
        <P>
          SchemeSetu is maintained by a two-member student team as a Web Technology course project. To report incorrect scheme information or
          share feedback, please open an issue in the project&apos;s GitHub repository (link in the project README).
        </P>
        <P>
          For questions about a specific scheme, its status or your application, please contact the implementing department through the
          official portal listed on that scheme&apos;s page — SchemeSetu cannot access or change official application records.
        </P>
        <UL
          items={[
            <a key="nsp" href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer" className="link">National Scholarship Portal</a>,
            <a key="ms" href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" className="link">myScheme</a>,
          ]}
        />
      </>
    ),
  },
};

export default function InfoPage({ page }: { page: PageKey }) {
  const p = PAGES[page];
  return (
    <div className="container-page py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <PageHeader title={p.title} description={p.description} />
        <div className="card p-6 sm:p-8">{p.body}</div>
      </article>
    </div>
  );
}
