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
  title: "Agentic Coding Arena - Compare OpenAI, Anthropic, and Gemini models",
  description: "Side-by-side comparison of 5 frontier AI models (GPT-5, Opus 4.1, Opus 4.5, Sonnet 4.5, Gemini 3) on identical coding challenges. See how each model approaches the same prompts.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Agentic Coding Arena",
    description: "Compare 5 frontier AI models on identical coding challenges",
    images: ["/gpt-5.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/gpt-5.png"],
    title: "Agentic Coding Arena",
    description: "Compare GPT-5, Claude Opus, Sonnet, and Gemini 3 side-by-side",
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
