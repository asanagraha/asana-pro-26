import { redirect } from 'next/navigation';
import { getSession } from './actions';
import LandingPage from '@/components/landing/LandingPage';

export const metadata = {
  title: 'AsanaPro — Kelola Agensi Properti Lebih Mudah',
  description:
    'Platform manajemen all-in-one untuk agen properti modern: listing inventory, CRM klien, hingga link WhatsApp profesional. Mulai gratis hari ini.',
};

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect('/app/dashboard');
  }
  return <LandingPage />;
}