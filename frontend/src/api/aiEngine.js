import axios from "axios";

// The Python/FastAPI AI engine (Milestone 2 — fallacy detection + AI opponent)
// runs as its own service, separate from the Node backend on :5000.
const aiEngine = axios.create({
  baseURL: import.meta.env.VITE_AI_ENGINE_URL || "http://localhost:8000"
});

export default aiEngine;
