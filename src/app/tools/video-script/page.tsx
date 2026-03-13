"use client";
import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ScriptResult = {
  title: string;
  hook: string;
  scenes: { scene: number; visual: string; narration: string; duration: string }[];
  bgm: string;
  style: string;
  totalDuration: string;
};

const platformOptions = [
  { id: "douyin", label: "抖音/TikTok", icon: "🎵", desc: "15-60s vertical" },
  { id: "youtube-short", label: "YouTube Shorts", icon: "▶️", desc: "≤60s vertical" },
  { id: "youtube", label: "YouTube", icon: "📺", desc: "3-10min horizontal" },
  { id: "xiaohongshu", label: "小红书", icon: "📕", desc: "1-3min vertical" },
  { id: "bilibili", label: "B站", icon: "📺", desc: "3-10min horizontal" },
];

const toneOptions = [
  { id: "engaging", label: "Engaging & Fun", emoji: "🎉" },
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "storytelling", label: "Storytelling", emoji: "📖" },
  { id: "educational", label: "Educational", emoji: "🎓" },
  { id: "dramatic", label: "Dramatic", emoji: "🎬" },
];

const languageOptions = [
  { id: "zh", label: "中文" },
  { id: "en", label: "English" },
  { id: "zh-en", label: "中英双语" },
];

export default function VideoScriptPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("douyin");
  const [tone, setTone] = useState("engaging");
  const [language, setLanguage] = useState("zh");
  const [extraNotes, setExtraNotes] = useState("");
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [streamText, setStreamText] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user || null);
      setLoading(false);
    }
    checkAuth();
  }, []);

  async function handleGenerate() {
    if (!topic.trim()) return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    setGenerating(true);
    setError("");
    setResult(null);
    setRawText("");
    setStreamText("");

    const selectedPlatform = platformOptions.find(p => p.id === platform);
    const selectedTone = toneOptions.find(t => t.id === tone);
    const langLabel = languageOptions.find(l => l.id === language)?.label || "中文";

    const prompt = `You are a professional video script writer. Generate a detailed video script based on the following:

Topic: ${topic}
Platform: ${selectedPlatform?.label} (${selectedPlatform?.desc})
Tone: ${selectedTone?.label}
Language: ${langLabel}
${extraNotes ? `Additional notes: ${extraNotes}` : ""}

Return a JSON object (no markdown, no code blocks, pure JSON) with this exact structure:
{
  "title": "Video title",
  "hook": "Opening hook to grab attention in first 3 seconds",
  "scenes": [
    {
      "scene": 1,
      "visual": "Description of what appears on screen",
      "narration": "What the narrator/speaker says",
      "duration": "5s"
    }
  ],
  "bgm": "Suggested background music style/mood",
  "style": "Visual style recommendation",
  "totalDuration": "Estimated total duration"
}

Make the script compelling, platform-appropriate, and ready to produce. Include 4-8 scenes depending on platform duration. The narration should be natural and ${selectedTone?.label.toLowerCase()}.`;

    try {
      const res = await fetch("/api/proxy/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed. Please try again.");
        setGenerating(false);
        return;
      }

      const content = data.choices?.[0]?.message?.content || "";
      setRawText(content);

      // Try to parse JSON from response
      try {
        // Strip markdown code blocks if present (handles ```json, ``` with newlines, etc.)
        let jsonStr = content;
        // Remove leading/trailing markdown fences
        const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
        if (fenceMatch) {
          jsonStr = fenceMatch[1];
        } else {
          jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
        }
        jsonStr = jsonStr.trim();
        const parsed = JSON.parse(jsonStr);
        setResult(parsed);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch {
        // If JSON parsing fails, show raw text
        setError("AI returned non-standard format. Showing raw output.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    }

    setGenerating(false);
  }

  function handleCopy() {
    if (result) {
      const text = formatScriptAsText(result);
      navigator.clipboard.writeText(text);
    } else if (rawText) {
      navigator.clipboard.writeText(rawText);
    }
  }

  function formatScriptAsText(r: ScriptResult): string {
    let text = `📹 ${r.title}\n\n`;
    text += `🎣 Hook: ${r.hook}\n\n`;
    text += `--- Scenes ---\n\n`;
    r.scenes.forEach(s => {
      text += `Scene ${s.scene} (${s.duration})\n`;
      text += `  🎬 Visual: ${s.visual}\n`;
      text += `  🗣️ Narration: ${s.narration}\n\n`;
    });
    text += `🎵 BGM: ${r.bgm}\n`;
    text += `🎨 Style: ${r.style}\n`;
    text += `⏱️ Duration: ${r.totalDuration}\n`;
    return text;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/tools" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">← Back to Tools</Link>
            <h1 className="text-3xl font-bold">🎬 AI Video Script Generator</h1>
            <p className="text-gray-400 mt-1">Generate professional video scripts in seconds</p>
          </div>
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Dashboard</Link>
          ) : (
            <Link href="/auth/login" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition">Sign In</Link>
          )}
        </div>

        {/* Input Section */}
        <div className="border border-white/10 rounded-xl p-6 bg-white/5 mb-8">
          {/* Topic */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Video Topic *</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 AI tools that will change how you work in 2026"
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none resize-none h-24"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{topic.length}/500</p>
          </div>

          {/* Platform */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {platformOptions.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`p-3 rounded-lg text-center text-sm transition ${
                    platform === p.id
                      ? "bg-indigo-600 border-indigo-500 border"
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="text-lg mb-1">{p.icon}</div>
                  <div className="font-medium text-xs">{p.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      tone === t.id
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <div className="flex gap-2">
                {languageOptions.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition ${
                      language === l.id
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Extra Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes (optional)</label>
            <input
              type="text"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="e.g. Include a call-to-action at the end, target audience: Gen Z"
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Generating Script...
              </span>
            ) : (
              "🚀 Generate Script"
            )}
          </button>

          {!user && (
            <p className="text-center text-gray-500 text-xs mt-3">
              You need to <Link href="/auth/login" className="text-indigo-400 hover:underline">sign in</Link> to generate scripts
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div ref={resultRef} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
            {/* Result Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">{result.title}</h2>
                <div className="flex gap-3 text-sm text-gray-400">
                  <span>⏱️ {result.totalDuration}</span>
                  <span>🎨 {result.style}</span>
                  <span>🎵 {result.bgm}</span>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition shrink-0"
              >
                📋 Copy
              </button>
            </div>

            {/* Hook */}
            <div className="p-6 border-b border-white/10 bg-yellow-500/5">
              <div className="text-xs text-yellow-400 font-semibold mb-1">🎣 HOOK</div>
              <p className="text-lg">{result.hook}</p>
            </div>

            {/* Scenes */}
            <div className="divide-y divide-white/5">
              {result.scenes.map((scene) => (
                <div key={scene.scene} className="p-6 hover:bg-white/[0.02] transition">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                      {scene.scene}
                    </span>
                    <span className="text-xs text-gray-500">{scene.duration}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">🎬 Visual</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{scene.visual}</p>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">🗣️ Narration</div>
                      <p className="text-sm leading-relaxed">{scene.narration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw fallback */}
        {!result && rawText && (
          <div ref={resultRef} className="border border-white/10 rounded-xl p-6 bg-white/5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Generated Script</h2>
              <button onClick={handleCopy} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">
                📋 Copy
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">{rawText}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
