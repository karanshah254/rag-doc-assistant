/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import '../App.css';
import { environment } from '../environments/environment';

interface DocumentListProps {
    refreshTrigger: number;
}

const DocumentList: React.FC<DocumentListProps> = ({ refreshTrigger }) => {
    const [documents, setDocuments] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${environment.apiUrl}/list-documents`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDocuments(data.documents || []);
        } catch (e: any) {
            console.error("Failed to fetch document list:", e);
            setError(`Failed to load documents: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [refreshTrigger]);

    return (
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            <h2 className="section-title">Uploaded Documents</h2>
            {loading && <p className="status-info">Loading documents...</p>}
            {error && <p className="status-message status-error">{error}</p>}
            {!loading && !error && documents.length === 0 && (
                <p className="status-muted">No documents uploaded yet. Upload some documentation to get started!</p>
            )}
            {!loading && !error && documents.length > 0 && (
                <ul className="sources-list" style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                    {documents.map((docName, index) => (
                        <li key={index} className="source-item" style={{ backgroundColor: '#f0f8ff', borderColor: '#d0e9fa' }}>
                            {docName}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DocumentList;