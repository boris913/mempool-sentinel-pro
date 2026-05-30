import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mempool Sentinel Pro — Dashboard Bitcoin Professionnel",
  description: "Surveillance temps réel du mempool Bitcoin, frais, blocs, et outils de transaction pour professionnels.",
  keywords: ["bitcoin", "mempool", "blockchain", "frais", "transaction", "mining"],
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23F7931A'/%3E%3Ctext x='50' y='68' font-size='55' text-anchor='middle' fill='white' font-family='serif' font-weight='bold'%3E%26%23x20BF;%3C/text%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
    shortcut: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23F7931A'/%3E%3Ctext x='50' y='68' font-size='55' text-anchor='middle' fill='white' font-family='serif' font-weight='bold'%3E%26%23x20BF;%3C/text%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23F7931A'/%3E%3Ctext x='50' y='68' font-size='55' text-anchor='middle' fill='white' font-family='serif' font-weight='bold'%3E%26%23x20BF;%3C/text%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bitcoin-dark text-bitcoin-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}