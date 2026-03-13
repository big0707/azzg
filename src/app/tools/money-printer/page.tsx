"use client";
import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const voiceOptions = [
  { id: "zh-CN-XiaoxiaoNeural-Female", label: "晓晓 (女)", lang: "zh" },
  { id: "zh-CN-YunxiNeural-Male", label: "云希 (男)", lang: "zh" },
  { id: "zh-CN-YunjianNeural-Male", label: "云健 (男)", lang: "zh" },
  { id: "zh-CN-XiaoyiNeural-Female", label: "晓伊 (女)", lang: "zh" },
  { id: "en-US-JennyNeural-Female", label: "Jenny (F)", lang: "en" },
  { id: "en-US-GuyNeural-Male", label: "Guy (M)", lang: "en" },
  { id: "en-US-AriaNeural-Female", label: "Aria (F)", lang: "en" },
];

const aspectOptions = [
  { id: "9:16", label: "竖屏 9:16", desc: "抖音/Shorts", icon: "📱" },
  { id: "16:9", label: "横屏 16:9", desc: "YouTube/B站", icon: "🖥️" },
  { id: "1:1", label: "方形 1:1", desc: "Instagram", icon: "⬜" },
];

type TaskState = "idle" | "submitting" | "processing" | "completed" | "failed";

export default function MoneyPrinterPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [subject, setSubject] = useState("");
  const [aspect, setAspect] = useState("9:16");
  const [voice, setVoice] = useState("zh-CN-XiaoxiaoNeural-Female");
  const [clipDuration, setClipDuration] = useState(5);
  const [videoCount, setVideoCount] = useState(1);
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);
  const [bgmType, setBgmType] = useState("random");

  // Task state
  const [taskState, setTaskState] = useState<TaskState>("idle");
  const [taskId, setTaskId] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [error, setError] = useState("");

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
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function handleGenerate() {
    if (!subject.trim()) return;
    if (!session) { router.push("/auth/login"); return; }

    setTaskState("submitting");
    setError("");
    setVideoUrls([]);
    setProgress(0);
    setStatusMessage("Submitting task...");

    try {
      const res = await fetch("/api/proxy/mpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          endpoint: "/videos",
          video_subject: subject,
          video_aspect: aspect,
          voice_name: voice,
          voice_volume: 1.0,
          voice_rate: 1.0,
          bgm_type: bgmType,
          bgm_volume: 0.2,
          subtitle_enabled: subtitleEnabled,
          subtitle_position: "bottom",
          font_name: "STHeitiMedium.ttc",
          text_fore_color: "#FFFFFF",
          text_background_color: true,
          font_size: 60,
          stroke_color: "#000000",
          stroke_width: 1.5,
          video_clip_duration: clipDuration,
          video_count: videoCount,
          video_concat_mode: "random",
          video_source: "pexels",
          n_threads: 2,
          paragraph_number: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create task");
        setTaskState("failed");
        return;
      }

      const tid = data.data?.task_id;
      if (!tid) {
        setError("No task ID returned");
        setTaskState("failed");
        return;
      }

      setTaskId(tid);
      setTaskState("processing");
      setStatusMessage("Task submitted! Processing...");
      startPolling(tid);
    } catch (err) {
      setError("Network error. Please try again.");
      setTaskState("failed");
    }
  }

  function startPolling(tid: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/proxy/mpt?task_id=${tid}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        const task = data.data;

        if (!task) return;

        const pct = task.progress || 0;
        setProgress(pct);

        if (task.state === "completed" || pct >= 100) {
          setTaskState("completed");
          setStatusMessage("Video generated successfully!");
          if (task.videos && task.videos.length > 0) {
            setVideoUrls(task.videos.map((v: any) => v.url || v));
          }
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (task.state === "failed" || task.state === "error") {
          setTaskState("failed");
          setError(task.message || "Video generation failed");
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          // Map progress to status message
          if (pct < 20) setStatusMessage("🤖 Generating script with AI...");
          else if (pct < 40) setStatusMessage("🗣️ Synthesizing voiceover...");
          else if (pct < 60) setStatusMessage("🔍 Searching for video materials...");
          else if (pct < 80) setStatusMessage("📝 Generating subtitles...");
          else setStatusMessage("🎬 Compositing final video...");
        }
      } catch (err) {
        // Ignore polling errors, keep retrying
      }
    }, 3000);
  }

  function resetForm() {
    setTaskState("idle");
    setTaskId("");
    setProgress(0);
    setStatusMessage("");
    setVideoUrls([]);
    setError("");
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
            <h1 className="text-3xl font-bold">💰 MoneyPrinterTurbo</h1>
            <p className="text-gray-400 mt-1">AI-powered short video generator — one topic, full video in minutes</p>
          </div>
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Dashboard</Link>
          ) : (
            <Link href="/auth/login" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition">Sign In</Link>
          )}
        </div>

        {/* Input Form */}
        {(["idle", "failed"] as TaskState[]).includes(taskState) && (
          <div className="border border-white/10 rounded-xl p-6 bg-white/5 mb-8">
            {/* Subject */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Video Topic *</label>
              <textarea
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. 5 tips to boost your productivity / 春天去哪里旅游最好"
                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none resize-none h-20"
                maxLength={200}
              />
            </div>

            {/* Aspect Ratio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Video Format</label>
              <div className="grid grid-cols-3 gap-3">
                {aspectOptions.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAspect(a.id)}
                    className={`p-3 rounded-lg text-center text-sm transition ${
                      aspect === a.id
                        ? "bg-indigo-600 border-indigo-500 border"
                        : "bg-white/5 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-xl mb-1">{a.icon}</div>
                    <div className="font-medium">{a.label}</div>
                    <div className="text-[10px] text-gray-400">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice + Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg focus:border-indigo-500 outline-none"
                >
                  <optgroup label="中文">
                    {voiceOptions.filter(v => v.lang === "zh").map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="English">
                    {voiceOptions.filter(v => v.lang === "en").map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Clip Duration (seconds)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={clipDuration}
                    onChange={(e) => setClipDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-8">{clipDuration}s</span>
                </div>
              </div>
            </div>

            {/* Options row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subtitleEnabled}
                  onChange={(e) => setSubtitleEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enable Subtitles</span>
              </label>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-500 mb-1">BGM</div>
                <select
                  value={bgmType}
                  onChange={(e) => setBgmType(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                >
                  <option value="random">🎵 Random</option>
                  <option value="no_music">🔇 No Music</option>
                </select>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-500 mb-1">Video Count</div>
                <select
                  value={videoCount}
                  onChange={(e) => setVideoCount(Number(e.target.value))}
                  className="w-full bg-transparent text-sm outline-none"
                >
                  <option value={1}>1 video</option>
                  <option value={2}>2 videos</option>
                  <option value={3}>3 videos</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Generate */}
            <button
              onClick={handleGenerate}
              disabled={taskState === "submitting" || !subject.trim()}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Processing State */}
        {(["processing", "submitting"] as TaskState[]).includes(taskState) && taskId && (
          <div className="border border-white/10 rounded-xl p-8 bg-white/5 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 mb-4">
                <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Generating Your Video</h2>
              <p className="text-gray-400">{statusMessage}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{progress}% complete • Task ID: {taskId.slice(0, 8)}...</p>

            <div className="mt-6 p-4 bg-white/5 rounded-lg text-sm text-gray-400">
              ⏱️ Video generation typically takes 2-5 minutes. Please keep this page open.
            </div>
          </div>
        )}

        {/* Completed State */}
        {taskState === "completed" && (
          <div className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-green-400">✅ Video Ready!</h2>
                <p className="text-gray-400 text-sm mt-1">Topic: {subject}</p>
              </div>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition"
              >
                Generate Another
              </button>
            </div>

            {videoUrls.length > 0 ? (
              <div className="p-6 space-y-6">
                {videoUrls.map((url, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Video {idx + 1}</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:underline"
                      >
                        ⬇️ Download
                      </a>
                    </div>
                    <video
                      src={url}
                      controls
                      className="w-full max-h-[500px] rounded-lg bg-black"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400">
                Video generated but URL not available. Check task ID: {taskId}
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 border border-white/10 rounded-xl p-6 bg-white/5">
          <h3 className="text-lg font-bold mb-4">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Enter Topic", desc: "Tell us what your video is about", icon: "✏️" },
              { step: "2", title: "AI Writes Script", desc: "AI generates a compelling script", icon: "🤖" },
              { step: "3", title: "Auto Production", desc: "Voice, materials, subtitles, music", icon: "🎬" },
              { step: "4", title: "Download", desc: "Get your HD video ready to post", icon: "⬇️" },
            ].map(s => (
              <div key={s.step} className="text-center p-4">
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
