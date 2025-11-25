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
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 flex-shrink-0 px-4 py-2 flex items-center justify-between gap-4">
        {/* Left - logo & app name */}
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logic_brandmark.png" alt="Logic" className="w-7 h-7" />
          </a>
          <span className="text-neutral-300">/</span>
          <h2 className="font-medium text-neutral-900 truncate">{app.title}</h2>
        </div>

        {/* Center - model selection */}
        <div className="flex items-center gap-1.5">
          {MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => viewMode === "tabs" ? setActiveTab(model.id) : toggleModel(model.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                viewMode === "tabs"
                  ? activeTab === model.id
                    ? `${model.color} text-white`
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  : selectedModels.includes(model.id)
                    ? `${model.color} text-white`
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                (viewMode === "tabs" ? activeTab === model.id : selectedModels.includes(model.id))
                  ? "bg-white/50"
                  : model.color
              }`} />
              {model.name}
            </button>
          ))}
          {viewMode === "side-by-side" && (
            <button
              onClick={selectAll}
              className="px-1.5 py-1 text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              All
            </button>
          )}
        </div>

        {/* Right - view toggle, share, close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-px bg-neutral-100 p-0.5">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === "side-by-side"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode("tabs")}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === "tabs"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Tabs
            </button>
          </div>

          <button
            onClick={copyLink}
            className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
            title="Copy shareable link"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
            title="Close (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
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
            className="h-full grid gap-px bg-neutral-200"
            style={{
              gridTemplateColumns: `repeat(${selectedModels.length}, 1fr)`
            }}
          >
            {selectedModels.map(modelId => {
              const model = MODELS.find(m => m.id === modelId)!;
              return (
                <div key={modelId} className="flex flex-col bg-white overflow-hidden">
                  {/* Model label */}
                  <div className={`${model.color} px-3 py-2 text-white text-sm font-medium text-center flex-shrink-0`}>
                    {model.name}
                  </div>
                  {/* iframe */}
                  <iframe
                    src={`/${modelId}/${app.id}`}
                    className="flex-1 w-full border-0"
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
