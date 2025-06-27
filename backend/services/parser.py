"""
handles PDF parsing for syllabus/book files

- extract headings and topics from text
- used in /syllabus route to populate topic list
"""

import fitz # PyMuPDF
import re

def parse_pdf_topics(file_path: str) -> list[str]:
    """extract topic candidates from a PDF file"""
    doc = fitz.open(file_path)
    raw_text = ""

    for page in doc:
        raw_text += page.get_text()

    doc.close()

    # extract lines with heading-like structure
    lines = raw_text.split("\n")
    topic_candidates = []

    for line in lines:
        line = line.strip()
        # simple rule: headings are short, capitalized, or numbered
        if len(line) < 80 and (
            line.isupper() or re.match(r"^\d+(\.\d+)*\s", line)
        ):
            topic_candidates.append(line)

    return topic_candidates
