import { getSmartReplies } from '@services/aiService/aiService';
import { useCallback, useEffect, useState } from 'react';

interface UseSmartRepliesProps {
    emailContent?: string;
    onSmartReplyClick?: (reply: string) => void;
}

export const useSmartReplies = ({ emailContent, onSmartReplyClick }: UseSmartRepliesProps = {}) => {
    const [smartReplies, setSmartReplies] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSmartReplies = useCallback(async () => {
        if (!emailContent?.trim()) {
            setSmartReplies([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await getSmartReplies({ emailContent });
            
            if (response?.data?.replies && Array.isArray(response.data.replies)) {
                setSmartReplies(response.data.replies);
            } 
            else {
                // Fallback to default replies if API doesn't return valid data
                setSmartReplies([
                    'Thanks for reaching out.',
                    'I appreciate your message.',
                    'I will look into this and respond soon.',
                    'Thank you for your patience.',
                    'Got it, let me get back to you.'
                ]);
            }
        } catch (err) {
            console.error('Error fetching smart replies:', err);
            setError('Failed to load smart replies');
            // Fallback to default replies on error
            setSmartReplies([
                'Thanks for reaching out.',
                'I appreciate your message.',
                'I will look into this and respond soon.',
                'Thank you for your patience.',
                'Got it, let me get back to you.'
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [emailContent]);

    const handleSmartReplyClick = useCallback((reply: string) => {
        onSmartReplyClick?.(reply);
    }, [onSmartReplyClick]);

    // Auto-fetch smart replies when email content changes
    useEffect(() => {
        fetchSmartReplies();
    }, [fetchSmartReplies]);

    return {
        smartReplies,
        isLoading,
        error,
        handleSmartReplyClick,
        refetch: fetchSmartReplies
    };
};
