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
                <span className="d-inline-flex align-items-center gap-2">
                    <span
                        className="spinner-border spinner-border-sm text-light"
                        role="status"
                        aria-hidden="true"
                    />
                    {/* <span>Saving...</span> */}
                </span>
            ) : (
                children
            )}
        </button>
    );
}


export default SubmitButton;