# Rag-Doc-Assistant
- >A full-stack RAG application enabling users to upload documents and interact with them through natural language queries powered by AI.
- >Built with FastAPI backend, React frontend, and ChromaDB vector storage for intelligent document retrieval and question answering.

# Basic instructions about running it locally
1. For frontend:
- Create environments/environment.ts file in ```src``` folder and add below content.
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:port-number',
};
// port-number: Generally 8000 for FastAPI backend if not set explicitely.
```
2. For backend:
- Create ```.env``` file in backend folder and add below content.
```ts
GEMINI_API_KEY="YOUR-API-KEY" // change with your personal key
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
```