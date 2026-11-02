import React, { useEffect, useState, type FC } from "react";
import { useRouter } from "next/router";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { NotFound } from "@/components/not-found";
import { plugins } from "@/plugins";
import { MainSection } from "@/components/layout/main-section";
import { useHashPath } from "@/hooks/useHashPath";

const PluginLoader: FC = () => {
  const router = useRouter();
  const asPath = useHashPath();
  const isReady = asPath !== null;
  const pluginId = asPath?.startsWith("/#/") ? asPath.split("/")[2] : undefined;
  const plugin = plugins.find((p) => p.id === pluginId);
  const [loadedPage, setLoadedPage] = useState<{ id: string; Component: FC } | null>(null);
  const [componentLoading, setComponentLoading] = useState(true);

  useEffect(() => {
    // Wait for the actual browser hash; the static export cannot know it.
    if (!isReady) return;
    if (asPath === "/" || asPath === "/#" || asPath === "/#/") {
      void router.replace("/#/stewards");
      return;
    }

    if (!plugin) {
      setLoadedPage(null);
      setComponentLoading(false);
      return;
    }

    let cancelled = false;
    setComponentLoading(true);
    import(`@/plugins/${plugin.folderName}`)
      .then((mod) => {
        if (cancelled) return;
        setLoadedPage({ id: plugin.id, Component: mod.default });
        setComponentLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("Failed to load the page component", err);
        setLoadedPage(null);
        setComponentLoading(false);
      });
    // A slower import for a previous route must never replace the current page.
    return () => {
      cancelled = true;
    };
  }, [asPath, isReady, plugin, router]);

  if (!isReady || !loadedPage || loadedPage.id !== pluginId) {
    if (!isReady || componentLoading || (!!loadedPage && loadedPage.id !== pluginId)) {
      return (
        <MainSection>
          <div className="flex h-24 w-full items-center justify-center">
            <PleaseWaitSpinner />
          </div>
        </MainSection>
      );
    }
    return <NotFound />;
  }

  const PageComponent = loadedPage.Component;
  return <PageComponent />;
};

export default PluginLoader;
