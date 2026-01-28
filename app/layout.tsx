import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ClientRefineWrapper from "@/components/client-refine-wrapper";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { Toaster } from "sonner";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://metabolikal.com";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Metabolikal",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
        <ServiceWorkerRegister />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
