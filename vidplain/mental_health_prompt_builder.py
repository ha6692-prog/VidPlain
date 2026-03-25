"""
Enhanced Mental Health Counselor - Adaptive Prompt Builder
Handles dynamic prompts for student mental health support.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict


class MentalHealthIntent(Enum):
    STRESS = "stress"
    ANXIETY = "anxiety"
    DEPRESSION = "depression"
    LONELINESS = "loneliness"
    BURNOUT = "burnout"
    SELF_ESTEEM = "self-esteem"
    RELATIONSHIP = "relationship"
    ACADEMIC_PRESSURE = "academic-pressure"
    SLEEP = "sleep-issues"
    MOTIVATION = "motivation"
    GRIEF = "grief"
    ANGER = "anger"
    CRISIS = "crisis"
    EATING_DISORDER = "eating-disorder"
    SUBSTANCE_USE = "substance-use"
    TRAUMA = "trauma"
    GREETING = "greeting"
    FAREWELL = "farewell"
    THANKS = "thanks"
    GENERAL_WELLBEING = "general-wellbeing"


class MentalHealthIntentAnalyzer:
    _patterns = {
        MentalHealthIntent.CRISIS: [
            r"\b(suicide|killing myself|end my life|self[-\s]harm|cutting|don't want to live|no reason to live|better off dead|want to die|hurt myself|harm myself|take my life)\b",
        ],
        MentalHealthIntent.STRESS: [
            r"\b(stress(ed)?|overwhelmed|too much pressure|can't handle|burning out|stretched thin|drowning in work|stressing out)\b",
        ],
        MentalHealthIntent.ANXIETY: [
            r"\b(anxious|anxiety|worried|panic|nervous|fear|scared|overthinking|racing thoughts|can't stop thinking)\b",
        ],
        MentalHealthIntent.DEPRESSION: [
            r"\b(depressed|depression|hopeless|empty|worthless|numb|can't feel|sad all the time|no joy|nothing matters)\b",
        ],
        MentalHealthIntent.LONELINESS: [
            r"\b(lonely|alone|no friends|isolated|nobody cares|left out|don't belong|feel invisible)\b",
        ],
        MentalHealthIntent.BURNOUT: [
            r"\b(burnout|burned out|exhausted|drained|tired of everything|no energy|completely spent|running on empty)\b",
        ],
        MentalHealthIntent.SELF_ESTEEM: [
            r"\b(confidence|self[-\s]esteem|not good enough|imposter|hate myself|worthless|feel like a failure|never do anything right)\b",
        ],
        MentalHealthIntent.RELATIONSHIP: [
            r"\b(relationship|breakup|boyfriend|girlfriend|partner|friend problems|family issues|fight with|argument|trust issues|betrayal)\b",
        ],
        MentalHealthIntent.ACADEMIC_PRESSURE: [
            r"\b(exam|grades|failing|academic|studies pressure|can't study|homework|assignment|deadlines|procrastinat|behind on work)\b",
        ],
        MentalHealthIntent.SLEEP: [
            r"\b(can't sleep|insomnia|sleep|nightmares|fatigue|restless|waking up at night|not sleeping well)\b",
        ],
        MentalHealthIntent.MOTIVATION: [
            r"\b(unmotivated|no motivation|lazy|procrastinat|don't feel like|giving up|what's the point|can't get started)\b",
        ],
        MentalHealthIntent.GRIEF: [
            r"\b(grief|loss|died|death|miss them|passed away|mourning|lost someone)\b",
        ],
        MentalHealthIntent.ANGER: [
            r"\b(angry|anger|rage|furious|frustrated|irritated|mad|annoyed|lashing out|temper)\b",
        ],
        MentalHealthIntent.EATING_DISORDER: [
            r"\b(eating disorder|anorexia|bulimia|binge eat|purging|body image|starving myself)\b",
        ],
        MentalHealthIntent.SUBSTANCE_USE: [
            r"\b(alcohol|drinking|drugs|weed|vaping|smoking|substance use|addiction|drunk|high)\b",
        ],
        MentalHealthIntent.TRAUMA: [
            r"\b(trauma|abuse|assault|ptsd|flashbacks|nightmares about)\b",
        ],
        MentalHealthIntent.GREETING: [
            r"\b(hi|hello|hey|how are you|good morning|good evening|what's up)\b",
        ],
        MentalHealthIntent.FAREWELL: [
            r"\b(bye|goodbye|see you|take care|talk later|have a good day)\b",
        ],
        MentalHealthIntent.THANKS: [
            r"\b(thank you|thanks|appreciate it|that helps)\b",
        ],
    }

    @classmethod
    def detect(cls, message: str) -> MentalHealthIntent:
        m = message.lower().strip()
        if not m:
            return MentalHealthIntent.GENERAL_WELLBEING
        for intent, patterns in cls._patterns.items():
            for pattern in patterns:
                if re.search(pattern, m, re.IGNORECASE):
                    return intent
        return MentalHealthIntent.GENERAL_WELLBEING


INTENT_GUIDANCE = {
    MentalHealthIntent.CRISIS: (
        "CRISIS situation. Take it seriously. Validate their pain immediately. "
        "Provide emergency resources: 988 Suicide & Crisis Lifeline (call/text 988), Crisis Text Line (text HOME to 741741). "
        "Ask if they are safe right now. Encourage them to call a helpline or trusted person immediately. "
        "If in immediate danger, urge them to call emergency services (911)."
    ),
    MentalHealthIntent.STRESS: (
        "Acknowledge their stress and normalize it. Offer practical techniques: deep breathing, breaking tasks into small steps, taking short breaks. "
        "Remind them it's okay to ask for help."
    ),
    MentalHealthIntent.ANXIETY: (
        "Validate anxiety and guide through grounding (5-4-3-2-1 technique). Suggest slow deep breathing. "
        "Normalize anxiety and remind them it's manageable."
    ),
    MentalHealthIntent.DEPRESSION: (
        "Respond with deep empathy. Avoid toxic positivity. Suggest small achievable steps. "
        "Encourage seeking professional support. Validate that their feelings are real."
    ),
    MentalHealthIntent.LONELINESS: (
        "Express genuine understanding. Normalize loneliness among students. "
        "Suggest small connection points: clubs, study groups, a phone call with family. Validate their bravery in reaching out."
    ),
    MentalHealthIntent.BURNOUT: (
        "Validate that burnout is real and not a personal failure. Help them evaluate commitments. "
        "Suggest scheduled breaks, hobbies, and saying no to extra demands."
    ),
    MentalHealthIntent.SELF_ESTEEM: (
        "Affirm their worth. Help identify strengths and accomplishments. "
        "Challenge negative self-talk gently. Remind them self-worth is not tied to achievement."
    ),
    MentalHealthIntent.RELATIONSHIP: (
        "Listen without judgment. Acknowledge the pain. Discuss healthy communication and boundaries. "
        "Encourage self-care during difficult relationship times."
    ),
    MentalHealthIntent.ACADEMIC_PRESSURE: (
        "Normalize academic stress. Break tasks into smaller pieces. Discuss time management. "
        "Remind them grades don't define their worth. Suggest campus resources."
    ),
    MentalHealthIntent.SLEEP: (
        "Discuss sleep hygiene: consistent schedule, screen-free time before bed, calming activities. "
        "Validate how poor sleep affects mood and focus."
    ),
    MentalHealthIntent.MOTIVATION: (
        "Validate lack of motivation. Suggest the 2-minute rule: start with a tiny task. "
        "Normalize that motivation fluctuates and help them reconnect with their values."
    ),
    MentalHealthIntent.GRIEF: (
        "Respond with deep compassion. Allow space for feelings. Avoid clichés. "
        "Suggest grief counseling or support groups. Let them lead the conversation."
    ),
    MentalHealthIntent.ANGER: (
        "Validate anger as natural. Help identify triggers. Suggest physical activity, journaling, or creative expression. "
        "Discuss assertive communication."
    ),
    MentalHealthIntent.EATING_DISORDER: (
        "Approach with sensitivity. Acknowledge distress around food and body image. "
        "Encourage professional help. Avoid commenting on appearance."
    ),
    MentalHealthIntent.SUBSTANCE_USE: (
        "Respond non-judgmentally. Explore underlying reasons. Discuss healthier coping strategies. "
        "Encourage professional support if use is concerning."
    ),
    MentalHealthIntent.TRAUMA: (
        "Do not ask for details. Validate feelings. Remind them they are not alone. "
        "Encourage professional trauma-informed support."
    ),
    MentalHealthIntent.GREETING: "Respond warmly and invite them to share. Let them know this is a safe space.",
    MentalHealthIntent.FAREWELL: "Acknowledge warmly. Reinforce that you're here whenever they need to talk.",
    MentalHealthIntent.THANKS: "Acknowledge their gratitude. Validate that reaching out is a positive step.",
    MentalHealthIntent.GENERAL_WELLBEING: (
        "Provide warm, encouraging wellbeing support. Ask how they're feeling. Offer simple self-care tips."
    ),
}

SYSTEM_PROMPT = """You are Mano, a compassionate AI student mental health support companion.

Your principles:
- Listen actively and validate feelings before offering advice.
- Use warm, empathetic, non-judgmental language.
- Never diagnose conditions or prescribe medication.
- Encourage professional help when appropriate (campus counseling, therapists, helplines).
- Use evidence-based techniques: CBT, mindfulness, grounding, positive psychology.
- Keep responses conversational and supportive (3-5 sentences unless more is needed).
- Always prioritize safety — if a student is in crisis, provide helpline numbers immediately (988, Crisis Text Line).
- You are talking to students — be relatable and understanding of academic life.
- Do NOT generate quizzes or follow-up study questions — this is a mental health support chat, not an academic tutor."""


def build_mano_messages(user_message: str, language: str = "English") -> list:
    """Returns Groq-compatible messages list for the mental health bot."""
    intent = MentalHealthIntentAnalyzer.detect(user_message)
    guidance = INTENT_GUIDANCE.get(intent, "")

    language_instruction = (
        f"CRITICAL LANGUAGE RULE: You MUST respond ENTIRELY in {language}. "
        f"Every single word of your response must be in {language}. "
        f"Do NOT use English or any other language under any circumstances."
    )

    system_content = f"{language_instruction}\n\n{SYSTEM_PROMPT}\n\nSituation guidance: {guidance}"

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_message},
    ]
