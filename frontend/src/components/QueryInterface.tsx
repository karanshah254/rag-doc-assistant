import React, { useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';

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

interface QueryInterfaceProps {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    // answer: string;
    // sources: Source[];
    queryStatus: string;
    queryError: string | null;
    isQuerying: boolean;
    handleQuerySubmit: (event: FormEvent) => Promise<void>;
    chatHistory: ChatMessage[];
    handleClearChat: () => void;
    openCopyModal: (message: string) => void;
}

const QueryInterface: React.FC<QueryInterfaceProps> = ({
    query,
    setQuery,
    // answer,
    // sources,
    queryStatus,
    queryError,
    isQuerying,
    handleQuerySubmit,
    chatHistory,
    handleClearChat,
    openCopyModal,
}) => {

    const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

    // Auto-scroll to the bottom of the chat history
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]); // Scroll whenever chatHistory changes

    // Handler for query input change (local to this component, but updates parent state)
    const handleQueryChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setQuery(event.target.value);
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            openCopyModal('The answer has been successfully copied to your clipboard.'); // Use modal
        } catch (err) {
            console.error('Failed to copy text: ', err);
            openCopyModal('Failed to copy answer. Please try again or copy manually.'); // Use modal for error
        }
        document.body.removeChild(textarea);
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.8em', color: '#555', marginBottom: '15px' }}>Ask a Question</h2>

            {/* Chat History Display Area */}
            <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                padding: '15px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#fcfcfc',
                marginBottom: '20px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
            }}>
                {chatHistory.length === 0 && (
                    <p style={{
                        fontSize: '1em',
                        color: '#6c757d',
                        fontStyle: 'italic',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        Start a conversation by asking a question about your documents!
                    </p>
                )}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                }}>
                    {chatHistory.map((message) => (
                        <div
                            key={message.id}
                            style={{
                                padding: '12px 18px',
                                borderRadius: '18px',
                                maxWidth: '80%',
                                wordWrap: 'break-word',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                fontSize: '1.05em',
                                lineHeight: '1.5',
                                backgroundColor: message.role === 'user' ? '#e0f7fa' : '#f1f0f0',
                                color: '#333',
                                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                                borderBottomRightRadius: message.role === 'user' ? '5px' : '18px',
                                borderBottomLeftRadius: message.role === 'assistant' ? '5px' : '18px',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center', // Align items vertically
                                fontSize: '0.85em',
                                color: '#777',
                                marginBottom: '5px',
                            }}>
                                <span style={{ fontWeight: 'bold' }}>{message.role === 'user' ? 'You' : 'Assistant'}</span>
                                <span style={{ opacity: 0.8 }}>{message.timestamp}</span>
                            </div>
                            <div style={{ margin: 0, padding: 0 }}>
                                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.text}</p>
                                {message.role === 'assistant' && (
                                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => copyToClipboard(message.text)}
                                            style={{
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                padding: '5px 10px',
                                                fontSize: '0.8em',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s ease',
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                )}
                                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                                    <div style={{
                                        marginTop: '10px',
                                        paddingTop: '10px',
                                        borderTop: '1px dashed #ccc',
                                    }}>
                                        <details style={{ marginTop: '5px' }}>
                                            <summary style={{ cursor: 'pointer', color: '#007bff', fontSize: '0.9em' }}>Sources ({message.sources.length})</summary>
                                            <ul style={{ listStyleType: 'none', padding: 0, marginTop: '5px' }}>
                                                {message.sources.map((src, idx) => (
                                                    <li key={idx} style={{
                                                        marginBottom: '5px',
                                                        backgroundColor: '#e9f7ef',
                                                        padding: '8px',
                                                        borderRadius: '5px',
                                                        border: '1px solid #d4edda',
                                                        fontSize: '0.85em'
                                                    }}>
                                                        <strong>Source:</strong> {src.source} (Chunk Index: {src.chunk_index}{src.page !== undefined ? `, Page: ${src.page}` : ''})<br />
                                                        <details style={{ marginTop: '5px' }}>
                                                            <summary style={{ cursor: 'pointer', color: '#007bff' }}>Show Content</summary>
                                                            <pre style={{
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                                backgroundColor: '#f0f0f0',
                                                                padding: '10px',
                                                                borderRadius: '5px',
                                                                marginTop: '5px',
                                                                maxHeight: '100px',
                                                                overflowY: 'auto'
                                                            }}>
                                                                {src.content}
                                                            </pre>
                                                        </details>
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {/* Ref for auto-scrolling */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Clear Chat Button */}
            {chatHistory.length > 0 && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={handleClearChat}
                        style={{
                            backgroundColor: '#6c757d', // Grey for clear chat
                            color: 'white',
                            padding: '8px 15px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.9em',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5a6268')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        Clear Chat
                    </button>
                </div>
            )}

            {/* Query Input Form */}
            <form onSubmit={handleQuerySubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <textarea
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Ask a question about your uploaded documents..."
                    rows={4}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleQuerySubmit(e);
                        }
                    }}
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1.1em',
                        resize: 'vertical'
                    }}
                />
                <button
                    type="submit"
                    disabled={!query.trim() || isQuerying}
                    style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '12px 25px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '1.1em',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                        width: '100%',
                        maxWidth: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isQuerying ? (
                        <>
                            <span style={{
                                display: 'inline-block',
                                width: '18px',
                                height: '18px',
                                border: '2px solid rgba(255,255,255,.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }}></span>
                            Processing...
                        </>
                    ) : (
                        'Get Answer'
                    )}
                </button>
            </form>
            {queryStatus && (
                <p style={{
                    marginTop: '15px',
                    fontSize: '1em',
                    color: queryStatus.includes('ready') ? '#28a745' : (queryStatus.includes('Failed') ? '#dc3545' : '#4a90e2')
                }}>
                    {queryStatus}
                </p>
            )}
            {queryError && (
                <p style={{
                    marginTop: '10px',
                    fontSize: '1em',
                    color: '#dc3545',
                    fontWeight: 'bold'
                }}>
                    {queryError}
                </p>
            )}
        </div>
    );
};

export default QueryInterface;