import { useEffect, useState } from "react";

const read = () => (window.location.hash.replace(/^#\/?/, "") || "overview").split("/").map(decodeURIComponent);

export function useRoute() {
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => { setParts(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}

export const href = (...parts: string[]) => `#/${parts.map(encodeURIComponent).join("/")}`;
export const go = (...parts: string[]) => { window.location.hash = href(...parts); };
