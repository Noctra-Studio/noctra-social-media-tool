import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { DM_Sans, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-brand-display",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.root');

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: [
        {
          url: "/brand/favicon-dark.svg",
          type: "image/svg+xml",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/brand/favicon-light.svg",
          type: "image/svg+xml",
          media: "(prefers-color-scheme: dark)",
        },
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${dmSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-950 text-zinc-50 relative`}
        style={{ '--font-dm-sans': 'var(--font-brand-display)' } as React.CSSProperties}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
