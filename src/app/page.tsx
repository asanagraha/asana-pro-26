import { redirect } from 'next/navigation';
import { getSession } from './actions';
import LandingPage from '@/components/landing/LandingPage';

export const metadata = {
  metadataBase: new URL('https://asanpro.id'),
  title: 'AsanaPro — Software Manajemen Agen Properti & CRM Properti Indonesia',
  description:
    'Platform manajemen agen properti all-in-one: listing inventory, CRM klien, tracking deal, hingga link WhatsApp profesional. Coba gratis sekarang.',
  keywords: [
    'AsanaPro',
    'software manajemen properti',
    'aplikasi agen properti',
    'CRM properti Indonesia',
    'sistem listing properti',
  ],
  openGraph: {
    title: 'AsanaPro — Kelola Agensi Properti Lebih Mudah',
    description:
      'Platform manajemen all-in-one untuk agen properti modern: listing, CRM, dan laporan keuangan dalam satu dashboard.',
    url: 'https://asanpro.id',
    siteName: 'AsanaPro',
    locale: 'id_ID',
    type: 'website',
    images: [{ url: '/logo.jpg', width: 512, height: 512, alt: 'AsanaPro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AsanaPro — Kelola Agensi Properti Lebih Mudah',
    description: 'Platform manajemen all-in-one untuk agen properti modern.',
    images: ['/logo.jpg'],
  },
  alternates: {
    canonical: 'https://asanpro.id',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AsanaPro',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, Android, iOS',
  description:
    'Platform manajemen agen properti all-in-one: listing inventory, CRM klien, tracking deal, dan laporan keuangan agensi.',
  url: 'https://asanpro.id',
  offers: [
    { '@type': 'Offer', name: 'Paket Agency', price: '49000', priceCurrency: 'IDR' },
    { '@type': 'Offer', name: 'Paket Profesional', price: '125000', priceCurrency: 'IDR' },
    { '@type': 'Offer', name: 'Paket Business', price: '199000', priceCurrency: 'IDR' },
  ],
};

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect('/app/dashboard');
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}