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
      const path = window.location.pathname;
      const compareMatch = path.match(/^\/compare\/(.+)$/);

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
              ["gpt-5", "opus-4.1", "opus-4.5", "sonnet-4.5", "gemini-3"].includes(m)
            );
            if (validModels.length > 0) {
              setInitialModels(validModels);
            }
          }
          if (view === "side-by-side" || view === "tabs") {
            setInitialView(view);
          }
          if (tab && ["gpt-5", "opus-4.1", "opus-4.5", "sonnet-4.5", "gemini-3"].includes(tab)) {
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

  const handleOpenApp = useCallback((app: CodeExample) => {
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {apps.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleOpenApp(app)}
          >
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {app.poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.poster}
                  alt={app.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold text-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Compare Models
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">{app.title}</h3>

              {/* Model indicator dots */}
              <div className="flex items-center gap-1.5 mb-3">
                {MODELS.map(({name, color}, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${color}`}
                    title={name}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1">5 models</span>
              </div>

              {app.tags && app.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {app.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {app.tags.length > 4 && (
                    <span className="text-xs text-gray-400">+{app.tags.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedApp && (
        <AppComparisonView
          app={selectedApp}
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
