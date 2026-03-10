import Link from "next/link";

const categories = [
  { name: "Video Creation", tools: ["MoneyPrinterTurbo", "ShortGPT", "NarratoAI", "FFAIVideo"] },
  { name: "Translation", tools: ["VideoLingo", "pyVideoTrans"] },
  { name: "Digital Human", tools: ["TalkingHead 3D", "talking-avatar-with-ai"] },
  { name: "Editing", tools: ["ComeCut"] },
  { name: "Analysis", tools: ["AI-Media2Doc"] },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">AI Video Tools</h1>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Dashboard</Link>
        </div>
        {categories.map((cat) => (
          <div key={cat.name} className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-indigo-400">{cat.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.tools.map((tool) => (
                <div key={tool} className="border border-white/10 rounded-lg p-4 bg-white/5 hover:border-indigo-500/50 transition cursor-pointer">
                  <h3 className="font-semibold mb-1">{tool}</h3>
                  <span className="text-xs text-gray-500">Coming Soon</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
