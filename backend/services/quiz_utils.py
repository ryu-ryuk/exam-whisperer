
import re

def parse_quiz_text(text: str):
    """
    expects a markdown/plain format:
    Q. ...
    - option a
    - option b
    - option c
    - option d
    answer: 1
    """
    blocks = text.strip().split("\n\n")
    parsed = []

    for block in blocks:
        lines = block.strip().split("\n")
        if len(lines) < 6:
            continue
        question = lines[0].strip()
        options = [line.strip("- ").strip() for line in lines[1:5]]
        answer_line = lines[5].lower()
        match = re.search(r"(\d)", answer_line)
        if not match:
            continue
        correct_index = int(match.group(1))
        parsed.append({
            "question": question,
            "options": options,
            "correct_index": correct_index
        })

    return parsed


def score_quiz(questions, answers) -> float:
    if not questions:
        return 0.0
    correct = 0
    for q, a in zip(questions, answers):
        if a == q.correct_index:
            correct += 1
    return round(correct / len(questions), 2)

