import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Hash routes are not part of the exported HTML, and native hash navigation
// does not always update Next's asPath. All route consumers use the browser URL
// after hydration, including native links, Next links, and back/forward.
export function useHashPath() {
  const { events } = useRouter();
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setPath(window.location.pathname + window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    events.on("hashChangeComplete", update);
    events.on("routeChangeComplete", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
      events.off("hashChangeComplete", update);
      events.off("routeChangeComplete", update);
    };
  }, [events]);

  return path;
}
