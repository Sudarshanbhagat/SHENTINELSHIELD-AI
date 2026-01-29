import './styles/globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'SentinelShield AI - Threat Detection',
  description: 'Real-time cybersecurity threat detection using behavioral AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
