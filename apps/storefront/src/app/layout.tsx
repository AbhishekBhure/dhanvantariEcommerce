import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Dhanvantari Ayurvedic Agencies",
    default: "Dhanvantari Ayurvedic Agencies — Pure Ayurveda, Modern Living",
  },
  description:
    "Discover authentic Ayurvedic products crafted with traditional formulations. Dhanvantari Ayurvedic Agencies brings you premium hair care, skin care, and wellness products.",
  keywords: [
    "Ayurvedic products",
    "natural hair care",
    "Ayurveda",
    "herbal skincare",
    "wellness",
    "Dhanvantari",
  ],
  authors: [{ name: "Dhanvantari Ayurvedic Agencies" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Dhanvantari Ayurvedic Agencies",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ReduxProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
