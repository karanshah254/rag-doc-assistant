from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import uuid
import httpx
import json

# RAG specific imports
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions

from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RAG Global Variables and Initialization (from previous step) ---
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

client = chromadb.PersistentClient(path="./chroma_db")

sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

collection_name = "codebase_docs"
try:
    collection = client.get_collection(
        name=collection_name, embedding_function=sentence_transformer_ef
    )
    print(f"Collection '{collection_name}' loaded.")
except Exception as e:
    print(f"Collection '{collection_name}' not found, creating it. Error: {e}")
    collection = client.create_collection(
        name=collection_name, embedding_function=sentence_transformer_ef
    )
    print(f"Collection '{collection_name}' created.")

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    add_start_index=True,
)


# --- Pydantic model for incoming query requests ---
class QueryRequest(BaseModel):
    query: str


# --- LLM Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = os.getenv("GEMINI_API_URL")

if not GEMINI_API_KEY:
    print(
        "WARNING: GEMINI_API_KEY not found in environment variables. LLM calls will fail."
    )
    print(
        "Please create a .env file in the backend directory with GEMINI_API_KEY='YOUR_API_KEY_HERE'"
    )


# --- Helper function to process a single document (from previous step) ---
async def process_document(file_path: str, filename: str):
    file_extension = os.path.splitext(filename)[1].lower()
    documents = []

    try:
        if file_extension == ".txt" or file_extension == ".md":
            loader = TextLoader(file_path)
            documents = loader.load()
        elif file_extension == ".pdf":
            loader = PyPDFLoader(file_path)
            documents = loader.load()
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

        chunks = text_splitter.split_documents(documents)

        ids = []
        metadatas = []
        documents_to_add = []

        for i, chunk in enumerate(chunks):
            chunk_id = (
                f"{os.path.basename(filename).split('.')[0]}_{i}_{uuid.uuid4().hex[:8]}"
            )
            ids.append(chunk_id)
            documents_to_add.append(chunk.page_content)

            metadata = chunk.metadata
            metadata["source"] = filename
            metadata["chunk_index"] = i
            metadatas.append(metadata)

        if documents_to_add:
            collection.add(documents=documents_to_add, metadatas=metadatas, ids=ids)
            print(f"Added {len(documents_to_add)} chunks from {filename} to ChromaDB.")
            return {
                "status": "success",
                "message": f"Processed {len(documents_to_add)} chunks from {filename}",
            }
        else:
            return {
                "status": "success",
                "message": f"No content to process in {filename}",
            }

    except Exception as e:
        print(f"Error processing {filename}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process document {filename}: {e}"
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


# --- API Endpoints ---
@app.get("/")
async def read_root():
    return {"message": "Welcome to Codebase QA Backend API!"}


@app.get("/health")
async def health_check():
    try:
        client.heartbeat()
        chroma_status = "ok"
    except Exception as e:
        chroma_status = f"error: {e}"

    return {
        "status": "ok",
        "message": "Backend is healthy and CORS is configured!",
        "chroma_db_status": chroma_status,
    }


@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await process_document(file_location, file.filename)
        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Error during file upload or processing: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to upload and process document: {e}"
        )


# --- Endpoint to clear all documents from ChromaDB ---
@app.post("/clear-documents")
async def clear_documents():
    """
    Clears all documents from the ChromaDB collection.
    This effectively resets the knowledge base.
    """
    global collection  # Declare global to modify the collection object

    try:
        # Delete the existing collection
        client.delete_collection(name=collection_name)
        print(f"Collection '{collection_name}' deleted.")

        # Re-create an empty collection with the same embedding function
        collection = client.create_collection(
            name=collection_name, embedding_function=sentence_transformer_ef
        )
        print(f"Collection '{collection_name}' re-created and is now empty.")

        return {
            "status": "success",
            "message": f"All documents cleared from {collection_name}.",
        }
    except Exception as e:
        print(f"Error clearing documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear documents: {e}")


# --- Endpoint to list all documents in ChromaDB ---
@app.get("/list-documents")
async def list_documents():
    """
    Lists all unique source documents currently in the ChromaDB collection.
    """
    try:
        results = collection.get(
            ids=None,
            where=None,
            limit=None,
            offset=0,
            include=["metadatas"],
        )

        # Extract unique source filenames from the metadata
        unique_sources = set()
        for metadata in results.get("metadatas", []):
            if "source" in metadata:
                unique_sources.add(metadata["source"])

        # Convert set to list for JSON serialization
        return {"status": "success", "documents": sorted(list(unique_sources))}
    except Exception as e:
        print(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {e}")


# --- Endpoint to list all documents in ChromaDB ---
@app.get("/list-documents")
async def list_documents():
    """
    Lists all unique source documents currently in the ChromaDB collection.
    """
    try:
        results = collection.get(
            ids=None,
            where=None,
            limit=None,
            offset=0,
            include=["metadatas"],
        )

        # Extract unique source filenames from the metadata
        unique_sources = set()
        for metadata in results.get("metadatas", []):
            if "source" in metadata:
                unique_sources.add(metadata["source"])

        # Convert set to list for JSON serialization
        return {"status": "success", "documents": sorted(list(unique_sources))}
    except Exception as e:
        print(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {e}")


# --- RAG Query Endpoint ---
@app.post("/ask")
async def ask_question(request: QueryRequest):
    """
    Receives a user query, retrieves relevant chunks from ChromaDB,
    and uses an LLM to generate an answer based on the context.
    """
    user_query = request.query
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # 1. Retrieve relevant chunks from ChromaDB
        # Embed the user query
        query_embedding = embedding_model.encode(user_query).tolist()

        # Query the ChromaDB collection
        # n_results: number of top similar chunks to retrieve
        # include: specify what to return (documents, metadatas, distances)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=5,  # Retrieve top 5 most relevant chunks
            include=["documents", "metadatas", "distances"],
        )

        retrieved_chunks = results["documents"][0] if results["documents"] else []
        retrieved_metadatas = results["metadatas"][0] if results["metadatas"] else []

        # Prepare sources for the frontend
        sources = []
        for i, metadata in enumerate(retrieved_metadatas):
            source_info = {
                "content": retrieved_chunks[i],
                "source": metadata.get("source", "Unknown"),
                "chunk_index": metadata.get("chunk_index", "N/A"),
                "page": metadata.get("page", "N/A"),  # For PDF pages
            }
            sources.append(source_info)

        # 2. Construct prompt for LLM
        context_str = "\n\n".join([chunk for chunk in retrieved_chunks])

        # This prompt instructs the LLM to answer based on provided context and to cite sources.
        prompt = f"""
        You are a helpful AI assistant specialized in answering questions based on provided documentation.
        Answer the following question based ONLY on the context provided below.
        If the answer cannot be found in the context, respond with "I cannot answer this question based on the provided documentation."
        Do not make up information.

        Context:
        {context_str}

        Question: {user_query}

        Answer:
        """

        # 3. Call the LLM (Gemini API)
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,  # Lower temperature for more factual, less creative answers
                "topK": 1,
                "topP": 1,
            },
        }
        headers = {"Content-Type": "application/json"}
        api_url_with_key = (
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
            if GEMINI_API_KEY
            else GEMINI_API_URL
        )

        async with httpx.AsyncClient() as client:
            llm_response = await client.post(
                api_url_with_key, headers=headers, json=payload, timeout=60.0
            )
            llm_response.raise_for_status()

        response_data = llm_response.json()

        generated_text = "No response from LLM."
        if (
            response_data
            and response_data.get("candidates")
            and len(response_data["candidates"]) > 0
        ):
            if (
                response_data["candidates"][0].get("content")
                and response_data["candidates"][0]["content"].get("parts")
                and len(response_data["candidates"][0]["content"]["parts"]) > 0
            ):
                generated_text = response_data["candidates"][0]["content"]["parts"][
                    0
                ].get("text", "No text content found.")
        else:
            print(f"Unexpected LLM response structure: {response_data}")
            generated_text = "Error: Could not parse LLM response."

        return {
            "answer": generated_text,
            "sources": sources,
            "retrieved_chunk_count": len(retrieved_chunks),
        }

    except Exception as e:
        print(f"Error during RAG query: {e}")
        if "llm_response" in locals():
            print(f"LLM Raw Response: {llm_response.text}")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {e}")
