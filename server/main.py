from io import BytesIO
import csv
import re
from collections import Counter

import pandas as pd
from docx import Document
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openpyxl import load_workbook
from pydantic import BaseModel
from pptx import Presentation
from PyPDF2 import PdfReader

app = FastAPI(title="Mwakenya API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    content: str


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages).strip()


def extract_docx_text(file_bytes: bytes) -> str:
    document = Document(BytesIO(file_bytes))
    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def extract_pptx_text(file_bytes: bytes) -> str:
    presentation = Presentation(BytesIO(file_bytes))
    lines = []
    for slide in presentation.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text:
                lines.append(shape.text)
    return "\n".join(lines).strip()


def extract_xlsx_text(file_bytes: bytes) -> str:
    workbook = load_workbook(BytesIO(file_bytes), data_only=True)
    lines = []
    for sheet in workbook.worksheets:
        lines.append(f"Sheet: {sheet.title}")
        for row in sheet.iter_rows(values_only=True):
            values = [str(cell) for cell in row if cell is not None]
            if values:
                lines.append(" | ".join(values))
    return "\n".join(lines).strip()


def extract_txt_text(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()


def extract_csv_text(file_bytes: bytes) -> str:
    decoded = file_bytes.decode("utf-8", errors="ignore").splitlines()
    reader = csv.reader(decoded)
    rows = []
    for row in reader:
        if row:
            rows.append(" | ".join(row))
    return "\n".join(rows).strip()


def extract_text_from_upload(filename: str, file_bytes: bytes) -> str:
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        return extract_pdf_text(file_bytes)
    if lower_name.endswith(".docx"):
        return extract_docx_text(file_bytes)
    if lower_name.endswith(".pptx"):
        return extract_pptx_text(file_bytes)
    if lower_name.endswith(".xlsx"):
        return extract_xlsx_text(file_bytes)
    if lower_name.endswith(".txt"):
        return extract_txt_text(file_bytes)
    if lower_name.endswith(".csv"):
        return extract_csv_text(file_bytes)

    raise HTTPException(
        status_code=400,
        detail="Unsupported file type. Use PDF, DOCX, PPTX, XLSX, TXT, or CSV.",
    )


def split_sentences(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if s.strip()]


def simple_summarize(text: str) -> str:
    text = clean_text(text)

    if not text:
        return "No content available to summarize."

    sentences = split_sentences(text)

    if len(sentences) <= 3:
        return text

    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    stop_words = {
        "the", "and", "for", "that", "with", "this", "from", "have", "will",
        "your", "into", "their", "about", "there", "been", "were", "which",
        "when", "what", "where", "while", "them", "then", "than", "also",
        "these", "those", "because", "using", "used", "use", "such", "more",
        "some", "many", "very", "much", "only", "over", "under", "after",
        "before", "between", "within", "through", "across", "material",
        "content", "document"
    }
    filtered_words = [w for w in words if w not in stop_words]
    freq = Counter(filtered_words)

    scored = []
    for sentence in sentences:
        sentence_words = re.findall(r"\b[a-zA-Z]{3,}\b", sentence.lower())
        score = sum(freq.get(word, 0) for word in sentence_words)
        scored.append((sentence, score))

    top_sentences = sorted(scored, key=lambda x: x[1], reverse=True)[:4]
    ordered_top = [item[0] for item in scored if item in top_sentences]

    key_terms = [word for word, _ in freq.most_common(6)]

    summary_parts = []
    summary_parts.append("Overview:")
    summary_parts.append(" ".join(ordered_top[:3]).strip())

    if key_terms:
        summary_parts.append("\nKey terms:")
        summary_parts.append(", ".join(key_terms))

    if len(sentences) > 4:
        summary_parts.append("\nStudy takeaway:")
        summary_parts.append(ordered_top[-1] if ordered_top else sentences[0])

    return "\n".join(summary_parts).strip()


@app.get("/")
def read_root():
    return {"message": "Mwakenya backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    file_bytes = await file.read()

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    extracted_text = extract_text_from_upload(file.filename, file_bytes)
    extracted_text = clean_text(extracted_text)

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No readable text was found in the uploaded file.",
        )

    return {
        "filename": file.filename,
        "content": extracted_text,
    }


@app.post("/summarize")
def summarize_text(request: TextRequest):
    text = request.content.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Content is required.")

    summary = simple_summarize(text)

    return {"summary": summary}