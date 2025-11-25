export const dynamic = "force-static";
import { loadApps } from "@/lib/code-examples";
import { AppGridWithRouting } from "@/components/app-grid-with-routing";
import { MODELS } from "@/lib/models";
import Image from "next/image";

export default async function Home() {
  const apps = await loadApps();

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="mx-auto w-full max-w-7xl py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
            Agentic Coding Arena
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Compare { MODELS.length } frontier models on 52 identical coding challenges
          </p>

          {/* Model pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {MODELS.map((model) => (
              <span
                key={model.name}
                className={`${model.color} text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm`}
              >
                {model.name}
              </span>
            ))}
          </div>

          <a
            href="https://github.com/with-logic/gpt-5-vs-opus-4-1-coding-examples"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Info Card */}
        <div className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">About This Comparison</h2>
              <p className="text-gray-600 mb-3">
                Each app below was generated from <strong>the exact same prompt</strong> — one shot, no editing.
                Click any card to compare implementations side-by-side.
              </p>
              <p className="text-gray-600 mb-3">
                We built this at <a href="https://logic.inc" className="text-blue-600 hover:underline font-medium">Logic</a> to help us and others evaluate how
                different frontier models handle coding challenges. Thank you to OpenAI for <a href="https://github.com/openai/gpt-5-coding-examples" className="text-black-600 hover:underline font-medium">the initial set of coding examples</a>.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{apps.length} examples across games, tools, visualizations, and more</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <a href="https://logic.inc" className="block">
                <Image
                  src="/logic_logo.png"
                  alt="Logic, Inc."
                  width={140}
                  height={47}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                  priority
                />
              </a>
            </div>
          </div>
        </div>

        {/* App Grid */}
        <AppGridWithRouting apps={apps} />

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Fork of <a href="https://github.com/openai/gpt-5-coding-examples" className="text-blue-600 hover:underline">OpenAI&apos;s GPT-5 Coding Examples</a>
          </p>
          <p>
            Built by <a href="https://logic.inc" className="text-blue-600 hover:underline">Logic</a> &middot;{" "}
            <a href="https://github.com/with-logic/gpt-5-vs-opus-4-1-coding-examples" className="text-blue-600 hover:underline">Source on GitHub</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
