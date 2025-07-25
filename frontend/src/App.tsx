/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, type FormEvent } from 'react';
import './App.css';

// import SystemStatus from './components/SystemStatus';
import DocumentManager from './components/DocumentManager';
import QueryInterface from './components/QueryInterface';
import Modal from './components/Modal'; // NEW: Import Modal component
import DocumentList from './components/DocumentList';
import { environment } from './environments/environment';

interface Source {
  content: string;
  source: string;
  chunk_index: number;
  page?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: Source[];
  timestamp: string;
}

function App() {
  // Backend status states
  const [backendStatus, setBackendStatus] = useState<string>('Loading backend status...');
  const [backendMessage, setBackendMessage] = useState<string>('');
  const [chromaStatus, setChromaStatus] = useState<string>('');
  const [backendError, setBackendError] = useState<string | null>(null);

  // Document upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Document clear states
  const [clearStatus, setClearStatus] = useState<string>('');
  const [clearError, setClearError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false); // State for clear confirmation modal

  // RAG query states
  const [query, setQuery] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [sources, setSources] = useState<Source[]>([]);
  const [queryStatus, setQueryStatus] = useState<string>('');
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  // State to trigger document list refresh
  const [documentListRefreshKey, setDocumentListRefreshKey] = useState<number>(0);

  // Chat history state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // States for Copy Modal
  const [showCopyModal, setShowCopyModal] = useState<boolean>(false);
  const [copyModalMessage, setCopyModalMessage] = useState<string>('');

  // States for Clear Chat Modal
  const [showClearChatModal, setShowClearChatModal] = useState<boolean>(false);

  // Effect for checking backend health
  useEffect(() => {
    const fetchBackendStatus = async () => {
      try {
        const response = await fetch(`${environment.apiUrl}/health`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBackendStatus(data.status);
        setBackendMessage(data.message);
        setChromaStatus(data.chroma_db_status);
        setDocumentListRefreshKey(prev => prev + 1);
      } catch (e: any) {
        console.error("Failed to fetch backend status:", e);
        setBackendError(`Error connecting to backend: ${e.message}. Make sure the backend server is running.`);
        setBackendStatus('Error');
      }
    };

    fetchBackendStatus();
  }, []);

  // Handler for file upload submission
  const handleFileUpload = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploadStatus('Uploading and processing...');
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${environment.apiUrl}/upload-document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setUploadStatus(`Upload successful! ${result.message}`);
      setSelectedFile(null);
      setAnswer('');
      setSources([]);
      setQuery('');
      setChatHistory([]);
      setDocumentListRefreshKey(prev => prev + 1);
    } catch (e: any) {
      console.error("File upload failed:", e);
      setUploadError(`Upload failed: ${e.message}`);
      setUploadStatus('Failed');
    }
  };

  // Modal control functions
  const openClearModal = () => setShowClearModal(true);
  const closeClearModal = () => setShowClearModal(false);

  // Handler for confirming document clear (called from modal)
  const confirmClearDocuments = async () => {
    closeClearModal(); // Close the modal immediately

    setIsClearing(true);
    setClearStatus('Clearing all documents...');
    setClearError(null);
    setAnswer('');
    setSources([]);
    setQuery('');
    setChatHistory([]);

    try {
      const response = await fetch(`${environment.apiUrl}/clear-documents`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setClearStatus(`Success: ${result.message}`);
    } catch (e: any) {
      console.error("Failed to clear documents:", e);
      setClearError(`Failed to clear documents: ${e.message}`);
      setClearStatus('Failed');
    } finally {
      setIsClearing(false);
    }
  };

  // Handler for submitting the query
  const handleQuerySubmit = async (event: FormEvent) => {
    event.preventDefault();

    const currentQuery = query.trim(); // Capture query before clearing input
    if (!currentQuery) {
      setQueryError('Please enter a question.');
      return;
    }

    // Add user message to history
    setChatHistory(prev => [...prev, {
      id: Date.now().toString() + '-user', // Simple unique ID
      role: 'user',
      text: currentQuery,
      timestamp: new Date().toLocaleTimeString(),
    }]);

    setQuery('');
    setIsQuerying(true);
    setQueryStatus('Thinking...');
    setQueryError(null);
    setAnswer('');
    setSources([]);

    try {
      const response = await fetch(`${environment.apiUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnswer(result.answer);
      setSources(result.sources);
      setQueryStatus('Answer ready!');

      // Add assistant message to history
      setChatHistory(prev => [...prev, {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        text: result.answer,
        sources: result.sources,
        timestamp: new Date().toLocaleTimeString(),
      }]);

    } catch (e: any) {
      console.error("Query failed:", e);
      setQueryError(`Query failed: ${e.message}`);
      setQueryStatus('Failed');
      setChatHistory(prev => [...prev, {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        text: `Error: Failed to get an answer. ${e.message}`,
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setIsQuerying(false);
    }
  };

  // NEW: Handlers for Copy Modal
  const openCopyModal = (message: string) => {
    setCopyModalMessage(message);
    setShowCopyModal(true);
  };
  const closeCopyModal = () => {
    setShowCopyModal(false);
    setCopyModalMessage('');
  };

  // NEW: Handlers for Clear Chat Modal
  const openClearChatModal = () => setShowClearChatModal(true);
  const closeClearChatModal = () => setShowClearChatModal(false);


  const confirmClearChat = () => {
    closeClearChatModal(); // Close the modal
    setChatHistory([]);
    setQuery('');
    setAnswer('');
    setSources([]);
    setQueryStatus('');
    setQueryError(null);
  };

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      color: '#333',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '800px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '2.5em',
          marginBottom: '20px',
          color: '#4a90e2'
        }}>
          Codebase QA App
        </h1>

        {/* <SystemStatus
          backendStatus={backendStatus}
          backendMessage={backendMessage}
          chromaStatus={chromaStatus}
          backendError={backendError}
        /> */}

        <DocumentList refreshTrigger={documentListRefreshKey} />

        <DocumentManager
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          uploadStatus={uploadStatus}
          setUploadStatus={setUploadStatus}
          uploadError={uploadError}
          setUploadError={setUploadError}
          isClearing={isClearing}
          clearStatus={clearStatus}
          setClearStatus={setClearStatus}
          clearError={clearError}
          setClearError={setClearError}
          handleFileUpload={handleFileUpload}
          handleClearDocuments={async () => { openClearModal(); }}
        />

        <QueryInterface
          query={query}
          setQuery={setQuery}
          // answer={answer}
          // sources={sources}
          queryStatus={queryStatus}
          queryError={queryError}
          isQuerying={isQuerying}
          handleQuerySubmit={handleQuerySubmit}
          chatHistory={chatHistory}
          handleClearChat={openClearChatModal}
          openCopyModal={openCopyModal}
        />
      </div>

      {/* NEW: Render the Modal component */}
      <Modal
        isOpen={showClearModal}
        onClose={closeClearModal}
        onConfirm={confirmClearDocuments}
        title="Confirm Clear Documents"
        message="Are you absolutely sure you want to remove ALL uploaded documents from the knowledge base? This action cannot be undone."
        confirmText="Yes, Clear All"
        cancelText="No, Keep Documents"
      />

      {/* NEW: Modal for Copy Confirmation */}
      <Modal
        isOpen={showCopyModal}
        onClose={closeCopyModal}
        onConfirm={closeCopyModal}
        title="Copied to Clipboard!"
        message={copyModalMessage}
        confirmText="OK"
      // cancelText=""
      />

      {/* NEW: Modal for Clear Chat Confirmation */}
      <Modal
        isOpen={showClearChatModal}
        onClose={closeClearChatModal}
        onConfirm={confirmClearChat}
        title="Confirm Clear Chat"
        message="Are you sure you want to clear the entire chat history? This action cannot be undone."
        confirmText="Yes, Clear Chat"
        cancelText="No, Keep Chat"
      />

    </div>
  );
}

export default App;