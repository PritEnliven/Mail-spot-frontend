import { generateEmail } from '@services/aiService/aiService';
import { useCallback, useState } from 'react';

interface GeneratedEmail {
    subject: string;
    body: string;
}

interface UseGenerateEmailProps {
    onClose?: () => void;
    onInsert?: (subject: string) => void;
}

export const useGenerateEmail = ({ onClose, onInsert }: UseGenerateEmailProps = {}) => {
    const [inputValue, setInputValue] = useState("");
    const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasStartedTyping, setHasStartedTyping] = useState(false);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        
        if (value.trim().length > 0 && !hasStartedTyping) {
            setHasStartedTyping(true);
        } else if (value.trim().length === 0) {
            setHasStartedTyping(false);
        }
    }, [hasStartedTyping]);

    const isSubmitDisabled = inputValue.trim().split(/\s+/).filter(word => word.length > 0).length < 3 || isLoading;

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isSubmitDisabled) {
            e.preventDefault();
            handleSubmit();
        }
    }, [isSubmitDisabled]);

    const handleSubmit = useCallback(async () => {
        if (!inputValue.trim() || isLoading) return;
        setHasStartedTyping(false);
        
        setIsLoading(true);
        
        // Find the input element within the current generate panel
        const inputElement = document.querySelector('.generate-panel-ai:not([style*="display: none"]) .refine-input') as HTMLInputElement;
        
        if (inputElement) {
            inputElement.classList.add('shimmering');
            inputElement.disabled = true;
        }
        
        try {
            const response = await generateEmail({
                description: inputValue,
                recepientEmail: ""
            });
            
            if (response?.data) {
                setGeneratedEmail({
                    subject: inputValue || "No subject",
                    body: response.data.content || "No content generated"
                });
            }
        } catch (error) {
            console.error("Error generating email:", error);
            setGeneratedEmail({
                subject: "Error",
                body: "Failed to generate email. Please try again."
            });
        } 
        finally {
            setIsLoading(false);
            // Remove shimmer animation from input
            if (inputElement) {
                inputElement.classList.remove('shimmering');
                inputElement.disabled = false;
            }   
            setHasStartedTyping(true); 
        }
    }, [inputValue, isLoading]);

    const handleClose = useCallback(() => {
        setInputValue("");
        setHasStartedTyping(false);
        setGeneratedEmail(null);
        onClose?.();
    }, [onClose]);

    const insertIntoEditorHandler = useCallback((editor: any) => {
        if (editor && generatedEmail) {
            // Insert the HTML content into CKEditor
            editor.model.change(() => {
                const viewFragment = editor.data.processor.toView(generatedEmail.body);
                const modelFragment = editor.data.toModel(viewFragment);
                editor.model.insertContent(modelFragment, editor.model.document.selection.getFirstPosition());
            });

            onInsert?.(generatedEmail.subject);
            
            // Reset all values and close the card
            setInputValue("");
            setHasStartedTyping(false);
            setGeneratedEmail(null);
            
            // Call the onClose callback if provided
            onClose?.();
        }
    }, [generatedEmail, onClose, onInsert]);

    return {
        // State
        inputValue,
        generatedEmail,
        isLoading,
        hasStartedTyping,
        isSubmitDisabled,
        
        // Handlers
        handleInputChange,
        handleKeyDown,
        handleSubmit,
        handleClose,
        insertIntoEditorHandler,
    };
};
