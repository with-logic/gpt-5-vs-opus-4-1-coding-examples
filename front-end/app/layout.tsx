import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPT-5 vs Claude Opus 4.1 Coding Examples",
  description: "Head-to-head comparison of AI coding capabilities between OpenAI's GPT-5 and Anthropic's Claude Opus 4.1",
  icons: {
    icon: "/gpt-5.png",
  },
  openGraph: {
    images: ["/gpt-5.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/gpt-5.png"],
    title: "GPT-5 vs Claude Opus 4.1 Coding Examples",
    description: "Head-to-head comparison of AI coding capabilities",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
