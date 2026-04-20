export const faviconLinks = [
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/x-icon",
    href: "/favicon.ico",
  },
  {
    rel: "apple-touch-icon",
    href: "/apple-touch-icon.png",
  },
];

export const faviconMetadata = {
  icons: {
    icon: faviconLinks
      .filter((link) => link.rel === "icon")
      .map((link) => link.href),
    apple: "/apple-touch-icon.png",
  },
};
