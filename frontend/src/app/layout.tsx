import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 
    process.env.NEXT_PUBLIC_API_BASE_URL || 
    'https://weir.run'
  ),
  title: "WEIR — Autonomous Solana Token Survival Agent",
  description: "Thousands enter the river. Few clear the falls. We count every one. WEIR observes every Solana token that clears $10K peak market cap and estimates its probability of reaching $30K.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WEIR — Autonomous Solana Token Survival Agent",
    description: "Thousands enter the river. Few clear the falls. We count every one. WEIR observes every Solana token that clears $10K peak market cap and estimates its probability of reaching $30K.",
    url: "/",
    siteName: "WEIR",
    images: [
      {
        url: "/brand/og.png",
        width: 1200,
        height: 630,
        alt: "WEIR — Autonomous Solana Token Survival Agent",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEIR — Autonomous Solana Token Survival Agent",
    description: "Thousands enter the river. Few clear the falls. We count every one.",
    images: ["/brand/og.png"],
    creator: "@weircount",
  },
  icons: {
    icon: [
      { url: "/brand/weir-logo.webp", type: "image/webp" },
      { url: "/icon.png", type: "image/png" }
    ],
    shortcut: "/brand/weir-logo.webp",
    apple: "/brand/weir-logo.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased js`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}

