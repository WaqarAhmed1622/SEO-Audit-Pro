import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'SEO Audit Pro - Professional SEO Audits in Seconds',
    description: 'Generate comprehensive, branded SEO audit reports in under 90 seconds. Perfect for agencies, freelancers, and marketing professionals.',
    keywords: 'SEO audit, website analysis, SEO report, white-label SEO, agency tools',
    openGraph: {
        title: 'SEO Audit Pro - Professional SEO Audits in Seconds',
        description: 'Generate comprehensive, branded SEO audit reports in under 90 seconds.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    {children}
                    <Toaster position="top-right" richColors />
                </Providers>
            </body>
        </html>
    );
}
