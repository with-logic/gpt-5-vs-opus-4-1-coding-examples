"use client";

import { useState, useEffect, useCallback } from "react";
import { CodeExample } from "@/lib/code-examples";
import { MODELS as BASE_MODELS } from "@/lib/models";

const MODELS = BASE_MODELS.map(m => ({
  ...m,
  hoverColor: m.color.replace("bg-", "hover:bg-").replace("-500", "-600"),
  borderColor: m.color.replace("bg-", "border-"),
  textColor: m.color.replace("bg-", "text-").replace("-500", "-600"),
}));

interface AppComparisonViewProps {
  app: CodeExample;
  isOpen: boolean;
  onClose: () => void;
  initialModels?: string[];
  initialView?: "side-by-side" | "tabs";
  initialTab?: string;
}

export function AppComparisonView({
  app,
  isOpen,
  onClose,
  initialModels = ["gpt-5", "opus-4.5"],
  initialView = "side-by-side",
  initialTab = "gpt-5"
}: AppComparisonViewProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(initialModels);
  const [viewMode, setViewMode] = useState<"side-by-side" | "tabs">(initialView);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);

  // Update state when initial props change (for URL navigation)
  useEffect(() => {
    setSelectedModels(initialModels);
    setViewMode(initialView);
    setActiveTab(initialTab);
  }, [initialModels, initialView, initialTab]);

  // Update URL when state changes
  const updateUrl = useCallback((models: string[], mode: "side-by-side" | "tabs", tab: string) => {
    if (!isOpen) return;
    const params = new URLSearchParams();
    params.set("models", models.join(","));
    params.set("view", mode);
    if (mode === "tabs") params.set("tab", tab);
    const newUrl = `/compare/${app.id}?${params.toString()}`;
    window.history.replaceState({ app: app.id }, "", newUrl);
  }, [isOpen, app.id]);

  // Update URL when comparison opens or state changes
  useEffect(() => {
    if (isOpen) {
      updateUrl(selectedModels, viewMode, activeTab);
    }
  }, [isOpen, selectedModels, viewMode, activeTab, updateUrl]);

  // Handle escape key and closing
  const handleClose = useCallback(() => {
    window.history.pushState({}, "", "/");
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(m => m !== modelId);
      }
      return [...prev, modelId];
    });
  };

  const selectAll = () => setSelectedModels(MODELS.map(m => m.id));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              title="Close (Esc)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-white font-semibold text-lg">{app.title}</h2>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Copy shareable link"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm mr-2">View:</span>
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "side-by-side"
                  ? "bg-white text-gray-900"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode("tabs")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "tabs"
                  ? "bg-white text-gray-900"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Tabs
            </button>
          </div>

          {/* Model selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm mr-1">Compare:</span>
            {MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => viewMode === "tabs" ? setActiveTab(model.id) : toggleModel(model.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  viewMode === "tabs"
                    ? activeTab === model.id
                      ? `${model.color} text-white`
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : selectedModels.includes(model.id)
                      ? `${model.color} text-white`
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                {model.name}
              </button>
            ))}
            {viewMode === "side-by-side" && (
              <>
                <button
                  onClick={selectAll}
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-64px)] overflow-hidden">
        {viewMode === "tabs" ? (
          // Tabs view - single iframe
          <div className="h-full">
            <iframe
              src={`/${activeTab}/${app.id}`}
              className="w-full h-full border-0"
              title={`${app.title} - ${MODELS.find(m => m.id === activeTab)?.name}`}
            />
          </div>
        ) : (
          // Side by side view
          <div
            className="h-full grid gap-1 bg-gray-800 p-1"
            style={{
              gridTemplateColumns: `repeat(${selectedModels.length}, 1fr)`
            }}
          >
            {selectedModels.map(modelId => {
              const model = MODELS.find(m => m.id === modelId)!;
              return (
                <div key={modelId} className="flex flex-col bg-gray-900 rounded overflow-hidden">
                  {/* Model label */}
                  <div className={`${model.color} px-3 py-1.5 text-white text-sm font-medium text-center`}>
                    {model.name}
                  </div>
                  {/* iframe */}
                  <iframe
                    src={`/${modelId}/${app.id}`}
                    className="flex-1 w-full border-0 bg-white"
                    title={`${app.title} - ${model.name}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
