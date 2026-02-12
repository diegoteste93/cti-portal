import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'CTI Portal - Inteligência de Ameaças',
  description: 'Portal Centralizado de Inteligência de Ameaças Cibernéticas',
};

const themeInitScript = `(() => {
  try {
    const key = 'cti-theme';
    const saved = localStorage.getItem(key);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (_) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
