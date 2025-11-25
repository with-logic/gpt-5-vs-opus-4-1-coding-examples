"use client";

import { useState } from "react";
import { CodeExample } from "@/lib/code-examples";
import { MODELS } from "@/lib/models";
import { AppComparisonView } from "./app-comparison-view";

export function ComparisonCard({ app }: { app: CodeExample }) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  return (
    <>
      <div
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => setIsCompareOpen(true)}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Compare Models
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">{app.title}</h3>

          {/* Model indicator dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {MODELS.map((model) => (
              <div
                key={model.id}
                className={`w-3 h-3 rounded-full ${model.color}`}
                title={model.name}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">{MODELS.length} models</span>
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

      <AppComparisonView
        app={app}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </>
  );
}
