import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
  title: "GPT-5 vs Claude Opus 4.1 vs Opus 4.5 vs Sonnet 4.5 vs Gemini 3 Coding Examples",
  description: "Five-way comparison of AI coding capabilities between OpenAI's GPT-5, Anthropic's Claude Opus 4.1, Anthropic's Claude Opus 4.5, Anthropic's Claude Sonnet 4.5, and Google's Gemini 3",
  icons: {
    icon: "/gpt-5.png",
  },
  openGraph: {
    images: ["/gpt-5.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/gpt-5.png"],
    title: "GPT-5 vs Claude Opus 4.1 vs Opus 4.5 vs Sonnet 4.5 vs Gemini 3 Coding Examples",
    description: "Five-way comparison of AI coding capabilities",
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
        <Analytics />
      </body>
    </html>
  );
}
