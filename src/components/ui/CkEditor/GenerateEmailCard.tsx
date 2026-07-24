import magicAiIcon from "@images/magic-text-icon-hover.svg";
import SubmitAiIcon from "@images/submit-icon-blue.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import InteractiveIcon from "../InteractiveIcon";
import { useGenerateEmail } from "@hooks/useGenerateEmail";

interface GenerateEmailCardProps {
    editor?: any;
    onClose?: () => void;
    onInsert?: (subject: string) => void;
}

const GenerateEmailCard = ({ editor, onClose, onInsert }: GenerateEmailCardProps) => {
    const {
        inputValue,
        generatedEmail,
        hasStartedTyping,
        isSubmitDisabled,
        handleInputChange,
        handleKeyDown,
        handleSubmit,
        handleClose,
        insertIntoEditorHandler,
    } = useGenerateEmail({ onClose, onInsert });

    return (
        <div id="generate-panel" className="generate-panel-ai">
            <div className="d-flex align-items-center position-relative">
                <div className="form-group w-100 m-0">
                    <div className="input-icon-add position-relative">
                        <img src={magicAiIcon} alt="AI" className="input-icon-1" />
                        <input 
                            type="text" 
                            id="refine-input" 
                            className="form-control refine-input" 
                            placeholder="Describe what you want to say..." 
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        {hasStartedTyping && (
                            <button 
                                id="generate-btn" 
                                className="btn generate-panel-submit-btn" 
                                disabled={isSubmitDisabled}
                                onClick={handleSubmit}
                            >
                                <img src={SubmitAiIcon} width="20" alt="Generate" />
                            </button>
                        )}
                    </div>
                </div>
                    <button type="button" className="btn ms-2 btn-close-panel" onClick={handleClose}>
                        <InteractiveIcon
                            defaultIcon={closeIcon}
                            hoverIcon={closeIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                        tooltip="Close"
                        />
                    </button>
            </div>

            {generatedEmail && (
                <div className="generate-panel-sub mt-3" id="subject-container" >
                    <strong>Subject:</strong> <span id="subject">{generatedEmail.subject}</span>
                    <div id="body" className="mt-3" dangerouslySetInnerHTML={{ __html: generatedEmail.body }}></div>
                    <div id="generate-email-action-bar" className="mt-3 generate-email-action-bar">
                        <button className="btn-new btn-new-bg" onClick={() => insertIntoEditorHandler(editor)}>Insert</button>
                        <button className="btn-new ms-2" onClick={handleClose}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GenerateEmailCard;