"use client";

import { ChangeEvent, useState } from "react";

type ThemeMode = "dark" | "light";
type OutputView = "summary" | "explanation" | "questions" | null;

type GeneratedQuestion = {
  type: "Multiple Choice" | "Short Answer" | "True / False";
  prompt: string;
  options?: string[];
};

const sampleQuestions: GeneratedQuestion[] = [
  {
    type: "Multiple Choice",
    prompt: "What is the primary purpose of the provided study material?",
    options: [
      "Entertainment only",
      "Support understanding and revision",
      "Replace all examinations",
      "Measure device performance",
    ],
  },
  {
    type: "Short Answer",
    prompt: "Write one key concept you learned from this material.",
  },
  {
    type: "True / False",
    prompt:
      "The learner should use generated questions to strengthen understanding.",
  },
];

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [content, setContent] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [outputView, setOutputView] = useState<OutputView>(null);

  const [summaryText, setSummaryText] = useState("");
  const [explanationText, setExplanationText] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const acceptedFileTypes =
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";
  const hasTypedContent = content.length > 0;
  const hasLearningSource = Boolean(content.trim() || uploadedFileName);

  const isDark = theme === "dark";

  const palette = {
    dark: {
      page: "bg-[#0B1320] text-white",
      surface: "bg-[#111A2B] border-white/10",
      surfaceSoft: "bg-[#0F1726] border-white/10",
      textMain: "text-white",
      textBody: "text-slate-300",
      textMuted: "text-slate-400",
      primary: "bg-[#14B8A6] text-[#0B1320] hover:bg-[#0FB5A3]",
      secondary:
        "bg-transparent text-white border-white/12 hover:bg-[#8B5CF6] hover:border-[#8B5CF6]",
      selected: "bg-[#8B5CF6] text-white border-[#8B5CF6]",
      clear:
        "bg-transparent text-slate-200 border-white/12 hover:bg-white/8",
      tabIdle:
        "bg-transparent text-slate-200 border-white/10 hover:bg-white/5",
      tabActive: "bg-[#14B8A6] text-[#0B1320] border-[#14B8A6]",
      chip: "bg-white/5 border-white/10 text-slate-300",
      heroGlow:
        "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_30%)]",
    },
    light: {
      page: "bg-[#F6F8FC] text-slate-900",
      surface: "bg-white border-slate-200",
      surfaceSoft: "bg-[#F9FBFF] border-slate-200",
      textMain: "text-slate-950",
      textBody: "text-slate-700",
      textMuted: "text-slate-500",
      primary: "bg-[#0F766E] text-white hover:bg-[#0D6B64]",
      secondary:
        "bg-white text-slate-900 border-slate-300 hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6]",
      selected: "bg-[#8B5CF6] text-white border-[#8B5CF6]",
      clear:
        "bg-white text-slate-700 border-slate-300 hover:bg-slate-100",
      tabIdle:
        "bg-white text-slate-700 border-slate-300 hover:bg-slate-100",
      tabActive: "bg-[#0F766E] text-white border-[#0F766E]",
      chip: "bg-white border-slate-300 text-slate-700",
      heroGlow:
        "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_30%)]",
    },
  }[theme];

  const handleGoHome = () => {
    setOutputView(null);
  };

  const handlePickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
  };

  const handleSubmitSource = async () => {
    if (!pendingFile) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", pendingFile);

      const response = await fetch("http://127.0.0.1:8000/extract-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to extract text.");
      }

      setUploadedFileName(data.filename);
      setContent(data.content);
      setPendingFile(null);
      setOutputView(null);
    } catch (error) {
      console.error(error);
      alert("Upload failed. The file may not be supported or readable.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!hasLearningSource) return;

    try {
      setIsSummarizing(true);
      setOutputView("summary");
      setSummaryText("Generating summary...");

      const response = await fetch("http://127.0.0.1:8000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate summary.");
      }

      setSummaryText(data.summary || "No summary returned.");
    } catch (error) {
      console.error(error);
      setSummaryText("Error generating summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateExplanation = () => {
    if (!hasLearningSource) return;

    setOutputView("explanation");
    setExplanationText(
      `Explanation preview:\n\nThis section will next be connected to the backend so the system can explain the uploaded or pasted material in a clearer, more learner-friendly way.`
    );
  };

  const handleGenerateQuestions = () => {
    if (!hasLearningSource) return;

    setOutputView("questions");
    setGeneratedQuestions(sampleQuestions);
  };

  const handleClear = () => {
    setContent("");
    setUploadedFileName("");
    setPendingFile(null);
    setOutputView(null);
    setSummaryText("");
    setExplanationText("");
    setGeneratedQuestions([]);
  };

  const actionBase =
    "w-full rounded-2xl border px-5 py-3 text-sm font-semibold transition duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 hover:-translate-y-0.5 active:scale-[0.99]";

  const tabBase =
    "rounded-xl border px-4 py-2 text-sm font-medium transition duration-200 cursor-pointer";

  const themeButtonClass = `grid h-10 w-10 place-items-center rounded-xl border transition duration-200 hover:-translate-y-0.5 ${
    isDark
      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
  }`;

  return (
    <main
      className={`min-h-screen transition-colors duration-500 ${palette.page}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-64 blur-3xl ${palette.heroGlow}`}
      />

      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-500 ${palette.surface}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={handleGoHome}
            className="group flex items-center gap-3 text-left cursor-pointer"
            aria-label="Go to home"
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl border text-sm font-bold transition-transform duration-200 group-hover:scale-105 ${palette.surfaceSoft}`}
            >
              M
            </div>
            <div className="leading-tight">
              <p className={`text-lg font-bold ${palette.textMain}`}>Mwakenya</p>
              <p className={`text-[11px] ${palette.textMuted}`}>
                Adaptive Learning Intelligence Platform
              </p>
            </div>
          </button>

          <button
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            className={themeButtonClass}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            <span className="text-lg">{isDark ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section
          className={`rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] transition-all duration-300 ${palette.surface}`}
        >
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="mb-4">
                <h1 className={`text-2xl font-semibold ${palette.textMain}`}>
                  Document Workspace
                </h1>
                <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                  Paste notes or upload a learning document. Mwakenya will use
                  this material as the source for summary, explanation, and
                  revision questions.
                </p>
              </div>

              <div
                className={`rounded-3xl border p-4 transition-all duration-300 ${palette.surfaceSoft}`}
              >
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (e.target.value.length > 0) {
                      setUploadedFileName("");
                      setPendingFile(null);
                    }
                  }}
                  placeholder="Paste lecture notes, article text, revision material, or study content here..."
                  className={`min-h-[340px] w-full resize-none rounded-3xl border p-5 text-sm outline-none transition duration-300 ${palette.surface} ${palette.textMain}`}
                />

                {!hasTypedContent && (
                  <div
                    className={`mt-4 rounded-3xl border border-dashed p-6 text-center transition-all duration-300 ${palette.surface}`}
                  >
                    <label className="flex cursor-pointer flex-col items-center justify-center">
                      <span className={`text-base font-semibold ${palette.textMain}`}>
                        Upload learning document
                      </span>
                      <span className={`mt-2 text-sm ${palette.textBody}`}>
                        PDF, DOCX, PPTX, XLSX, TXT, CSV
                      </span>
                      <input
                        type="file"
                        accept={acceptedFileTypes}
                        onChange={handlePickFile}
                        className="hidden"
                      />
                    </label>

                    {pendingFile && (
                      <div className="mt-4 flex flex-col items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                        >
                          Selected: {pendingFile.name}
                        </span>
                        <button
                          onClick={handleSubmitSource}
                          disabled={isUploading}
                          className={`${actionBase} max-w-xs ${palette.primary}`}
                        >
                          {isUploading ? "Uploading..." : "Submit Source"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(uploadedFileName || hasTypedContent) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {uploadedFileName && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                      >
                        Uploaded: {uploadedFileName}
                      </span>
                    )}
                    {hasTypedContent && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                      >
                        Text ready
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h2 className={`text-2xl font-semibold ${palette.textMain}`}>
                  Generate Study Support
                </h2>
                <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                  Pick what you want Mwakenya to generate from the source material.
                </p>
              </div>

              <div
                className={`space-y-3 rounded-3xl border p-4 transition-all duration-300 ${palette.surfaceSoft}`}
              >
                <button
                  onClick={handleGenerateSummary}
                  disabled={!hasLearningSource || isSummarizing}
                  className={`${actionBase} ${
                    outputView === "summary"
                      ? palette.selected
                      : palette.primary
                  }`}
                >
                  {isSummarizing ? "Generating..." : "Generate Summary"}
                </button>

                <button
                  onClick={handleGenerateExplanation}
                  disabled={!hasLearningSource}
                  className={`${actionBase} ${
                    outputView === "explanation"
                      ? palette.selected
                      : palette.secondary
                  }`}
                >
                  Generate Explanation
                </button>

                <button
                  onClick={handleGenerateQuestions}
                  disabled={!hasLearningSource}
                  className={`${actionBase} ${
                    outputView === "questions"
                      ? palette.selected
                      : palette.secondary
                  }`}
                >
                  Generate Questions
                </button>

                <button onClick={handleClear} className={`${actionBase} ${palette.clear}`}>
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`mt-6 rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] transition-all duration-300 ${palette.surface}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`text-2xl font-semibold ${palette.textMain}`}>
                Study Output
              </h2>
              <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                Your generated learning support appears here after you select an
                action.
              </p>
            </div>

            {outputView && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOutputView("summary")}
                  className={`${tabBase} ${
                    outputView === "summary"
                      ? palette.tabActive
                      : palette.tabIdle
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setOutputView("explanation")}
                  className={`${tabBase} ${
                    outputView === "explanation"
                      ? palette.tabActive
                      : palette.tabIdle
                  }`}
                >
                  Explanation
                </button>
                <button
                  onClick={() => setOutputView("questions")}
                  className={`${tabBase} ${
                    outputView === "questions"
                      ? palette.tabActive
                      : palette.tabIdle
                  }`}
                >
                  Questions
                </button>
              </div>
            )}
          </div>

          {!outputView && (
            <div
              className={`mt-6 rounded-3xl border p-6 ${palette.surfaceSoft}`}
            >
              <h3 className={`text-lg font-semibold ${palette.textMain}`}>
                Ready to begin
              </h3>
              <p className={`mt-3 text-sm leading-7 ${palette.textBody}`}>
                Add your learning material first, then choose whether you want
                a summary, an explanation, or generated revision questions.
              </p>
            </div>
          )}

          {outputView === "summary" && (
            <div
              className={`mt-6 rounded-3xl border p-6 ${palette.surfaceSoft}`}
            >
              <h3 className={`text-lg font-semibold ${palette.textMain}`}>
                Generated Summary
              </h3>
              <p className={`mt-3 whitespace-pre-line text-sm leading-7 ${palette.textBody}`}>
                {summaryText}
              </p>
            </div>
          )}

          {outputView === "explanation" && (
            <div
              className={`mt-6 rounded-3xl border p-6 ${palette.surfaceSoft}`}
            >
              <h3 className={`text-lg font-semibold ${palette.textMain}`}>
                Generated Explanation
              </h3>
              <p className={`mt-3 whitespace-pre-line text-sm leading-7 ${palette.textBody}`}>
                {explanationText}
              </p>
            </div>
          )}

          {outputView === "questions" && (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div
                className={`rounded-3xl border p-6 ${palette.surfaceSoft}`}
              >
                <h3 className={`text-lg font-semibold ${palette.textMain}`}>
                  Generated Revision Questions
                </h3>
                <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                  These should be generated from the uploaded or pasted source
                  to help the learner revise and understand the material better.
                </p>

                <div className="mt-5 space-y-4">
                  {generatedQuestions.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl border p-4 ${palette.surface}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-semibold ${palette.textMain}`}>
                          Question {index + 1}
                        </p>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${palette.chip}`}
                        >
                          {item.type}
                        </span>
                      </div>

                      <p className={`mt-3 text-sm leading-7 ${palette.textBody}`}>
                        {item.prompt}
                      </p>

                      {item.options && (
                        <div className="mt-4 space-y-2">
                          {item.options.map((option) => (
                            <div
                              key={option}
                              className={`rounded-xl border px-3 py-2 text-sm ${palette.surface}`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-3xl border p-6 ${palette.surfaceSoft}`}
              >
                <h3 className={`text-lg font-semibold ${palette.textMain}`}>
                  Assessment Value
                </h3>
                <p className={`mt-2 text-sm leading-6 ${palette.textBody}`}>
                  The question set can include multiple-choice, short-answer,
                  and true/false items based on the same source material.
                </p>

                <div className="mt-5 space-y-3">
                  <div className={`rounded-2xl border p-4 ${palette.surface}`}>
                    <p className={`text-sm font-semibold ${palette.textMain}`}>
                      Question styles
                    </p>
                    <ul className={`mt-3 space-y-2 text-sm ${palette.textBody}`}>
                      <li>• Multiple-choice questions</li>
                      <li>• Short-answer questions</li>
                      <li>• True / False questions</li>
                    </ul>
                  </div>

                  <div className={`rounded-2xl border p-4 ${palette.surface}`}>
                    <p className={`text-sm font-semibold ${palette.textMain}`}>
                      Why this matters
                    </p>
                    <p className={`mt-3 text-sm leading-6 ${palette.textBody}`}>
                      It helps the learner move from passive reading into active
                      recall, understanding, and revision.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}