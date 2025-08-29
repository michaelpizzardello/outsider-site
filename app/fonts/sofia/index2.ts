// app/fonts/sofia/index.ts
import localFont from "next/font/local";

export const sofiaPro = localFont({
  variable: "--font-sofia-pro",
  display: "swap",
  preload: true,
  src: [
    { path: "./Sofia Pro Regular Az.otf", weight: "400", style: "normal" },
    { path: "./Sofia Pro Regular Italic Az.otf", weight: "400", style: "italic" },
    { path: "./Sofia Pro Medium Az.otf", weight: "500", style: "normal" },
    { path: "./Sofia Pro Medium Italic Az.otf", weight: "500", style: "italic" },
    { path: "./Sofia Pro Bold Az.otf", weight: "700", style: "normal" },
    { path: "./Sofia Pro Bold Italic Az.otf", weight: "700", style: "italic" },
    { path: "./Sofia Pro Black Az.otf", weight: "900", style: "normal" },
    { path: "./Sofia Pro Black Italic Az.otf", weight: "900", style: "italic" },
    { path: "./Sofia Pro Light Az.otf", weight: "300", style: "normal" },
    { path: "./Sofia Pro Light Italic Az.otf", weight: "300", style: "italic" },
  ],
});
