# AI Active Listening Evaluation Pipeline

from typing import List, Dict, Any


# Prompt 1: Generate Persona Options

def generate_persona_options(topics: List[str], user_profile: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Generates a list of persona options based on user interests and listening baseline.
    """
    # Stub: In production, this would call an LLM with Prompt 1
    return [
        {
            "id": "napoleon",
            "name": "Napoleon Bonaparte",
            "short_description": "A determined strategist who believes clarity is power, yet struggles with being misunderstood due to his dominance.",
            "topics": ["Лидерство", "Истина"],
            "why_helpful_to_user": "Tests the user's ability to unpack layered intentions and reflect back high-status reasoning without submissiveness."
        },
        # ... more personas
    ]


# Prompt 2: Refine Selected Persona

def refine_persona(persona: Dict[str, Any]) -> str:
    """
    Refines selected persona into an executable prompt with Clarity Pledge rules.
    Returns: formatted LLM prompt as string.
    """
    prompt = f"""
You are speaking as {persona['name']}, a figure known for their stance on {', '.join(persona['topics'])}.

You believe clarity is strength and that being understood is a form of command.



You are engaged in a conversation with a user who is being evaluated for their active listening ability.

Your role is to test and support their capacity to reflect, paraphrase, and clarify ideas in dialogue.



You follow the values of the Clarity Pledge:

- Encourage rephrasing.

- Accept correction.

- Never fake understanding.

- Slow down for clarity.



Start from this message:

{persona.get('starter_prompt', 'What matters more: vision or trust?')}
"""
    return prompt


# Prompt 3a: Generate contextual question

def generate_next_question(refined_prompt: str, dialogue_history: List[Dict[str, str]], score: float) -> str:
    """
    Generates next question from refined persona prompt and dialogue context.
    """
    context = "\n".join([f"{msg['agent']}: {msg['user']}" for msg in dialogue_history])
    return f"{refined_prompt}\n\n— Dialogue history —\n{context}\n\nScore: {score}\n\nYour next question:"


# Prompt 3b: Evaluate User Response

def evaluate_response(agent_message: str, user_response: str) -> Dict[str, Any]:
    """
    Evaluates user's response using listening metrics.
    """
    # Stub logic — In real case, call LLM to return detailed scores
    return {
        "perception_match": 0.85,
        "paraphrasing": 0.75,
        "clarification": 0.3,
        "emotional_alignment": 0.6,
        "misunderstanding": False,
        "comments": "Good paraphrasing, but lacks emotional depth."
    }


# Prompt 4: Summarize Overall Score

def summarize_score(metrics_history: List[Dict[str, float]]) -> Dict[str, Any]:
    """
    Aggregates dialogue metric history into a final score and trait profile.
    """
    n = len(metrics_history)
    agg = {k: sum(m[k] for m in metrics_history if isinstance(m.get(k), (int, float))) / n for k in metrics_history[0] if k != 'misunderstanding'}
    final_score = round(sum(agg.values()) / len(agg) * 100, 1)
    return {
        "summary_score": final_score,
        "dominant_traits": sorted(agg, key=agg.get, reverse=True)[:2],
        "recommendation": "Focus on improving clarification and emotional attunement."
    }

