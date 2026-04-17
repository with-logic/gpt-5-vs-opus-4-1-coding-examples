"use client";

import { useEffect, useState, useCallback } from "react";
import { CodeExample } from "@/lib/code-examples";
import { AppComparisonView } from "./app-comparison-view";
import { StatsMiniChart } from "./stats-mini-chart";
import { StatsModelDashboard } from "./stats-model-card";
import { MODEL_IDS, MODELS_BY_PROVIDER } from "@/lib/models";

interface AppGridWithRoutingProps {
  apps: CodeExample[];
}

type PageMode = "apps" | "stats-by-app" | "stats-by-model";

export function AppGridWithRouting({ apps }: AppGridWithRoutingProps) {
  const [selectedApp, setSelectedApp] = useState<CodeExample | null>(null);
  const [initialModels, setInitialModels] = useState<string[]>(["gpt-5.4", "opus-4.7", "gemini-3"]);
  const [initialView, setInitialView] = useState<"side-by-side" | "tabs">("side-by-side");
  const [initialTab, setInitialTab] = useState<string>("gpt-5.4");
  const [initialContentMode, setInitialContentMode] = useState<"demo" | "stats">("demo");
  const [pageMode, setPageMode] = useState<PageMode>("apps");

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
          const content = params.get("content");

          if (models) {
            const validModels = models.split(",").filter(m => MODEL_IDS.has(m));
            if (validModels.length > 0) {
              setInitialModels(validModels);
            }
          }
          if (view === "side-by-side" || view === "tabs") {
            setInitialView(view);
          }
          if (tab && MODEL_IDS.has(tab)) {
            setInitialTab(tab);
          }
          if (content === "stats") {
            setInitialContentMode("stats");
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
    setInitialModels(["gpt-5.4", "opus-4.7", "gemini-3"]); // Reset to defaults
    setInitialView("side-by-side");
    setInitialTab("gpt-5.4");
    setInitialContentMode(pageMode !== "apps" ? "stats" : "demo");
    setSelectedApp(app);
  }, [pageMode]);

  const handleClose = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const toggleBtnClass = (active: boolean) =>
    `px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-white text-neutral-900 shadow-sm"
        : "text-neutral-500 hover:text-neutral-900"
    }`;

  return (
    <>
      {/* Apps / Stats by App / Stats by Model toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-px bg-neutral-100 p-0.5">
          <button onClick={() => setPageMode("apps")} className={toggleBtnClass(pageMode === "apps")}>
            Apps
          </button>
          <button onClick={() => setPageMode("stats-by-app")} className={toggleBtnClass(pageMode === "stats-by-app")}>
            Stats by App
          </button>
          <button onClick={() => setPageMode("stats-by-model")} className={toggleBtnClass(pageMode === "stats-by-model")}>
            Stats by Model
          </button>
        </div>
      </div>

      {pageMode === "stats-by-model" ? (
        <StatsModelDashboard />
      ) : (
        /* App grid (poster or mini chart) */
        <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3 border border-neutral-200 overflow-hidden">
          {apps.map((app) => (
            <a
              key={app.id}
              href={pageMode === "stats-by-app"
                ? `/compare/${app.id}?models=gpt-5.4,opus-4.7,gemini-3&view=side-by-side&content=stats`
                : `/compare/${app.id}?models=gpt-5.4,opus-4.7,gemini-3&view=side-by-side`}
              className="group bg-white p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={(e) => handleOpenApp(e, app)}
            >
              <div className="aspect-video bg-neutral-100 overflow-hidden mb-3">
                {pageMode === "stats-by-app" ? (
                  <StatsMiniChart appId={app.id} />
                ) : (
                  app.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={app.poster}
                      alt={app.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )
                )}
              </div>

              <h3 className="font-medium text-neutral-900 group-hover:text-black mb-2">
                {app.title}
              </h3>

              {/* Model dots */}
              <div className="flex items-center gap-1">
                {MODELS_BY_PROVIDER.map((group, gi) => (
                  <div key={group.id} className={`flex items-center gap-1 ${gi > 0 ? "ml-1" : ""}`}>
                    {group.models.map((model) => (
                      <div
                        key={model.id}
                        className={`w-2 h-2 rounded-full ${model.color}`}
                        title={model.name}
                      />
                    ))}
                  </div>
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
      )}

      {selectedApp && (
        <AppComparisonView
          app={selectedApp}
          apps={apps}
          isOpen={true}
          onClose={handleClose}
          initialModels={initialModels}
          initialView={initialView}
          initialTab={initialTab}
          initialContentMode={initialContentMode}
        />
      )}
    </>
  );
}
