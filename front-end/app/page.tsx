export const dynamic = "force-static";
import { loadApps } from "@/lib/code-examples";
import { AppGridWithRouting } from "@/components/app-grid-with-routing";
import { MODELS } from "@/lib/models";
import Link from "next/link";

export default async function Home() {
  const apps = await loadApps();

  return (
    <div className="font-sans min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logic_brandmark.png" alt="Logic" className="w-8 h-8" />
            <span className="font-semibold text-neutral-900">Logic's Agentic Coding Arena</span>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://logic.inc"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              by Logic
            </a>
            <a
              href="https://github.com/with-logic/gpt-5-vs-opus-4-1-coding-examples"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <div className="py-10 md:py-14">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 tracking-tight max-w-3xl">
            Compare how frontier AI models create small apps.
          </h1>
          <p className="mt-4 text-lg text-neutral-500 max-w-2xl">
            {apps.length} apps, each built by {MODELS.length} different models from the same prompt.
            No editing, no cherry-picking.
          </p>

          {/* Models */}
          <div className="mt-8 mb-10 flex flex-wrap gap-2">
            {MODELS.map((model) => (
              <span
                key={model.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full text-sm text-neutral-700"
              >
                <span className={`w-2 h-2 rounded-full ${model.color}`} />
                {model.name}
              </span>
            ))}
          </div>

          <AppGridWithRouting apps={apps} />
        </div>

        {/* Footer */}
        <footer className="py-12 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-neutral-500">
            <p>
              Prompts from{" "}
              <a href="https://github.com/openai/gpt-5-coding-examples" className="text-neutral-900 hover:underline">
                OpenAI
              </a>
              . Built by{" "}
              <a href="https://logic.inc" className="text-neutral-900 hover:underline">
                Logic
              </a>
              .
            </p>
            <a
              href="https://github.com/with-logic/gpt-5-vs-opus-4-1-coding-examples"
              className="text-neutral-900 hover:underline"
            >
              View source
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
