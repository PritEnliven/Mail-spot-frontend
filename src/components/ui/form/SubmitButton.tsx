import { useState } from 'react';

interface SubmitButtonProps {
    children: React.ReactNode;
    onClick: () => Promise<void> | void;
    className?: string;
    loading?: boolean;
}

function SubmitButton({ children, onClick, className = '', loading: propLoading = false }: SubmitButtonProps) {
    const [internalLoading, setInternalLoading] = useState(false);
    const isLoading = propLoading || internalLoading;

    const handleClick = async () => {
        try {
            setInternalLoading(true);
            await onClick(); // Supports async actions
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <button
            className={`${className} ${isLoading ? '' : 'btn-new-bg'} ${isLoading ? 'disabled' : ''}`}
            disabled={isLoading}
            onClick={handleClick}
        >
            {isLoading ? (
                <div className="spinner-border loading-spinner" role="status" style={{ width: '1rem', height: '1rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
}


export default SubmitButton;