import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import FormattedText from "../components/FormattedText";
import { getUser } from "../utils/useAuth";

function FeedbackCoaching() {
  const user = getUser();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get(`/session/${user.id}`).then((res) => setSessions(res.data)).catch(() => {});
  }, []);

  const withFeedback = sessions.filter((s) => s.feedback || s.coachFeedback || s.educatorFeedback);
  const latest = withFeedback[0];

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Feedback & Coaching</h2>

      {latest && (
        <div className="bg-[#1a1a2b] border border-purple-500/30 rounded-2xl p-6 max-w-2xl mb-6">
          <p className="text-gray-400 text-sm mb-3">Latest Session — {latest.topic} · {new Date(latest.createdAt).toLocaleDateString()}</p>

          {latest.coachFeedback && (
            <div className="mb-4">
              <p className="text-purple-400 text-xs font-semibold mb-1">FROM YOUR COACH</p>
              <FormattedText content={latest.coachFeedback} />
            </div>
          )}
          {latest.educatorFeedback && (
            <div className="mb-4">
              <p className="text-blue-400 text-xs font-semibold mb-1">FROM YOUR EDUCATOR</p>
              <FormattedText content={latest.educatorFeedback} />
            </div>
          )}
          {latest.feedback && (
            <div className="mb-2">
              <p className="text-gray-400 text-xs font-semibold mb-1">AI FEEDBACK</p>
              <FormattedText content={latest.feedback} />
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 max-w-2xl">
        {withFeedback.slice(1).map((s) => (
          <div key={s._id} className="bg-[#1a1a2b] border border-white/5 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-2">{s.topic} · {new Date(s.createdAt).toLocaleDateString()}</p>
            {s.coachFeedback && (
              <div className="mb-2">
                <span className="text-purple-400 text-xs font-medium">Coach:</span>
                <FormattedText content={s.coachFeedback} />
              </div>
            )}
            {s.educatorFeedback && (
              <div className="mb-2">
                <span className="text-blue-400 text-xs font-medium">Educator:</span>
                <FormattedText content={s.educatorFeedback} />
              </div>
            )}
            {s.feedback && (
              <div>
                <span className="text-gray-400 text-xs font-medium">AI Feedback:</span>
                <FormattedText content={s.feedback} />
              </div>
            )}
          </div>
        ))}
      </div>

      {withFeedback.length === 0 && <p className="text-gray-500">No feedback yet — complete a debate to get AI feedback.</p>}
    </Layout>
  );
}

export default FeedbackCoaching;
