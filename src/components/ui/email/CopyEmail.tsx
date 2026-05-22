import copyIcon from "@images/copy-icon.svg";
import checkIcon from "@images/right-check-icon.svg"
import { useState } from "react";

interface CopyEmailProps {
    initial: string;
    name: string;
    email: string;
}

function CopyEmail({ initial, name, email }: CopyEmailProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(email.trim());
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 1000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="profile-hover-v email-hover-popup">
            <div className="d-flex align-items-center profile-section">
                <span className="mail-profile-label ms-0">{initial}</span>
                <div className="d-block">
                    <span className="mail-profile-name d-block">{name}</span>
                    <div 
                        className="d-flex align-items-center copy-text" 
                        style={{ cursor: "pointer" }}
                        onClick={handleCopy}
                    >
                        <span className="mail-profile-id d-block me-2">
                            {email}
                        </span>
                        <div className="d-flex align-items-center">
                            {copied ? (
                                <>
                                    <img
                                        src={checkIcon}
                                        alt="Copied"
                                        style={{ cursor: "default", width: "20px" }} />
                                    <span className="copied-text me-1">Copied..</span>

                                </>
                            ) : (
                                <img
                                    src={copyIcon}
                                    alt="Copy email"
                                    style={{ width: "20px", height: "20px" }}
                                />
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default CopyEmail;
