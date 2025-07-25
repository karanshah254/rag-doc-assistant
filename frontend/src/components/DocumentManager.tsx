import React, { type ChangeEvent, type FormEvent } from 'react';

interface DocumentManagerProps {
    selectedFile: File | null;
    setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
    uploadStatus: string;
    setUploadStatus: React.Dispatch<React.SetStateAction<string>>;
    uploadError: string | null;
    setUploadError: React.Dispatch<React.SetStateAction<string | null>>;
    isClearing: boolean;
    clearStatus: string;
    setClearStatus: React.Dispatch<React.SetStateAction<string>>;
    clearError: string | null;
    setClearError: React.Dispatch<React.SetStateAction<string | null>>;
    handleFileUpload: (event: FormEvent) => Promise<void>;
    handleClearDocuments: () => Promise<void>;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
    selectedFile,
    setSelectedFile,
    uploadStatus,
    setUploadStatus,
    uploadError,
    setUploadError,
    isClearing,
    clearStatus,
    // setClearStatus,
    clearError,
    // setClearError,
    handleFileUpload,
    handleClearDocuments,
}) => {

    // Handler for file selection (local to this component, but updates parent state)
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setUploadStatus('');
            setUploadError(null);
        } else {
            setSelectedFile(null);
        }
    };

    return (
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ fontSize: '1.8em', color: '#555', marginBottom: '15px' }}>Manage Documents</h2>
            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".txt,.md,.pdf"
                    style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        width: '100%',
                        maxWidth: '350px',
                        fontSize: '1em'
                    }}
                />
                {selectedFile && (
                    <p style={{ fontSize: '0.9em', color: '#555' }}>Selected: <strong>{selectedFile.name}</strong></p>
                )}
                <button
                    type="submit"
                    disabled={!selectedFile || uploadStatus.includes('processing')}
                    style={{
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        padding: '12px 25px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '1.1em',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease, transform 0.2s ease',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                        width: '100%',
                        maxWidth: '200px'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3a7bd5')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4a90e2')}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    Upload & Process
                </button>
            </form>
            {uploadStatus && (
                <p style={{
                    marginTop: '15px',
                    fontSize: '1em',
                    color: uploadStatus.includes('successful') ? '#28a745' : (uploadStatus.includes('Failed') ? '#dc3545' : '#4a90e2')
                }}>
                    {uploadStatus}
                </p>
            )}
            {uploadError && (
                <p style={{
                    marginTop: '10px',
                    fontSize: '1em',
                    color: '#dc3545',
                    fontWeight: 'bold'
                }}>
                    {uploadError}
                </p>
            )}

            {/* Clear Documents Button */}
            <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px dashed #eee' }}>
                <button
                    onClick={handleClearDocuments}
                    disabled={isClearing}
                    style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '1em',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease, transform 0.2s ease',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                        width: '100%',
                        maxWidth: '250px'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isClearing ? 'Clearing...' : 'Clear All Documents'}
                </button>
                {clearStatus && (
                    <p style={{
                        marginTop: '10px',
                        fontSize: '0.9em',
                        color: clearStatus.includes('Success') ? '#28a745' : (clearStatus.includes('Failed') ? '#dc3545' : '#4a90e2')
                    }}>
                        {clearStatus}
                    </p>
                )}
                {clearError && (
                    <p style={{
                        marginTop: '5px',
                        fontSize: '0.9em',
                        color: '#dc3545',
                        fontWeight: 'bold'
                    }}>
                        {clearError}
                    </p>
                )}
            </div>
        </div>
    );
};

export default DocumentManager;