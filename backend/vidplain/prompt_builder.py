import re
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple


class LearningLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class IntentType(Enum):
    PROBLEM = "problem-solving"
    DEFINITION = "definition"
    COMPARISON = "comparison"
    CODE = "coding"
    DEBUG = "debugging"
    ARCHITECTURE = "architecture"
    STRATEGY = "strategy"
    EMOTIONAL = "emotional-support"
    CREATIVE = "creative-writing"
    OPINION = "opinion"
    FACTUAL = "quick-fact"
    TUTORIAL = "tutorial"
    SUMMARY = "summarization"
    ANALYTICAL = "analytical"
    BRAINSTORM = "brainstorming"
    GENERAL = "general"


@dataclass
class UserContext:
    level: str = "intermediate"
    domain: str = "general"
    weak_topics: Optional[List[str]] = None
    language: str = "English"
    subject: str = ""


class IntentAnalyzer:

    INTENT_KEYWORDS: Dict[IntentType, List[str]] = {
        IntentType.PROBLEM: ["solve", "calculate", "equation", "compute", "determine"],
        IntentType.DEFINITION: ["what is", "define", "meaning of", "describe"],
        IntentType.COMPARISON: ["difference", "compare", "vs", "better"],
        IntentType.CODE: ["code", "function", "python", "java", "script"],
        IntentType.DEBUG: ["error", "bug", "not working", "fix", "exception"],
        IntentType.ARCHITECTURE: ["design", "architecture", "system", "pattern"],
        IntentType.STRATEGY: ["best way", "strategy", "approach"],
        IntentType.EMOTIONAL: ["stressed", "anxious", "sad", "overwhelmed"],
        IntentType.CREATIVE: ["story", "poem", "imagine"],
        IntentType.OPINION: ["opinion", "what do you think"],
        IntentType.SUMMARY: ["summarize", "tl;dr", "brief"],
        IntentType.TUTORIAL: ["step by step", "guide", "how to"],
        IntentType.ANALYTICAL: ["analyze", "evaluate", "critique"],
        IntentType.BRAINSTORM: ["ideas", "brainstorm", "suggestions"],
        IntentType.FACTUAL: ["when did", "who", "how many"],
    }

    # ✅ Precompile regex patterns
    COMPILED_PATTERNS: Dict[IntentType, List[re.Pattern]] = {
        intent: [re.compile(rf"\b{re.escape(kw)}\b") for kw in kws]
        for intent, kws in INTENT_KEYWORDS.items()
    }

    INTENT_PRIORITY: List[IntentType] = list(IntentType)

    @staticmethod
    def _normalize(text: str) -> str:
        return " ".join(text.lower().strip().split())

    @classmethod
    def detect_top_intents(cls, question: str, max_items: int = 2) -> List[IntentType]:
        q = cls._normalize(question)
        scores: Dict[IntentType, int] = {}

        for intent, patterns in cls.COMPILED_PATTERNS.items():
            score = 0
            for pattern in patterns:
                if pattern.search(q):
                    score += 2  # stronger weight
            if score > 0:
                scores[intent] = score

        # ✅ Smart fallback
        if not scores:
            if len(q.split()) <= 4:
                return [IntentType.FACTUAL]
            return [IntentType.GENERAL]

        ranked = sorted(
            scores.items(),
            key=lambda x: (-x[1], cls.INTENT_PRIORITY.index(x[0]))
        )

        return [intent for intent, _ in ranked[:max_items]]

    @staticmethod
    def is_multi_part(question: str) -> bool:
        q = question.lower()

        return any([
            q.count("?") >= 2,
            bool(re.search(r"\b(first|second|third)\b", q)),
            bool(re.search(r"\b\d+\.", q)),
        ])