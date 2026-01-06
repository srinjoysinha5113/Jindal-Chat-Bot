"""
RAG Safety Chatbot - FastAPI Backend
Uses FAISS for vector store, Ollama for local LLM (llama3.2:1b)
Temperature: 0.1 for strict, factual responses
"""

import os
from typing import List
import pickle

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import ollama
from pypdf import PdfReader
from faiss import IndexFlatL2
import numpy as np

# Configuration
DATA_DIR = "./data"
INDEX_DIR = "./faiss_index"
EMBEDDINGS_FILE = os.path.join(INDEX_DIR, "embeddings.pkl")
CHUNKS_FILE = os.path.join(INDEX_DIR, "chunks.pkl")
METADATA_FILE = os.path.join(INDEX_DIR, "metadata.pkl")

app = FastAPI(title="RAG Safety Chatbot")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
vector_store = None
chunks_db = []
metadata_db = []


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    source_chunks: List[str]


def get_embedding(text: str) -> np.ndarray:
    """Get embedding from Ollama for a given text."""
    response = ollama.embed(model="nomic-embed-text", input=text)
    return np.array(response["embeddings"][0]).astype("float32")


def split_text_into_chunks(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """
    Simple recursive text splitter.
    """
    chunks = []
    words = text.split()
    
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    
    return chunks


def load_and_process_pdfs() -> tuple[List[str], IndexFlatL2]:
    """
    Load all PDFs from data/ folder, extract text, chunk, embed, and build FAISS index.
    """
    all_chunks = []
    
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Created {DATA_DIR} folder. Please add your PDFs here.")
    
    pdf_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(".pdf")]
    
    if not pdf_files:
        print(f"Warning: No PDF files found in {DATA_DIR}")
        return [], None
    
    # Extract text from PDFs
    for pdf_file in pdf_files:
        pdf_path = os.path.join(DATA_DIR, pdf_file)
        print(f"Loading {pdf_file}...")
        
        reader = PdfReader(pdf_path)
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text.strip():
                # Split page into chunks
                page_chunks = split_text_into_chunks(text, chunk_size=800, overlap=150)
                for chunk in page_chunks:
                    all_chunks.append({
                        "content": chunk,
                        "source": pdf_file,
                        "page": page_num + 1
                    })
    
    if not all_chunks:
        print("No text extracted from PDFs.")
        return [], None
    
    print(f"Total chunks created: {len(all_chunks)}")
    
    # Generate embeddings
    print("Generating embeddings (this may take a moment)...")
    embeddings_list = []
    for i, chunk_obj in enumerate(all_chunks):
        if i % 10 == 0:
            print(f"  Embedding chunk {i+1}/{len(all_chunks)}")
        embedding = get_embedding(chunk_obj["content"])
        embeddings_list.append(embedding)
    
    embeddings_array = np.array(embeddings_list).astype("float32")
    
    # Build FAISS index
    dimension = embeddings_array.shape[1]
    index = IndexFlatL2(dimension)
    index.add(embeddings_array)
    
    print(f"FAISS index built with {index.ntotal} vectors")
    
    return all_chunks, index, embeddings_array


def retrieve_relevant_chunks(query: str, k: int = 4) -> List[str]:
    """
    Retrieve top-k relevant chunks for a query.
    """
    global vector_store, chunks_db
    
    if vector_store is None or not chunks_db:
        return []
    
    query_embedding = get_embedding(query).reshape(1, -1)
    distances, indices = vector_store.search(query_embedding, k)
    
    retrieved = []
    for idx in indices[0]:
        if idx < len(chunks_db):
            chunk_text = chunks_db[idx]["content"]
            source = chunks_db[idx]["source"]
            page = chunks_db[idx]["page"]
            retrieved.append(f"{chunk_text}\n[Source: {source}, Page {page}]")
    
    return retrieved


def build_rag_prompt(query: str, retrieved_chunks: List[str]) -> str:
    context = "\n\n".join(retrieved_chunks)
    
    prompt = f"""
You are a safety assistant for a power plant. Answer the question using the context below.

**IMPORTANT: Format your answer using Markdown:**
- Use **bold** for important safety rules and key points
- Use bullet points (-) for steps, procedures, or lists
- Use numbered lists (1., 2., 3.) for sequential procedures
- Use `backticks` for specific values like temperatures, pressures, or measurements
- Use ## for section headers when organizing your answer
- Use ```code blocks``` for multi-line code or technical specifications

CONTEXT:
{context}

QUESTION: {query}

**Answer (use Markdown formatting):**
"""
    return prompt.strip()


@app.on_event("startup")
async def startup_event():
    """Initialize vector store on app startup."""
    global vector_store, chunks_db
    
    print("Initializing RAG system...")
    
    # Check if index already exists
    if (os.path.exists(INDEX_DIR) and 
        os.path.exists(EMBEDDINGS_FILE) and 
        os.path.exists(CHUNKS_FILE)):
        print(f"Loading existing FAISS index from {INDEX_DIR}...")
        try:
            with open(CHUNKS_FILE, "rb") as f:
                chunks_db = pickle.load(f)
            
            with open(EMBEDDINGS_FILE, "rb") as f:
                embeddings_array = pickle.load(f)
            
            dimension = embeddings_array.shape[1]
            vector_store = IndexFlatL2(dimension)
            vector_store.add(embeddings_array)
            
            print(f"Loaded {len(chunks_db)} chunks from cache")
        except Exception as e:
            print(f"Error loading cache: {e}. Rebuilding...")
            chunks_db, vector_store, embeddings_array = load_and_process_pdfs()
            save_index(embeddings_array)
    else:
        print("Building new FAISS index...")
        chunks_db, vector_store, embeddings_array = load_and_process_pdfs()
        save_index(embeddings_array)
    
    print("RAG system ready!")


def save_index(embeddings_array: np.ndarray):
    """Save embeddings and chunks to disk."""
    if not os.path.exists(INDEX_DIR):
        os.makedirs(INDEX_DIR)
    
    with open(EMBEDDINGS_FILE, "wb") as f:
        pickle.dump(embeddings_array, f)
    
    with open(CHUNKS_FILE, "wb") as f:
        pickle.dump(chunks_db, f)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "vector_store_ready": vector_store is not None,
        "chunks_loaded": len(chunks_db)
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main RAG chat endpoint.
    Retrieves relevant chunks and passes to Ollama.
    """
    global vector_store, chunks_db
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    
    if vector_store is None or not chunks_db:
        raise HTTPException(status_code=503, detail="Vector store not initialized. No PDFs loaded?")
    
    # Retrieve relevant chunks
    retrieved_chunks = retrieve_relevant_chunks(request.message, k=4)
    
    if not retrieved_chunks:
        return ChatResponse(
            answer="No relevant information found in the safety documents.",
            source_chunks=[]
        )
    
    # Build RAG prompt
    prompt = build_rag_prompt(request.message, retrieved_chunks)
    
    # Call Ollama with temperature=0.1 for strict, factual responses
    try:
        response = ollama.chat(
            model="llama3.2:1b",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1},
            stream=False,
        )
        
        answer = response["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
    
    return ChatResponse(
        answer=answer,
        source_chunks=retrieved_chunks[:2]  # Return top 2 chunks
    )


@app.post("/rebuild-index")
async def rebuild_index():
    """
    Admin endpoint to rebuild the vector index (e.g., after adding new PDFs).
    """
    global vector_store, chunks_db
    
    print("Rebuilding index...")
    chunks_db, vector_store, embeddings_array = load_and_process_pdfs()
    save_index(embeddings_array)
    
    return {
        "status": "success",
        "chunks_loaded": len(chunks_db),
        "vector_store_ready": vector_store is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
