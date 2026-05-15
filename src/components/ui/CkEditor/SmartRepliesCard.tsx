import smartMessageIcon from "@images/smart-message-icon-16.svg";
import { useSmartReplies } from "@hooks/useSmartReplies";

interface SmartRepliesCardProps {
    editor?: any;
    emailContent?: string;
    onClose?: () => void;
}

const SmartRepliesCard = ({ editor, emailContent, onClose }: SmartRepliesCardProps) => {
    const { smartReplies, isLoading, error, handleSmartReplyClick } = useSmartReplies({
        emailContent,
        onSmartReplyClick: (reply: string) => {
            if (editor) {
                editor.model.change(() => {
                    const root = editor.model.document.getRoot();

                    // Insert at the very beginning of the content
                    let insertPosition = editor.model.createPositionAt(root, 0);

                    const uniqueId = `smart-reply-text`;
                    const viewFragment = editor.data.processor.toView(`<p id="${uniqueId}" data-smart-reply="true">${reply}</p><p>&nbsp;</p>`);
                    const modelFragment = editor.data.toModel(viewFragment);
                    editor.model.insertContent(modelFragment, insertPosition);
                });
            }
            // Hide the smart replies card after clicking
            onClose?.();
        }
    });

    if (isLoading) {
        return (
            <div className="smart-replies" id="smart-replies-editor-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="email-loader-container">
                    <div className="email-loader-dots">
                        <div className="email-loader-dot"></div>
                        <div className="email-loader-dot"></div>
                        <div className="email-loader-dot"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="smart-replies" id="smart-replies-editor-1" style={{ display: 'flex' }}>
                <div className="d-flex align-items-center">
                    <span className="me-2 text-muted">{error}</span>
                </div>
            </div>
        );
    }

    if (smartReplies.length === 0) {
        return null;
    }

    return (
        <div className="smart-replies" id="smart-replies-editor-1" style={{ display: 'flex' }}>
            {smartReplies.map((reply, index) => (
                <button
                    key={index}
                    className="btn-small-new smart-reply-suggestion hover-link"
                    onClick={() => handleSmartReplyClick(reply)}
                >
                    <img className="me-2" src={smartMessageIcon} width="16" height="16" alt="Smart reply" />
                    {reply}
                </button>
            ))}
        </div>
    );
};

export default SmartRepliesCard;
