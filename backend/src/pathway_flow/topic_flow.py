from services.llm import suggest_related_topics

async def get_next_topics(user_id: str, current_topic: str) -> list[str]:
    """Get recommended topics for the user’s learning path."""
    return await suggest_related_topics(current_topic, user_id)