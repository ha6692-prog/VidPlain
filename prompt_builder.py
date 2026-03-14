"""
Vidplain - Extreme Adaptive Prompt Builder
Handles dynamic structure for any type of user query.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


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

    @staticmethod
    def detect(question: str) -> IntentType:
        q = question.lower()

        if any(x in q for x in ["solve", "calculate", "find", "="]):
            return IntentType.PROBLEM
        if any(x in q for x in ["difference", "vs", "compare"]):
            return IntentType.COMPARISON
        if any(x in q for x in ["error", "bug", "not working", "fix"]):
            return IntentType.DEBUG
        if any(x in q for x in ["code", "function", "python", "java", "implement"]):
            return IntentType.CODE
        if any(x in q for x in ["design", "architecture", "system"]):
            return IntentType.ARCHITECTURE
        if any(x in q for x in ["how to choose", "best way", "strategy", "approach"]):
            return IntentType.STRATEGY
        if any(x in q for x in ["stressed", "anxious", "sad", "confused"]):
            return IntentType.EMOTIONAL
        if any(x in q for x in ["write a story", "poem", "creative"]):
            return IntentType.CREATIVE
        if any(x in q for x in ["what do you think", "opinion"]):
            return IntentType.OPINION
        if any(x in q for x in ["summarize", "summary"]):
            return IntentType.SUMMARY
        if any(x in q for x in ["step by step tutorial"]):
            return IntentType.TUTORIAL
        if any(x in q for x in ["analyze", "evaluate"]):
            return IntentType.ANALYTICAL
        if any(x in q for x in ["ideas for", "brainstorm"]):
            return IntentType.BRAINSTORM
        if any(x in q for x in ["what is", "define", "explain"]):
            return IntentType.DEFINITION
        if len(q.split()) <= 6:
            return IntentType.FACTUAL

        return IntentType.GENERAL


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

    def build_messages(self, question: str, context: Optional[UserContext] = None) -> list:
        """Returns a list of messages suitable for the Groq chat completions API."""
        if not question.strip():
            raise ValueError("Question cannot be empty")

        if context is None:
            context = UserContext()

        intent = IntentAnalyzer.detect(question)
        guidance = self.INTENT_GUIDANCE.get(intent, "")

        if context.level == LearningLevel.BEGINNER.value:
            depth = "Use simple language. Break complex ideas into small parts."
        elif context.level == LearningLevel.ADVANCED.value:
            depth = "Include deeper reasoning and advanced insights."
        else:
            depth = "Maintain balanced clarity."

        weak_hint = ""
        if context.weak_topics:
            weak_hint = f"\nStudent struggles with: {', '.join(context.weak_topics)}. Explain carefully in those areas."

        subject_hint = ""
        if context.subject:
            subject_hint = f"\nThe student is currently studying: {context.subject}. Keep all explanations, examples, and context relevant to this subject whenever applicable."

        language_instruction = (
            f"CRITICAL LANGUAGE RULE: You MUST respond ENTIRELY in {context.language}. "
            f"Every single word of your response, including suggestions and quiz questions, must be in {context.language}. "
            f"Do NOT use English or any other language under any circumstances."
        )

        system_content = (
            f"{language_instruction}\n\n"
            f"{self.SYSTEM_PROMPT}\n\n"
            f"Response style: {guidance}\n"
            f"Depth: {depth}"
            f"{subject_hint}"
            f"{weak_hint}"
            f"{self.SUFFIX_INSTRUCTIONS}"
        )

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": question},
        ]


# Singleton instance
prompt_builder = VidplainPromptBuilder()
