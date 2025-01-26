import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'AutoStock - AI-Powered Stock Photo Generation',
    template: '%s | AutoStock',
  },
  description: 'Generate high-quality stock photos and prompts using AI. Enhance your photos and prepare them for stock photo platforms.',
  keywords: [
    'AI',
    'stock photos',
    'photo generation',
    'prompts',
    'photo enhancement',
    'stock photography',
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider session={session}>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 w-full">
                <div className="mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </SessionProvider>
          <Toaster />
        </NextThemesProvider>
      </body>
    </html>
  );
}