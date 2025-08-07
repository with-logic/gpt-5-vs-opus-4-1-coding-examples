export const dynamic = "force-static";
import { loadApps } from "@/lib/code-examples";
import { ComparisonCard } from "@/components/comparison-card";
import Image from "next/image";

export default async function Home() {
  const apps = await loadApps();

  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="mx-auto w-full max-w-7xl py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-mono mb-6">
            GPT-5 vs Claude Opus 4.1
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Head-to-head comparison of AI coding capabilities
          </p>
          <a 
            href="https://github.com/with-logic/gpt-5-vs-opus-4-1-coding-examples" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>

        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Why This Comparison?</h2>
          <p className="text-gray-700 mb-3">
            At <a href="https://logic.inc" className="text-blue-600 hover:underline">Logic</a>, our team starts every feature in Claude Code. Over the past 30 days, more than 85% of our code has been written by Claude. 
            We&apos;ve found incredible success with agentic coding, so naturally we were excited to compare how GPT-5 might improve upon 
            the success we&apos;ve already been having.
          </p>
          <p className="text-gray-700 mb-3">
            Each example below was generated using identical prompts given to both OpenAI&apos;s GPT-5 and Anthropic&apos;s Claude Opus 4.1. 
            All applications were created in a single prompt without manual editing, showcasing the raw capabilities of each model.
          </p>
          <p className="text-gray-700">
            Click on any example to view the implementations and compare their approaches to the same challenge.
          </p>
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <a href="https://logic.inc">
                <Image 
                  src="/logic_logo.png" 
                  alt="Logic, Inc." 
                  width={150} 
                  height={50}
                  className="inline-block"
                  priority
                />
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <ComparisonCard key={app.id} app={app} />
          ))}
        </div>

        <footer className="mt-16 py-8 border-t border-gray-200 text-center text-gray-600">
          <p className="mb-2">
            This is a fork of <a href="https://github.com/openai/gpt-5-coding-examples" className="text-blue-600 hover:underline">OpenAI&apos;s GPT-5 Coding Examples</a>
          </p>
          <p>
            View the source code on <a href="https://github.com/with-logic/gpt-5-vs-opus-4-1-coding-examples" className="text-blue-600 hover:underline">GitHub</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
