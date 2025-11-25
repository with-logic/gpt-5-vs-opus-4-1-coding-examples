"use client";

import { useEffect, useState, useCallback } from "react";
import { CodeExample } from "@/lib/code-examples";
import { AppComparisonView } from "./app-comparison-view";
import { MODELS } from "@/lib/models";

interface AppGridWithRoutingProps {
  apps: CodeExample[];
}

export function AppGridWithRouting({ apps }: AppGridWithRoutingProps) {
  const [selectedApp, setSelectedApp] = useState<CodeExample | null>(null);
  const [initialModels, setInitialModels] = useState<string[]>(["gpt-5", "opus-4.5"]);
  const [initialView, setInitialView] = useState<"side-by-side" | "tabs">("side-by-side");
  const [initialTab, setInitialTab] = useState<string>("gpt-5");

  // Parse URL on mount
  useEffect(() => {
    const parseUrl = () => {
      const path = window.location.pathname.replace(/\/+$/, ""); // Remove trailing slashes
      const compareMatch = path.match(/^\/compare\/([^/]+)/);

      if (compareMatch) {
        const appId = compareMatch[1];
        const app = apps.find(a => a.id === appId);

        if (app) {
          // Parse query params
          const params = new URLSearchParams(window.location.search);
          const models = params.get("models");
          const view = params.get("view");
          const tab = params.get("tab");

          if (models) {
            const validModels = models.split(",").filter(m =>
              ["gpt-5", "gpt-5.1", "opus-4.1", "opus-4.5", "sonnet-4.5", "gemini-3"].includes(m)
            );
            if (validModels.length > 0) {
              setInitialModels(validModels);
            }
          }
          if (view === "side-by-side" || view === "tabs") {
            setInitialView(view);
          }
          if (tab && ["gpt-5", "gpt-5.1", "opus-4.1", "opus-4.5", "sonnet-4.5", "gemini-3"].includes(tab)) {
            setInitialTab(tab);
          }

          setSelectedApp(app);
        }
      }
    };

    parseUrl();

    // Handle browser back/forward
    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath === "/") {
        setSelectedApp(null);
      } else {
        parseUrl();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [apps]);

  const handleOpenApp = useCallback((e: React.MouseEvent, app: CodeExample) => {
    // Let middle-click, ctrl+click, cmd+click open in new tab naturally
    if (e.button !== 0 || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    setInitialModels(["gpt-5", "opus-4.5"]); // Reset to defaults
    setInitialView("side-by-side");
    setInitialTab("gpt-5");
    setSelectedApp(app);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedApp(null);
  }, []);

  return (
    <>
      <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3 border border-neutral-200 overflow-hidden">
        {apps.map((app) => (
          <a
            key={app.id}
            href={`/compare/${app.id}?models=gpt-5,opus-4.5&view=side-by-side`}
            className="group bg-white p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
            onClick={(e) => handleOpenApp(e, app)}
          >
            <div className="aspect-video bg-neutral-100 overflow-hidden mb-3">
              {app.poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.poster}
                  alt={app.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>

            <h3 className="font-medium text-neutral-900 group-hover:text-black mb-2">
              {app.title}
            </h3>

            {/* Model dots */}
            <div className="flex items-center gap-1">
              {MODELS.map(({name, color}, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${color}`}
                  title={name}
                />
              ))}
            </div>

            {app.tags && app.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {app.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-neutral-500">
                    {tag}{app.tags!.indexOf(tag) < Math.min(app.tags!.length - 1, 2) ? "," : ""}
                  </span>
                ))}
                {app.tags.length > 3 && (
                  <span className="text-xs text-neutral-400">+{app.tags.length - 3}</span>
                )}
              </div>
            )}
          </a>
        ))}
      </div>

      {selectedApp && (
        <AppComparisonView
          app={selectedApp}
          apps={apps}
          isOpen={true}
          onClose={handleClose}
          initialModels={initialModels}
          initialView={initialView}
          initialTab={initialTab}
        />
      )}
    </>
  );
}
