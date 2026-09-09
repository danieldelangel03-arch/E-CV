"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "eprofile-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const nextDark = document.documentElement.dataset.theme !== "dark";
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    window.localStorage.setItem(storageKey, nextDark ? "dark" : "light");
  }

  return <button className="theme-toggle no-print" type="button" onClick={toggleTheme} aria-label="Cambiar entre modo claro y oscuro" title="Cambiar tema">{dark ? <SunMedium size={17} /> : <MoonStar size={17} />}<span>Tema</span></button>;
}
