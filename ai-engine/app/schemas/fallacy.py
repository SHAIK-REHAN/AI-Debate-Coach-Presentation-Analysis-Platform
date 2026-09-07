from pydantic import BaseModel, Field
from typing import Optional, List


class DetectedFallacy(BaseModel):
    fallacy_type: str = Field(
        description="The name of the detected fallacy. Must be one of: 'Ad Hominem', 'Straw Man', 'False Dilemma', 'Slippery Slope', 'Appeal to Authority', 'Circular Reasoning', 'Hasty Generalization', 'Red Herring'"
    )
    offending_text: str = Field(
        description="The exact phrase, sentence, or clause where the fallacy occurs."
    )
    explanation: str = Field(
        description="Plain-language explanation of why this specific reasoning is fallacious."
    )
    correction_suggestion: str = Field(
        description="A constructive suggestion for how to fix or reframe this specific point without the fallacy."
    )


class FallacyReportSchema(BaseModel):
    """Strict output contract for Agent 1 (The Auditor) supporting multiple detected fallacies."""

    fallacy_detected: bool = Field(
        description="True if ANY logical fallacies are clearly present in the argument, False otherwise."
    )
    fallacies: List[DetectedFallacy] = Field(
        default_factory=list,
        description="List containing every distinct fallacy detected in the text across the 8 supported types. Empty list if none detected."
    )
    fallacy_type: str = Field(
        default="None",
        description="Primary fallacy type, or comma-separated list of types, or 'None' if fallacy_detected is False."
    )
    offending_text: Optional[str] = Field(
        default=None, description="The exact phrase or sentence where the primary fallacy occurs."
    )
    explanation: Optional[str] = Field(
        default=None, description="Plain-language explanation of why the primary reasoning fails."
    )
    correction_suggestion: Optional[str] = Field(
        default=None, description="A constructive suggestion for how to fix or reframe the argument."
    )
