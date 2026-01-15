import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biome Training Intelligence",
  description: "Premium training intelligence dashboard for weekly performance.",
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
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased bg-[color:var(--background)] text-[color:var(--foreground)]`}
      >
        {children}
      </body>
    </html>
  );
}
