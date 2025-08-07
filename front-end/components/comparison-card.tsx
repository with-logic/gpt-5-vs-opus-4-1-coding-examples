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
        <div className="flex gap-2">
          <a 
            href={`/openai/${app.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-500 text-white py-2 px-3 rounded text-center hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm"
          >
            GPT-5 Version
          </a>
          <a 
            href={`/claude/${app.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-amber-500 text-white py-2 px-3 rounded text-center hover:bg-amber-600 transition-colors text-sm font-medium shadow-sm"
          >
            Claude Version
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