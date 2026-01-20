import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biome Training Intelligence",
  description: "Premium training intelligence for weekly performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Root layout structure per Next.js App Router docs (Context7: https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/01-installation.mdx).
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-[color:var(--background)] text-[color:var(--foreground)]`}
      >
        {children}
      </body>
    </html>
  );
}
