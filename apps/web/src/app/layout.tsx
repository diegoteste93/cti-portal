import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'CTI Portal - Threat Intelligence',
  description: 'Centralized Cyber Threat Intelligence Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
