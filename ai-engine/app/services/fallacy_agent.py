from langchain_core.prompts import ChatPromptTemplate
from app.core.config import settings
from app.core.llm import get_chat_llm
from app.schemas.fallacy import FallacyReportSchema
from app.services.timing import timed_invoke


_referee_agent = get_chat_llm(
    model_name=settings.REFEREE_MODEL,
    temperature=0.0,
    schema=FallacyReportSchema
)

_REFEREE_SYSTEM_PROMPT = """You are an elite, impartial debate adjudicator.
Analyze the user's input for logical fallacies ONLY. Do not comment on grammar, tone, or delivery.

Evaluate the ENTIRE input thoroughly against ALL 8 supported fallacy types:
1. Ad Hominem: attacking the person, character, or motives instead of their argument.
2. Straw Man: misrepresenting, exaggerating, or oversimplifying the opponent's position to make it easier to attack.
3. False Dilemma: presenting only two extreme options/alternatives when other valid possibilities exist.
4. Slippery Slope: claiming a small initial action will inevitably lead to an extreme chain of events without establishing causation.
5. Appeal to Authority: asserting a claim is necessarily true purely because an authority figure stated it, without supporting evidence.
6. Circular Reasoning: using the conclusion itself as a premise ("X is true because X is true" or restating the claim in different words).
7. Hasty Generalization: drawing a broad, definitive conclusion from a small, anecdotal, or unrepresentative sample.
8. Red Herring: introducing an irrelevant, distracting issue to divert attention from the core argument.

IMPORTANT RULES:
- Carefully inspect the text for EVERY fallacy that occurs. If the text contains MULTIPLE distinct fallacies (for example: False Dilemma, Ad Hominem, Appeal to Authority, Slippery Slope, etc.), you MUST detect and list ALL of them in the `fallacies` array.
- Do NOT stop after detecting just one fallacy.
- For each fallacy in `fallacies`: provide the `fallacy_type` (from the 8 types above), the exact `offending_text`, a clear `explanation`, and an actionable `correction_suggestion`.
- If one or more fallacies are detected:
  * Set `fallacy_detected` to True.
  * Populate `fallacies` with all detected fallacies.
  * For backward compatibility, also populate top-level `fallacy_type` (e.g. primary or comma-separated names), `offending_text`, `explanation`, and `correction_suggestion` from the primary/first detected fallacy.
- If no fallacies are detected:
  * Set `fallacy_detected` to False.
  * Set `fallacies` to [].
  * Set `fallacy_type` to "None".
- Be conservative and accurate — only flag a fallacy when it is clearly present.

{difficulty_note}"""

DIFFICULTY_STRICTNESS = {
    "Beginner": "Only flag fallacies that are blatant and unambiguous — give the learner the benefit of the doubt on borderline cases.",
    "Intermediate": "Flag all fallacies that a competent debate judge would reasonably catch, including moderately subtle ones.",
    "Hard": "Be strict — flag subtle, borderline, and easily-missed fallacies too, the way an expert competitive judge would."
}

_referee_prompt = ChatPromptTemplate.from_messages([
    ("system", _REFEREE_SYSTEM_PROMPT),
    ("user", "{text}")
])
_referee_chain = _referee_prompt | _referee_agent


async def analyze_argument(text: str, difficulty: str = None, session_id: str = None) -> FallacyReportSchema:
    note = DIFFICULTY_STRICTNESS.get(difficulty, DIFFICULTY_STRICTNESS["Intermediate"])
    report = await timed_invoke(
        _referee_chain, {"text": text, "difficulty_note": note},
        agent_name="Auditor (Fallacy Detection)", model=settings.REFEREE_MODEL, session_id=session_id
    )
    # Guarantee synchronization between top-level and fallacies array
    if report.fallacies and not report.fallacy_detected:
        report.fallacy_detected = True
    if report.fallacy_detected and not report.fallacies and report.fallacy_type and report.fallacy_type != "None":
        from app.schemas.fallacy import DetectedFallacy
        report.fallacies = [
            DetectedFallacy(
                fallacy_type=report.fallacy_type,
                offending_text=report.offending_text or "",
                explanation=report.explanation or "",
                correction_suggestion=report.correction_suggestion or ""
            )
        ]
    elif report.fallacies and (not report.fallacy_type or report.fallacy_type == "None"):
        report.fallacy_type = ", ".join(dict.fromkeys(f.fallacy_type for f in report.fallacies))
        if not report.offending_text and report.fallacies[0].offending_text:
            report.offending_text = report.fallacies[0].offending_text
        if not report.explanation and report.fallacies[0].explanation:
            report.explanation = report.fallacies[0].explanation
        if not report.correction_suggestion and report.fallacies[0].correction_suggestion:
            report.correction_suggestion = report.fallacies[0].correction_suggestion
    return report
