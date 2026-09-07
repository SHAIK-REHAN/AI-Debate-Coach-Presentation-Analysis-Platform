const BACKEND_URL = "http://localhost:5000";
const AI_ENGINE_URL = "http://localhost:8000";

async function postJSON(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

async function getJSON(url, headers = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...headers }
  });
  return { status: res.status, data: await res.json() };
}

async function runEndToEndTests() {
  console.log("==================================================");
  console.log("🚀 STARTING COMPLETE END-TO-END INTEGRATION TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  // TEST 1: AI Engine Health
  try {
    const res = await getJSON(`${AI_ENGINE_URL}/health`);
    if (res.data.status === "ok") {
      console.log("✅ [1/8] AI Engine Health Check: PASSED");
      passed++;
    } else {
      throw new Error("Unexpected status: " + JSON.stringify(res.data));
    }
  } catch (err) {
    console.error("❌ [1/8] AI Engine Health Check: FAILED", err.message);
    failed++;
  }

  // TEST 2: User Signup
  const email = `test_learner_${Date.now()}@example.com`;
  const password = "Password123!";
  try {
    const res = await postJSON(`${BACKEND_URL}/signup`, {
      name: "Integration Test User",
      email,
      password,
      role: "Learner"
    });
    if (res.data.success) {
      console.log("✅ [2/8] Backend User Signup: PASSED");
      passed++;
    } else {
      throw new Error(res.data.message);
    }
  } catch (err) {
    console.error("❌ [2/8] Backend User Signup: FAILED", err.message);
    failed++;
  }

  // TEST 3: User Login & JWT
  let token = null;
  let userId = null;
  try {
    const res = await postJSON(`${BACKEND_URL}/login`, {
      email,
      password
    });
    if (res.data.success && res.data.token) {
      token = res.data.token;
      userId = res.data.user.id;
      console.log("✅ [3/8] Backend User Login & JWT Auth: PASSED (Token Received)");
      passed++;
    } else {
      throw new Error(res.data.message);
    }
  } catch (err) {
    console.error("❌ [3/8] Backend User Login: FAILED", err.message);
    failed++;
  }

  // TEST 4: Fetch Topics from MongoDB via Backend
  try {
    const res = await getJSON(`${BACKEND_URL}/topics`, {
      Authorization: `Bearer ${token}`
    });
    if (Array.isArray(res.data) && res.data.length > 0) {
      console.log(`✅ [4/8] Backend Topics Fetch: PASSED (Found ${res.data.length} topics in MongoDB)`);
      passed++;
    } else {
      throw new Error("No topics returned or invalid format");
    }
  } catch (err) {
    console.error("❌ [4/8] Backend Topics Fetch: FAILED", err.message);
    failed++;
  }

  // TEST 5: Standalone AI Fallacy Detector Tool
  try {
    const res = await postJSON(`${AI_ENGINE_URL}/api/v1/tools/fallacy-detector`, {
      text: "You cannot trust his argument on renewable energy because he drives a diesel truck."
    });
    if (res.data && res.data.fallacy_detected !== undefined) {
      console.log(`✅ [5/8] AI Engine Fallacy Detector: PASSED (Detected: ${res.data.fallacy_detected}, Type: ${res.data.fallacy_type})`);
      passed++;
    } else {
      throw new Error("Invalid fallacy response");
    }
  } catch (err) {
    console.error("❌ [5/8] AI Engine Fallacy Detector: FAILED", err.message);
    failed++;
  }

  // TEST 6: Standalone AI Argument Analyzer Tool
  try {
    const res = await postJSON(`${AI_ENGINE_URL}/api/v1/tools/argument-analyzer`, {
      text: "Solar energy reduces carbon emissions by replacing fossil fuels with clean solar radiation."
    });
    if (res.data && res.data.persuasiveness_score !== undefined) {
      console.log(`✅ [6/8] AI Engine Argument Analyzer: PASSED (Clarity: ${res.data.clarity_score}, Persuasiveness: ${res.data.persuasiveness_score})`);
      passed++;
    } else {
      throw new Error("Invalid argument analysis response");
    }
  } catch (err) {
    console.error("❌ [6/8] AI Engine Argument Analyzer: FAILED", err.message);
    failed++;
  }

  // TEST 7: AI Engine Multi-Agent Turn Simulation + MongoDB Persistence
  try {
    const res = await postJSON(`${AI_ENGINE_URL}/api/v1/debate/turn-text`, {
      session_id: `test-sess-${Date.now()}`,
      debate_format: "One-on-One Debate",
      argument: "Universal basic income reduces extreme poverty and stimulates local economies by providing a financial floor for all citizens.",
      history: []
    });
    if (res.data && res.data.ai_rebuttal) {
      console.log("✅ [7/8] AI Engine Multi-Agent Debate Simulation: PASSED");
      console.log("   Opponent Rebuttal Snippet:", res.data.ai_rebuttal.slice(0, 100).replace(/\n/g, " ") + "...");
      passed++;
    } else {
      throw new Error("Invalid turn response: " + JSON.stringify(res.data));
    }
  } catch (err) {
    console.error("❌ [7/8] AI Engine Multi-Agent Debate Simulation: FAILED", err.message);
    failed++;
  }

  // TEST 8: Backend Save Session with AI Feedback
  try {
    const res = await postJSON(`${BACKEND_URL}/session`, {
      userId,
      topic: "Universal basic income should be implemented",
      stance: "Affirmative",
      argument: "UBI stimulates the economy and reduces poverty.",
      format: "One-on-One Debate"
    });
    if (res.data.success && res.data.session) {
      console.log("✅ [8/8] Backend Session Persistence & AI Feedback: PASSED");
      console.log("   Feedback Summary:", res.data.session.feedback?.slice(0, 80).replace(/\n/g, " ") + "...");
      passed++;
    } else {
      throw new Error(res.data.message);
    }
  } catch (err) {
    console.error("❌ [8/8] Backend Session Persistence: FAILED", err.message);
    failed++;
  }

  console.log("==================================================");
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndTests();
