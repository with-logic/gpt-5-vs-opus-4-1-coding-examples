"use client";

import { CodeExample } from "@/lib/code-examples";

export function ComparisonCard({ app }: { app: CodeExample }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
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
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-3">{app.title}</h3>
        <div className="flex flex-col gap-2">
          <a
            href={`/gpt-5/${app.id}/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 text-white py-2 px-3 rounded text-center hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm"
          >
            GPT-5
          </a>
          <a
            href={`/opus-4.1/${app.id}/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-500 text-white py-2 px-3 rounded text-center hover:bg-amber-600 transition-colors text-sm font-medium shadow-sm"
          >
            Opus 4.1
          </a>
          <a
            href={`/sonnet-4.5/${app.id}/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-500 text-white py-2 px-3 rounded text-center hover:bg-purple-600 transition-colors text-sm font-medium shadow-sm"
          >
            Sonnet 4.5
          </a>
        </div>
        {app.tags && app.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {app.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}