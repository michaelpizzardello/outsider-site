"use client";
import { useEffect } from "react";

export default function HeaderModeTransparent() {
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.dataset.header;
    el.dataset.header = "transparent";
    return () => {
      if (prev === undefined) delete el.dataset.header;
      else el.dataset.header = prev;
    };
  }, []);
  return null;
}
