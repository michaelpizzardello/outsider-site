// app/fonts.ts
import localFont from "next/font/local";

export const sofiaPro = localFont({
  src: [
    { path: "./fonts/sofia/Sofia Pro Regular Az.otf", weight: "400", style: "normal" },
    { path: "./fonts/sofia/Sofia Pro Medium Az.otf",  weight: "500", style: "normal" },
    { path: "./fonts/sofia/Sofia Pro Semi Bold Az.otf", weight: "600", style: "normal" },
    { path: "./fonts/sofia/Sofia Pro Bold Az.otf",    weight: "700", style: "normal" },
    { path: "./fonts/sofia/Sofia Pro Regular Italic Az.otf", weight: "400", style: "italic" },
  ],
  display: "swap",
});
