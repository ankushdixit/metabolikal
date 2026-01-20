import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ClientRefineWrapper from "@/components/client-refine-wrapper";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://metabolikal.com";

export const metadata: Metadata = {
  title: {
    default: "METABOLI-K-AL - You Don't Need More Hustle, You Need Rhythm",
    template: "%s | METABOLI-K-AL",
  },
  description:
    "The structured lifestyle reset engineered for high-performing professionals. Transform your metabolic health with science-backed coaching from Shivashish Sinha.",
  keywords: [
    "metabolic health",
    "executive coaching",
    "weight loss",
    "fitness",
    "nutrition",
    "high-performance",
    "lifestyle reset",
    "metabolic transformation",
  ],
  authors: [{ name: "Shivashish Sinha", url: siteUrl }],
  creator: "METABOLI-K-AL",
  publisher: "METABOLI-K-AL",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "METABOLI-K-AL",
    title: "METABOLI-K-AL - You Don't Need More Hustle, You Need Rhythm",
    description:
      "The structured lifestyle reset engineered for high-performing professionals. Transform your metabolic health with science-backed coaching.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "METABOLI-K-AL - Transform Your Metabolic Health",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "METABOLI-K-AL - Transform Your Metabolic Health",
    description: "The structured lifestyle reset engineered for high-performing professionals.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientRefineWrapper>{children}</ClientRefineWrapper>
      </body>
    </html>
  );
}
