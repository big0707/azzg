"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tool = {
  name: string;
  desc: string;
  category: string;
  stars: string;
  github: string;
  status: "live" | "coming";
};

const allTools: Tool[] = [
  { name: "MoneyPrinterTurbo", desc: "AI-powered short video generator. Create viral videos in minutes with automated script, voiceover, and editing.", category: "Video Creation", stars: "50K", github: "https://github.com/harry0703/MoneyPrinterTurbo", status: "coming" },
  { name: "VideoLingo", desc: "Translate and dub videos into any language with AI. Preserves original tone and lip-sync.", category: "Translation", stars: "16K", github: "https://github.com/Huanshere/VideoLingo", status: "coming" },
  { name: "pyVideoTrans", desc: "Full-featured video translator supporting subtitles, dubbing, and voice cloning across 100+ languages.", category: "Translation", stars: "16K", github: "https://github.com/jianchang512/pyvideotrans", status: "coming" },
  { name: "NarratoAI", desc: "AI movie commentary and remix tool. Auto-generate engaging narration for film scenes.", category: "Video Creation", stars: "8K", github: "https://github.com/linyqh/NarratoAI", status: "coming" },
  { name: "ShortGPT", desc: "YouTube Shorts automation framework. Generate, edit, and publish short-form content at scale.", category: "Video Creation", stars: "5.5K", github: "https://github.com/RayVentura/ShortGPT", status: "coming" },
  { name: "FFAIVideo", desc: "AI video creation pipeline with customizable templates and automated rendering.", category: "Video Creation", stars: "3K", github: "https://github.com/drawcall/FFAIVideo", status: "coming" },
  { name: "TalkingHead 3D", desc: "Create realistic 3D talking head avatars from a single photo with lip-sync animation.", category: "Digital Human", stars: "4K", github: "#", status: "coming" },
  { name: "Talking Avatar AI", desc: "Generate AI-powered talking avatars for presentations, education, and marketing.", category: "Digital Human", stars: "2K", github: "#", status: "coming" },
  { name: "ComeCut", desc: "AI-assisted video editing tool with smart cuts, transitions, and auto-captioning.", category: "Editing", stars: "1.5K", github: "#", status: "coming" },
  { name: "AI-Media2Doc", desc: "Extract structured documents from video and audio content. Transcribe, summarize, and organize.", category: "Analysis", stars: "1K", github: "#", status: "coming" },
];

const categories = ["All", "Video Creation", "Translation", "Digital Human", "Editing", "Analysis"];

export default function ToolsPage() {
  const [filter, setFilter] = useState("All");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  const filtered = filter === "All" ? allTools : allTools.filter(t => t.category === filter);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">AI Video Tools</h1>
            <p className="text-gray-400">{allTools.length} tools across {categories.length - 1} categories</p>
          </div>
          <div className="flex gap-3">
            {user ? (
              <Link href="/dashboard" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">← Dashboard</Link>
            ) : (
              <Link href="/auth/login" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500 transition">Sign In</Link>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filter === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tool) => (
            <div key={tool.name} className="border border-white/10 rounded-xl p-6 bg-white/5 hover:border-indigo-500/50 transition group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold group-hover:text-indigo-400 transition">{tool.name}</h3>
                <span className="text-xs text-yellow-400 shrink-0">⭐ {tool.stars}</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{tool.desc}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">{tool.category}</span>
                {tool.status === "live" ? (
                  <button className="text-xs px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition">
                    Launch →
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">Coming Soon</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!user && (
          <div className="mt-16 text-center border border-white/10 rounded-xl p-8 bg-white/5">
            <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-gray-400 mb-6">Sign up for free and get 3 uses per day. No credit card required.</p>
            <Link href="/auth/register" className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-semibold transition">
              Start Free Trial →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
