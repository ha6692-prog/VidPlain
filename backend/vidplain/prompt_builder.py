"""
Vidplain - Extreme Adaptive Prompt Builder
Handles dynamic structure for any type of user query.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional


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
        IntentType.PROBLEM: ["solve", "calculate", "find", "=", "equation", "compute", "determine"],
        IntentType.DEFINITION: ["what is", "define", "explain", "meaning of", "describe"],
        IntentType.COMPARISON: ["difference", "vs", "compare", "versus", "better", "pros and cons"],
        IntentType.CODE: ["code", "function", "python", "java", "implement", "write a program", "script"],
        IntentType.DEBUG: ["error", "bug", "not working", "fix", "debug", "exception", "unexpected"],
        IntentType.ARCHITECTURE: ["design", "architecture", "system", "structure", "pattern", "component"],
        IntentType.STRATEGY: ["how to choose", "best way", "strategy", "approach", "methodology"],
        IntentType.EMOTIONAL: ["stressed", "anxious", "sad", "confused", "worried", "overwhelmed"],
        IntentType.CREATIVE: ["write a story", "poem", "creative", "imagine", "generate a tale"],
        IntentType.OPINION: ["what do you think", "opinion", "view on", "thoughts about"],
        IntentType.SUMMARY: ["summarize", "summary", "tl;dr", "recap", "brief"],
        IntentType.TUTORIAL: ["step by step", "guide", "tutorial", "how to", "walkthrough"],
        IntentType.ANALYTICAL: ["analyze", "evaluate", "critique", "assess", "examine"],
        IntentType.BRAINSTORM: ["ideas for", "brainstorm", "generate ideas", "suggestions for"],
        IntentType.FACTUAL: ["when did", "who invented", "what year", "how many"],
    }

    INTENT_PRIORITY: List[IntentType] = [
        IntentType.DEBUG,
        IntentType.CODE,
        IntentType.PROBLEM,
        IntentType.COMPARISON,
        IntentType.DEFINITION,
        IntentType.TUTORIAL,
        IntentType.ANALYTICAL,
        IntentType.ARCHITECTURE,
        IntentType.STRATEGY,
        IntentType.SUMMARY,
        IntentType.BRAINSTORM,
        IntentType.OPINION,
        IntentType.CREATIVE,
        IntentType.EMOTIONAL,
        IntentType.FACTUAL,
        IntentType.GENERAL,
    ]

    @staticmethod
    def _normalize(question: str) -> str:
        # Normalize spacing for more stable phrase matching.
        return " ".join(question.lower().split())

    @classmethod
    def detect_top_intents(cls, question: str, max_items: int = 2) -> List[IntentType]:
        q = cls._normalize(question)
        scores: Dict[IntentType, int] = {}

        for intent, keywords in cls.INTENT_KEYWORDS.items():
            score = 0
            for kw in keywords:
                if kw in q:
                    score += 2 if " " in kw else 1
            if score > 0:
                scores[intent] = score

        if not scores:
            # Short questions tend to be direct fact lookups.
            if len(q.split()) <= 4:
                return [IntentType.FACTUAL]
            return [IntentType.GENERAL]

        ranked = sorted(
            scores.items(),
            key=lambda item: (-item[1], cls.INTENT_PRIORITY.index(item[0])),
        )
        return [intent for intent, _ in ranked[:max_items]]

    @staticmethod
    def is_multi_part(question: str) -> bool:
        q = question.strip().lower()
        if q.count("?") >= 2:
            return True
        if re.search(r"\b(first|second|third)\b", q):
            return True
        if re.search(r"\b(1\.|2\.|3\.)", q):
            return True
        return False

    @staticmethod
    def detect(question: str) -> IntentType:
        return IntentAnalyzer.detect_top_intents(question, max_items=1)[0]


class VidplainPromptBuilder:

    INTENT_GUIDANCE = {
        IntentType.PROBLEM:      "Show step-by-step reasoning with intermediate steps.",
        IntentType.DEFINITION:   "Start simple, then expand with intuition and example.",
        IntentType.COMPARISON:   "Highlight key differences and when to use each option.",
        IntentType.CODE:         "Provide clean code block and explain logic briefly.",
        IntentType.DEBUG:        "Identify root cause first, then show corrected solution.",
        IntentType.ARCHITECTURE: "Discuss design choices, trade-offs, scalability, and patterns.",
        IntentType.STRATEGY:     "Focus on decision criteria and real-world implications.",
        IntentType.EMOTIONAL:    "Respond with empathy and practical calming guidance.",
        IntentType.CREATIVE:     "Use imaginative and engaging tone.",
        IntentType.OPINION:      "Provide balanced perspective with reasoning.",
        IntentType.SUMMARY:      "Condense key points clearly and concisely.",
        IntentType.TUTORIAL:     "Break into clear progressive steps.",
        IntentType.ANALYTICAL:   "Evaluate critically and discuss pros/cons.",
        IntentType.BRAINSTORM:   "Generate diverse, structured ideas.",
        IntentType.FACTUAL:      "Provide concise, direct answer.",
        IntentType.GENERAL:      "Structure naturally and clearly.",
    }

    SYSTEM_PROMPT = (
        "You are Vidplain, an adaptive AI tutor. "
        "Understand the type of question and choose the most appropriate response style. "
        "Keep formatting clean and readable. Adapt tone based on context. "
        "Do not mention classification explicitly."
    )

    SUBJECT_STYLE_HINTS = {
        "math": "Prefer clear stepwise derivations and symbolic notation where useful.",
        "mathematics": "Prefer clear stepwise derivations and symbolic notation where useful.",
        "physics": "Use real-world phenomena, units, and cause-effect explanations.",
        "chemistry": "Use reaction-level intuition, mechanisms, and precise terminology.",
        "biology": "Explain systems, functions, and process flows in clear causal terms.",
        "history": "Use chronological structure, key dates, and historical context.",
        "programming": "Include concise examples, edge cases, and practical implementation notes.",
        "computer science": "Balance conceptual rigor with algorithmic examples and trade-offs.",
        "economics": "Use incentives, trade-offs, and clear assumptions in explanations.",
        "literature": "Use thematic analysis, tone, and textual interpretation.",
    }

    FEW_SHOT_TEMPLATE = """
Example format to imitate (structure and quality only):

Main explanation paragraph(s) that directly answers the question.

---SUGGESTIONS---
Follow-up question 1
Follow-up question 2
Follow-up question 3

---QUIZ---
**Quick Knowledge Check** ✅

Q1: Concept-check question?
a) Plausible option
b) Correct or plausible option
c) Plausible option
Answer: [letter]

Q2: Application-check question?
a) Plausible option
b) Plausible option
c) Correct or plausible option
Answer: [letter]
"""

    SUFFIX_INSTRUCTIONS = """

After your main response, always append the following two sections exactly as shown (do not skip them):

---SUGGESTIONS---
[Write exactly 3 short follow-up questions the student might want to ask next, one per line, no numbering or bullets]

---QUIZ---
**Quick Knowledge Check** ✅

Q1: [question based on your response]?
a) [option]
b) [option]
c) [option]
Answer: [letter]

Q2: [question based on your response]?
a) [option]
b) [option]
c) [option]
Answer: [letter]"""

    @classmethod
    def _subject_style_hint(cls, subject: str) -> str:
        s = subject.lower().strip()
        for key, hint in cls.SUBJECT_STYLE_HINTS.items():
            if key in s:
                return hint
        return "Use subject-appropriate terminology and examples that stay tightly on-topic."

    def build_messages(self, question: str, context: Optional[UserContext] = None) -> list:
        """Returns a list of messages suitable for the Groq chat completions API."""
        if not question.strip():
            raise ValueError("Question cannot be empty")

        if context is None:
            context = UserContext()

        intents = IntentAnalyzer.detect_top_intents(question)
        intent = intents[0]
        guidance = self.INTENT_GUIDANCE.get(intent, "")
        secondary_guidance = ""
        if len(intents) > 1:
            secondary_guidance = self.INTENT_GUIDANCE.get(intents[1], "")

        depth_map = {
            LearningLevel.BEGINNER.value: "Use very simple language, analogies, and small chunks. Avoid jargon.",
            LearningLevel.INTERMEDIATE.value: "Maintain balanced clarity with moderate depth and examples.",
            LearningLevel.ADVANCED.value: "Include deeper reasoning, edge cases, and advanced insights.",
        }
        depth = depth_map.get(context.level, depth_map[LearningLevel.INTERMEDIATE.value])

        weak_hint = ""
        if context.weak_topics:
            weak_hint = (
                f"\nStudent struggles with: {', '.join(context.weak_topics)}. "
                "Pay extra attention and add simple clarifications for these areas."
            )

        subject_hint = ""
        if context.subject:
            subject_hint = (
                f"\nSubject context: {context.subject}. "
                f"All explanations, examples, and analogies MUST be directly related to {context.subject}. "
                f"{self._subject_style_hint(context.subject)}"
            )

        multi_part_hint = ""
        if IntentAnalyzer.is_multi_part(question):
            multi_part_hint = (
                "\nThe user asked a multi-part query. Address every part in order, and do not skip any sub-question."
            )

        language_instruction = (
            f"CRITICAL LANGUAGE RULE: You MUST respond ENTIRELY in {context.language}. "
            f"Every word of your explanation, suggestions, and quiz content must be in {context.language}. "
            "The section headers ---SUGGESTIONS---, ---QUIZ--- and the line **Quick Knowledge Check** ✅ must stay exactly as written. "
            f"Do NOT use any language other than {context.language} for normal content."
        )

        quality_checks = (
            "Before finalizing, verify all of the following:\n"
            f"- Normal content is fully in {context.language}.\n"
            "- ---SUGGESTIONS--- exists and has exactly 3 short lines (no bullets, no numbering).\n"
            "- ---QUIZ--- exists and has exactly 2 questions (Q1 and Q2), each with a/b/c options and one answer letter.\n"
            "- Quiz questions test concepts from your own explanation (one recall + one application when possible).\n"
            "- If any check fails, fix the response before sending."
        )

        system_content = (
            f"{language_instruction}\n\n"
            f"{self.SYSTEM_PROMPT}\n\n"
            f"Primary response style: {guidance}\n"
            f"Secondary response style: {secondary_guidance or 'None'}\n"
            f"Depth: {depth}"
            f"{subject_hint}"
            f"{weak_hint}"
            f"{multi_part_hint}\n\n"
            "Formatting requirements:\n"
            f"{self.SUFFIX_INSTRUCTIONS}\n\n"
            "Few-shot structure reference:\n"
            f"{self.FEW_SHOT_TEMPLATE}\n\n"
            f"{quality_checks}"
        )

        user_content = (
            f"Question: {question}\n\n"
            f"Reminder: respond in {context.language}, include ---SUGGESTIONS--- and ---QUIZ--- exactly as required."
        )

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ]


# Singleton instance
prompt_builder = VidplainPromptBuilder()
