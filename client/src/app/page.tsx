export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Adaptive Learning Intelligence Platform (ALIP)
          </h1>
          <p className="mt-3 max-w-3xl text-gray-600">
            An AI-powered learning workspace for summarization, explanations,
            question answering, and assessment support.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              Study Content
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Paste your learning material, notes, article, or study topic below.
            </p>

            <textarea
              placeholder="Paste your study content here..."
              className="mb-4 h-64 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-black"
            />

            <div className="flex flex-wrap gap-3">
              <button className="rounded-lg bg-black px-5 py-2.5 text-white">
                Summarize
              </button>
              <button className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-800">
                Explain
              </button>
              <button className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-800">
                Generate Quiz
              </button>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              Ask a Related Question
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Ask follow-up questions based on the study content you provided.
            </p>

            <input
              type="text"
              placeholder="e.g. Explain this topic in simple terms"
              className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-black"
            />

            <button className="mb-6 rounded-lg bg-black px-5 py-2.5 text-white">
              Ask AI
            </button>

            <div className="rounded-xl bg-gray-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Response Panel
              </h3>
              <p className="text-sm text-gray-600">
                AI responses such as summaries, explanations, answers, and quiz
                output will appear here.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}