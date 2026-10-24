import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Matematički podsjetnik",
    template: "%s | Matematički podsjetnik",
  },
  description:
    "Matematičke lekcije, podsjetnici i PDF materijali za učenike osnovne škole.",
  keywords: [
    "matematika",
    "lekcije",
    "podsjetnik",
    "osnovna škola",
    "formule",
    "zadaci",
  ],
  applicationName: "Matematički podsjetnik",
  creator: "Profesor Lazar",
  publisher: "Matematički podsjetnik",
  category: "education",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Matematički podsjetnik",
    description:
      "Matematičke lekcije, podsjetnici i PDF materijali za učenike osnovne škole.",
    url: siteUrl,
    siteName: "Matematički podsjetnik",
    locale: "sr_RS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Matematički podsjetnik",
    description:
      "Matematičke lekcije, podsjetnici i PDF materijali za učenike osnovne škole.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta
          name="google-site-verification"
          content="tZT3HRecKIBbZTpbskEBABm32KtNYXEnGODcSmWV1-I"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
