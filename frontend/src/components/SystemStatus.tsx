import React from 'react';

interface SystemStatusProps {
    backendStatus: string;
    backendMessage: string;
    chromaStatus: string;
    backendError: string | null;
}

const SystemStatus: React.FC<SystemStatusProps> = ({
    backendStatus,
    backendMessage,
    chromaStatus,
    backendError,
}) => {
    return (
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ fontSize: '1.8em', color: '#555', marginBottom: '15px' }}>System Status</h2>
            <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                Backend Status: <strong style={{ color: backendStatus === 'ok' ? '#28a745' : '#dc3545' }}>{backendStatus}</strong>
            </p>
            {backendMessage && (
                <p style={{ fontSize: '1em', color: '#6c757d' }}>
                    Backend Message: <em>{backendMessage}</em>
                </p>
            )}
            {chromaStatus && (
                <p style={{ fontSize: '1em', color: chromaStatus.startsWith('ok') ? '#28a745' : '#dc3545' }}>
                    ChromaDB Status: <em>{chromaStatus}</em>
                </p>
            )}
            {backendError && (
                <p style={{ fontSize: '1em', color: '#dc3545', marginTop: '15px', fontWeight: 'bold' }}>
                    {backendError}
                </p>
            )}
        </div>
    );
};

export default SystemStatus;