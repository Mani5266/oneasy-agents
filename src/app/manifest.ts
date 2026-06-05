import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OnEasy — AI Document Generation",
    short_name: "OnEasy",
    description:
      "Generate net worth certificates, partnership deeds, LLP agreements, offer letters, and salary calculations instantly with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0A2640",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "finance"],
    lang: "en-IN",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
