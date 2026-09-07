import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import aiEngine from "../api/aiEngine";
import api from "../api/axios";

function FallacyDetectorTool() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  const handleDetect = async () => {
    if (!text.trim() || loading || retryCountdown > 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await aiEngine.post("/api/v1/tools/fallacy-detector", { text });
      setResult(res.data);
      api.post("/learner/tool-usage", { tool: "FallacyDetector" }).catch(() => {});
    } catch (err) {
      console.error(err);
      if (err.response?.status === 429 || err.response?.data?.error === "AI service rate limit reached") {
        const retrySec = err.response?.data?.retry_after || 20;
        setRetryCountdown(retrySec);
        setError(`Gemini AI quota is temporarily busy. Please wait ${retrySec}s before trying again.`);
      } else {
        const message = err.response?.data?.detail || "Could not reach the AI engine. Make sure it's running on localhost:8000.";
        setError(typeof message === "string" ? message : JSON.stringify(message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-2">Fallacy Detector</h2>
      <p className="text-gray-500 mb-6">
        Paste text to check for 8 common logical fallacies: Ad Hominem, Straw Man, False Dilemma,
        Slippery Slope, Appeal to Authority, Circular Reasoning, Hasty Generalization, Red Herring.
      </p>

      <div className="bg-[#1a1a2b] border border-white/5 rounded-2xl p-6 max-w-4xl">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here..."
          className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-3 mb-4 min-h-[140px]"
        />
        <button
          onClick={handleDetect}
          disabled={loading || retryCountdown > 0 || !text.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition text-white font-semibold px-6 py-3 rounded-lg"
        >
          {loading ? "Checking..." : retryCountdown > 0 ? `Please wait (${retryCountdown}s)` : "Detect Fallacies"}
        </button>

        {error && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${retryCountdown > 0 ? "bg-amber-500/10 border border-amber-500/20 text-amber-300" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            {result.fallacy_detected ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-red-400 font-semibold text-sm">
                    {result.fallacies && result.fallacies.length > 1
                      ? `⚠️ ${result.fallacies.length} Fallacies Detected`
                      : `⚠️ ${result.fallacy_type || "Fallacy"} Detected`}
                  </p>
                </div>
                {(result.fallacies && result.fallacies.length > 0 ? result.fallacies : [result]).map((f, idx) => (
                  <div key={idx} className="bg-[#0f0f1a] rounded-xl p-4 border border-red-500/20 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <p className="text-red-400 font-semibold">{f.fallacy_type}</p>
                    </div>
                    {f.offending_text && (
                      <p className="text-gray-300 italic pl-3 border-l-2 border-red-500/30">
                        "{f.offending_text}"
                      </p>
                    )}
                    {f.explanation && (
                      <p className="text-gray-400">
                        <span className="text-gray-500 font-medium">Why it fails: </span>
                        {f.explanation}
                      </p>
                    )}
                    {f.correction_suggestion && (
                      <p className="text-purple-300">
                        <span className="text-purple-400/70 font-medium">Suggestion: </span>
                        {f.correction_suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-[#0f0f1a] rounded-lg p-4 text-sm">
                <p className="text-green-400">No logical fallacies detected — solid reasoning.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default FallacyDetectorTool;
