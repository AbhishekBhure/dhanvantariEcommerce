import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";

export const metadata: Metadata = { title: { template: "%s | Dhanvantari Admin", default: "Dhanvantari Admin" } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><ReduxProvider>{children}</ReduxProvider></body></html>;
}
