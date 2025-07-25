import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            fontFamily: 'Inter, sans-serif',
        }}>
            <div style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                maxWidth: '450px',
                width: '90%',
                textAlign: 'center',
                position: 'relative',
                animation: 'fadeIn 0.3s ease-out',
            }}>
                <h3 style={{
                    fontSize: '1.8em',
                    color: '#4a90e2',
                    marginBottom: '15px',
                }}>{title}</h3>
                <p style={{
                    fontSize: '1.1em',
                    color: '#555',
                    marginBottom: '30px',
                    lineHeight: '1.5',
                }}>{message}</p>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '15px',
                }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            backgroundColor: '#dc3545', // Red for confirmation of a destructive action
                            color: 'white',
                            padding: '12px 25px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '1em',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#6c757d', // Grey for cancel
                            color: 'white',
                            padding: '12px 25px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '1em',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5a6268')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;