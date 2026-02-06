import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Program Review Assistant | College of the Siskiyous',
  description:
    'AI-powered program review assistant with ACCJC accreditation standards integration for community colleges',
  keywords: ['program review', 'accreditation', 'ACCJC', 'college', 'higher education'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">{children}</body>
    </html>
  );
}
