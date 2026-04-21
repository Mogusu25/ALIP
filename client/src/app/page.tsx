"use client";

import { ChangeEvent, useMemo, useState } from "react";

type ThemeMode = "dark" | "light";
type OutputTab = "summary" | "explanation" | "quiz" | "flashcards";

type ExtractTextResponse = {
  filename: string;
  content: string;
};

type SummarizeResponse = {
  summary: string;
};

type ApiError = {
  detail?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const sampleQuiz = [
  {
    type: "Multiple Choice",
    question: "What is the central idea in this learning material?",
    options: [
      "A minor side note from the text",
      "The main concept the learner should understand",
      "Only the conclusion paragraph",
      "A random definition with no relation",
    ],
  },
  {
    type: "Short Answer",
    question:
      "State one important point a student should revise from this topic.",
  },
  {
    type: "True / False",
    question: "Active recall helps learners prepare better for exams.",
  },
];

const sampleFlashcards = [
  {
    front: "Key Concept",
    back: "A main idea from the study material that should be remembered for revision.",
  },
  {
    front: "Definition",
    back: "An important meaning or explanation that helps the learner understand the topic.",
  },
  {
    front: "Application",
    back: "How the concept can be used in examples, practice, or exam questions.",
  },
];

export default function Page() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("summary");

  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const acceptedFileTypes = useMemo(
    () => ".pdf,.docx,.xlsx,.pptx,.txt,.csv",
    []
  );

  const hasContent = Boolean(content.trim());
  const isDark = theme === "dark";

  const palette = isDark
    ? {
        pageBg: "bg-[#0f172a]",
        pageText: "text-slate-100",
        card: "bg-[#111827] border-slate-700/80",
        cardSoft: "bg-[#1f2937] border-slate-700/80",
        textMain: "text-white",
        textBody: "text-slate-300",
        textMuted: "text-slate-400",
        input:
          "bg-[#0b1220] border-slate-700 text-slate-100 placeholder:text-slate-500",
        primary:
          "bg-teal-500 hover:bg-teal-400 text-slate-950 border-teal-500",
        secondary:
          "bg-transparent hover:bg-slate-800 text-slate-100 border-slate-600",
        tabActive: "bg-violet-500 text-white border-violet-500",
        tabIdle:
          "bg-transparent text-slate-300 border-slate-600 hover:bg-slate-800",
        chip: "bg-slate-800 text-slate-200 border-slate-600",
        success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        error: "border-rose-400/30 bg-rose-500/10 text-rose-300",
        badge:
          "border-teal-400/20 bg-teal-400/10 text-teal-300",
        topbar:
          "border-slate-700/70 bg-slate-950/60",
      }
    : {
        pageBg: "bg-[#f8fafc]",
        pageText: "text-slate-900",
        card: "bg-white/95 border-slate-200",
        cardSoft: "bg-[#fcfcff] border-slate-200",
        textMain: "text-slate-950",
        textBody: "text-slate-700",
        textMuted: "text-slate-500",
        input:
          "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
        primary:
          "bg-teal-600 hover:bg-teal-700 text-white border-teal-600",
        secondary:
          "bg-white hover:bg-slate-50 text-slate-800 border-slate-300",
        tabActive: "bg-violet-600 text-white border-violet-600",
        tabIdle:
          "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
        chip: "bg-slate-50 text-slate-700 border-slate-300",
        success: "border-emerald-300 bg-emerald-50 text-emerald-700",
        error: "border-rose-300 bg-rose-50 text-rose-700",
        badge:
          "border-teal-300/40 bg-teal-50 text-teal-700",
        topbar:
          "border-slate-200/70 bg-white/70",
      };

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const parseError = async (response: Response): Promise<string> => {
    try {
      const data = (await response.json()) as ApiError;
      return data.detail || "Something went wrong. Please try again.";
    } catch {
      return "Something went wrong. Please try again.";
    }
  };

  const handlePickFile = (event: ChangeEvent<HTMLInputElement>) => {
    resetMessages();
    const file = event.target.files?.[0] ?? null;
    setPendingFile(file);
  };

  const handleExtractText = async () => {
    if (!pendingFile) {
      setErrorMessage("Please choose a file first.");
      return;
    }

    resetMessages();

    try {
      setIsUploading(true);
      setSummary("");

      const formData = new FormData();
      formData.append("file", pendingFile);

      const response = await fetch(`${API_BASE_URL}/extract-text`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as ExtractTextResponse;

      setUploadedFileName(data.filename);
      setContent(data.content);
      setPendingFile(null);
      setActiveTab("summary");
      setSuccessMessage("Your study material is ready.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not process that file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!hasContent) {
      setErrorMessage("Please paste text or upload a document first.");
      return;
    }

    resetMessages();
    setActiveTab("summary");

    try {
      setIsSummarizing(true);
      setSummary("Generating summary...");

      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as SummarizeResponse;
      const cleanSummary =
        typeof data.summary === "string" ? data.summary.trim() : "";

      setSummary(cleanSummary || "No summary was returned.");
      setSuccessMessage("Summary generated successfully.");
    } catch (error) {
      setSummary("");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not generate the summary. Please try again."
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleClear = () => {
    setContent("");
    setSummary("");
    setUploadedFileName("");
    setPendingFile(null);
    setErrorMessage("");
    setSuccessMessage("");
    setActiveTab("summary");

    const input = document.getElementById("file-upload") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const actionButton =
    "w-full rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const tabButton =
    "rounded-xl border px-4 py-2 text-sm font-medium transition";

  const renderTabContent = () => {
    if (activeTab === "summary") {
      return (
        <div
          className={`min-h-[320px] whitespace-pre-wrap rounded-2xl border p-5 text-sm leading-7 ${palette.input}`}
        >
          {summary ||
            "Generate a summary to turn your material into revision-friendly notes."}
        </div>
      );
    }

    if (activeTab === "explanation") {
      return (
        <div className={`rounded-2xl border p-5 ${palette.cardSoft}`}>
          <h3 className={`text-lg font-semibold ${palette.textMain}`}>
            Explanation Mode
          </h3>
          <p className={`mt-3 text-sm leading-7 ${palette.textBody}`}>
            ALIP will explain difficult ideas in simpler language, step by step,
            like a study coach.
          </p>
          <div className={`mt-4 rounded-2xl border p-4 ${palette.card}`}>
            <p className={`text-sm font-semibold ${palette.textMain}`}>
              Coming next
            </p>
            <p className={`mt-2 text-sm leading-7 ${palette.textBody}`}>
              The frontend is ready. Next we connect the backend so explanations
              are generated from the uploaded notes.
            </p>
          </div>
        </div>
      );
    }

    if (activeTab === "quiz") {
      return (
        <div className="space-y-4">
          {sampleQuiz.map((item, index) => (
            <div key={index} className={`rounded-2xl border p-5 ${palette.cardSoft}`}>
              <div className="flex items-center justify-between gap-3">
                <h4 className={`text-base font-semibold ${palette.textMain}`}>
                  Question {index + 1}
                </h4>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                >
                  {item.type}
                </span>
              </div>

              <p className={`mt-3 text-sm leading-7 ${palette.textBody}`}>
                {item.question}
              </p>

              {"options" in item && item.options ? (
                <div className="mt-4 space-y-2">
                  {item.options.map((option) => (
                    <div
                      key={option}
                      className={`rounded-xl border px-4 py-3 text-sm ${palette.card}`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sampleFlashcards.map((card, index) => (
          <div key={index} className={`rounded-2xl border p-5 ${palette.cardSoft}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${palette.textMuted}`}>
              Front
            </p>
            <h3 className={`mt-2 text-lg font-semibold ${palette.textMain}`}>
              {card.front}
            </h3>

            <div className="my-4 border-t border-slate-300/40 dark:border-slate-700/60" />

            <p className={`text-xs font-semibold uppercase tracking-wide ${palette.textMuted}`}>
              Back
            </p>
            <p className={`mt-2 text-sm leading-7 ${palette.textBody}`}>
              {card.back}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className={`min-h-screen ${palette.pageBg} ${palette.pageText}`}>
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${palette.topbar}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className={`text-xl font-bold ${palette.textMain}`}>ALIP</p>
            <p className={`text-xs ${palette.textMuted}`}>Your AI Study Coach</p>
          </div>

          <button
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            className={`grid h-10 w-10 place-items-center rounded-xl border ${palette.secondary}`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            <span className="text-lg">{isDark ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className={`rounded-[28px] border p-6 shadow-sm ${palette.card}`}>
          <div
            className={`mb-4 inline-flex rounded-full border px-4 py-1 text-xs font-semibold tracking-wide ${palette.badge}`}
          >
            EXAM REVISION PLATFORM
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div>
                <h1 className={`text-3xl font-bold tracking-tight ${palette.textMain}`}>
                  Study smarter with ALIP
                </h1>

                <p className={`mt-3 max-w-3xl text-sm leading-7 ${palette.textBody}`}>
                  Upload your notes or paste study material. ALIP helps learners
                  summarize content, prepare for exams, practice with quizzes,
                  and revise with more confidence.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {["Summaries", "Explanations", "Quizzes", "Flashcards"].map((item) => (
                  <div key={item} className={`rounded-2xl border p-4 shadow-sm ${palette.cardSoft}`}>
                    <p className={`text-sm font-semibold ${palette.textMain}`}>{item}</p>
                    <p className={`mt-1 text-xs ${palette.textMuted}`}>
                      Study coach support
                    </p>
                  </div>
                ))}
              </div>

              <div className={`rounded-2xl border p-5 ${palette.cardSoft}`}>
                <h2 className={`text-lg font-semibold ${palette.textMain}`}>
                  Source Material
                </h2>
                <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                  Paste notes directly or upload a learning document. Supported
                  files: PDF, DOCX, XLSX, PPTX, TXT, CSV.
                </p>

                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (e.target.value.trim().length > 0) {
                      setUploadedFileName("");
                    }
                  }}
                  placeholder="Paste lecture notes, revision notes, article text, or topic content here..."
                  className={`mt-4 min-h-[240px] w-full resize-none rounded-2xl border p-5 text-sm outline-none ${palette.input}`}
                />

                <div className={`mt-4 rounded-2xl border border-dashed p-4 ${palette.card}`}>
                  <label className="block">
                    <span className={`mb-2 block text-sm font-medium ${palette.textMain}`}>
                      Upload learning document
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      accept={acceptedFileTypes}
                      onChange={handlePickFile}
                      className={`block w-full rounded-xl border px-4 py-3 text-sm ${palette.input}`}
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {pendingFile && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                      >
                        Selected: {pendingFile.name}
                      </span>
                    )}

                    {uploadedFileName && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                      >
                        Uploaded: {uploadedFileName}
                      </span>
                    )}

                    {hasContent && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                      >
                        Content ready
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={handleExtractText}
                      disabled={!pendingFile || isUploading}
                      className={`${actionButton} ${palette.primary}`}
                    >
                      {isUploading ? "Processing file..." : "Extract Text"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`self-start rounded-2xl border p-4 shadow-sm ${palette.cardSoft}`}>
              <h2 className={`text-lg font-semibold ${palette.textMain}`}>
                Coach Actions
              </h2>
              <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                Choose how ALIP should help you revise.
              </p>

              <div className="mt-4 space-y-2.5">
                <button
                  onClick={handleGenerateSummary}
                  disabled={!hasContent || isSummarizing}
                  className={`${actionButton} ${palette.primary}`}
                >
                  {isSummarizing ? "Generating..." : "Generate Summary"}
                </button>

                <button
                  onClick={() => setActiveTab("explanation")}
                  disabled={!hasContent}
                  className={`${actionButton} ${palette.secondary}`}
                >
                  Explain This Topic
                </button>

                <button
                  onClick={() => setActiveTab("quiz")}
                  disabled={!hasContent}
                  className={`${actionButton} ${palette.secondary}`}
                >
                  Quiz Me
                </button>

                <button
                  onClick={() => setActiveTab("flashcards")}
                  disabled={!hasContent}
                  className={`${actionButton} ${palette.secondary}`}
                >
                  Create Flashcards
                </button>

                <button
                  onClick={handleClear}
                  className={`${actionButton} ${palette.secondary}`}
                >
                  Clear All
                </button>
              </div>

              <div className={`mt-4 rounded-2xl border p-4 ${palette.card}`}>
                <p className={`text-sm font-semibold ${palette.textMain}`}>
                  Study Coach Tip
                </p>
                <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                  Start with a summary, then move to quiz practice. That helps
                  learners shift from passive reading to active revision.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-6 rounded-[28px] border p-5 shadow-sm ${palette.card}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${palette.textMain}`}>
                Study Output
              </h2>
              <p className={`mt-2 text-sm leading-7 ${palette.textBody}`}>
                Review what ALIP has prepared for your revision.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["summary", "explanation", "quiz", "flashcards"] as OutputTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${tabButton} ${
                    activeTab === tab ? palette.tabActive : palette.tabIdle
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">{renderTabContent()}</div>
        </section>

        {errorMessage && (
          <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${palette.error}`}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${palette.success}`}>
            {successMessage}
          </div>
        )}
      </div>
    </main>
  );
}