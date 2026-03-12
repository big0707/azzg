import Link from "next/link";

const tools = [
  { name: "MoneyPrinterTurbo", desc: "AI Short Video Generator", category: "Video Creation", stars: "50K", status: "coming" },
  { name: "VideoLingo", desc: "Video Translation & Dubbing", category: "Translation", stars: "16K", status: "coming" },
  { name: "pyVideoTrans", desc: "Full-featured Video Translator", category: "Translation", stars: "16K", status: "coming" },
  { name: "NarratoAI", desc: "Movie Commentary & Remix", category: "Video Creation", stars: "8K", status: "coming" },
  { name: "ShortGPT", desc: "YouTube Automation Framework", category: "Video Creation", stars: "5.5K", status: "coming" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          AZZG
        </h1>
        <div className="flex gap-4 items-center">
          <Link href="/tools" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">
            Tools
          </Link>
          <Link href="/pricing" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">
            Pricing
          </Link>
          <Link href="/auth/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">
            Sign In
          </Link>
          <Link href="/auth/register" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h2 className="text-5xl font-bold mb-6">
          All AI Video Tools.{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            One Platform.
          </span>
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Access 100+ open-source AI video tools with one subscription. No GPU required. No setup hassle.
        </p>
        <Link
          href="/auth/register"
          className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-semibold transition"
        >
          Start Free Trial →
        </Link>
      </section>

      {/* Tools Grid */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold mb-8 text-center">Featured Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div key={tool.name} className="border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition bg-white/5">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold">{tool.name}</h4>
                <span className="text-xs text-yellow-400">⭐ {tool.stars}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">{tool.desc}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">{tool.category}</span>
                <span className="text-xs text-gray-500">Coming Soon</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-4xl mx-auto" id="pricing">
        <h3 className="text-2xl font-bold mb-8 text-center">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-white/10 rounded-xl p-6 bg-white/5">
            <h4 className="text-lg font-bold mb-2">Free Trial</h4>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>✓ 3 uses per day</li>
              <li>✓ Basic tools only</li>
              <li>✓ Community support</li>
            </ul>
          </div>
          <div className="border-2 border-indigo-500 rounded-xl p-6 bg-indigo-500/10 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-xs px-3 py-1 rounded-full">Popular</span>
            <h4 className="text-lg font-bold mb-2">Basic</h4>
            <p className="text-3xl font-bold mb-4">$3.9<span className="text-sm text-gray-400">/mo</span></p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>✓ 500 uses per month</li>
              <li>✓ All tools</li>
              <li>✓ Email support</li>
            </ul>
          </div>
          <div className="border border-white/10 rounded-xl p-6 bg-white/5">
            <h4 className="text-lg font-bold mb-2">Pro</h4>
            <p className="text-3xl font-bold mb-4">$12.9<span className="text-sm text-gray-400">/mo</span></p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>✓ 3000 uses per month</li>
              <li>✓ Priority queue</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-gray-500 text-sm">
        © 2026 AZZG. All rights reserved.
      </footer>
    </main>
  );
}
