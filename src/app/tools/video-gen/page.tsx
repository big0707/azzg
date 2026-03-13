"use client";
import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TaskState = "idle" | "submitting" | "processing" | "completed" | "failed";

export default function VideoGenPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [taskState, setTaskState] = useState<TaskState>("idle");
  const [predictionId, setPredictionId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState("");

  const pollRef = useRef<NodeJS.Timeout | null>(null);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user || null);
    });
    return () => {
      subscription.unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) { setError("Please enter a video description."); return; }
    if (!session) { setError("Please sign in first."); router.push("/auth/login"); return; }

    setTaskState("submitting");
    setError("");
    setVideoUrl("");
    setLogs("");

    try {
      const res = await fetch("/api/proxy/replicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: "video-01",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Failed to create task"); setTaskState("failed"); return; }
      if (!data.id) { setError("No task ID returned. Please try again."); setTaskState("failed"); return; }

      setPredictionId(data.id);
      setTaskState("processing");
      startPolling(data.id);
    } catch (err: any) {
      setError(`Request failed: ${err?.message || String(err)}`);
      setTaskState("failed");
    }
  }

  function startPolling(pid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/proxy/replicate?id=${pid}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` },
        });
        const data = await res.json();

        setLogs(prev => {
          const ts = new Date().toLocaleTimeString();
          const line = `[${ts}] Status: ${data.status || data.error || 'polling...'}`;
          return prev ? prev + '\n' + line : line;
        });

        if (data.error && !data.status) {
          // API error but not a task failure
          return;
        }

        if (data.status === "succeeded") {
          setTaskState("completed");
          setVideoUrl(data.video_url || "");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "failed" || data.status === "canceled") {
          setTaskState("failed");
          setError(data.error || "Video generation failed.");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (err) { 
        console.error("Polling error:", err);
      }
    }, 5000);
  }

  function resetForm() {
    setTaskState("idle");
    setPredictionId("");
    setVideoUrl("");
    setError("");
    setLogs("");
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/tools" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">← Back to Tools</Link>
            <h1 className="text-3xl font-bold">🎬 AI Video Generator</h1>
            <p className="text-gray-400 mt-1">Generate videos from text descriptions — powered by Minimax Video-01</p>
          </div>
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Dashboard</Link>
          ) : (
            <Link href="/auth/login" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition">Sign In</Link>
          )}
        </div>

        {/* Input */}
        {(["idle", "failed"] as TaskState[]).includes(taskState) && (
          <div className="border border-white/10 rounded-xl p-6 bg-white/5 mb-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Video Description *</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create...&#10;&#10;e.g. A golden retriever running through a sunlit meadow in slow motion, cinematic 4K"
                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none resize-none h-32"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{prompt.length}/1000</p>
            </div>

            {/* Tips */}
            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-sm text-indigo-300 font-medium mb-2">💡 Tips for better results:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Be specific: describe camera angle, lighting, movement</li>
                <li>• Include style keywords: cinematic, slow motion, aerial, close-up</li>
                <li>• Mention quality: 4K, high quality, detailed</li>
                <li>• Describe the scene, not just the subject</li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={taskState === "submitting" || !prompt.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {taskState === "submitting" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Submitting...
                </span>
              ) : "🚀 Generate Video"}
            </button>

            {!user && (
              <p className="text-center text-gray-500 text-xs mt-3">
                <Link href="/auth/login" className="text-indigo-400 hover:underline">Sign in</Link> to generate videos
              </p>
            )}
          </div>
        )}

        {/* Processing */}
        {taskState === "processing" && (
          <div className="border border-white/10 rounded-xl p-8 bg-white/5 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
              <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Generating Your Video</h2>
            <p className="text-gray-400 mb-4">This typically takes 2-5 minutes...</p>
            <p className="text-xs text-gray-500 mb-4">ID: {predictionId.slice(0, 12)}...</p>

            {logs && (
              <div className="mt-4 p-3 bg-black/30 rounded-lg text-left max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-400 whitespace-pre-wrap">{logs}</pre>
              </div>
            )}

            <div className="mt-6 p-4 bg-white/5 rounded-lg text-sm text-gray-400">
              ⏱️ Please keep this page open. The AI model is creating your video in the cloud.
            </div>
          </div>
        )}

        {/* Completed */}
        {taskState === "completed" && videoUrl && (
          <div className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-green-400">✅ Video Ready!</h2>
                <p className="text-gray-400 text-sm mt-1 max-w-md truncate">{prompt}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition"
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition"
                >
                  Generate Another
                </button>
              </div>
            </div>
            <div className="p-6">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: "500px" }}
              />
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 border border-white/10 rounded-xl p-6 bg-white/5">
          <h3 className="text-lg font-bold mb-4">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "✏️", title: "Describe", desc: "Write what you want to see in the video" },
              { icon: "🤖", title: "AI Generates", desc: "Minimax Video-01 creates your video in the cloud" },
              { icon: "⬇️", title: "Download", desc: "Get your video ready to share anywhere" },
            ].map(s => (
              <div key={s.title} className="text-center p-4">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
