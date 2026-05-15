import { useState, useEffect } from "react";
import { getAllSignatures } from "@services/settings/settingsService";

export interface Signature {
    _id: string;
    signatureName: string;
    body: string;
    name: string;
}

export const useSignatureManager = () => {

    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSignatures = async () => {
            try {
                setLoading(true);

                const response = await getAllSignatures();

                if (response.statusCode === 200) {
                    setSignatures(response.data?.signatures || []);
                }

            } catch (error) {
                console.error("Failed to load signatures:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSignatures();
    }, []);

    const handleSignatureSelect = (
        signature: Signature,
        setBodyValue: (value: string) => void,
        getCurrentBody: () => string
    ) => {

        setSelectedSignatureId(signature._id);

        const body = getCurrentBody() || "";

        console.log("Signature Manager: switching signature");

        // Remove existing signature
        const cleanedBody = body.replace(
            /<div[^>]*id="email-signature"[^>]*>[\s\S]*?<\/div>/i,
            ""
        );

        const newSignature = signature.body
            ? `<div id="email-signature" data-signature-id="${signature._id}">
                ${signature.body}
               </div>`
            : "";

        // Find smart reply, quoted message, and forwarded message start
        const smartReplyIndex = cleanedBody.indexOf('id="smart-reply-text"');
        const quotedIndex = cleanedBody.indexOf('id="quoted-message"');
        const forwardedIndex = cleanedBody.indexOf('id="forwarded-message"');

        let splitIndex = -1;

        // Priority: smart-reply-text > quoted-message > forwarded-message
        if (smartReplyIndex !== -1) {
            splitIndex = smartReplyIndex;
        } else if (quotedIndex !== -1) {
            splitIndex = quotedIndex;
        } else if (forwardedIndex !== -1) {
            splitIndex = forwardedIndex;
        }

        let typingArea = "";
        let quotedPart = "";

        if (splitIndex !== -1) {
            if (smartReplyIndex !== -1) {
                // For smart reply, place signature after the smart reply content
                // Find the end of the smart reply paragraph
                const smartReplyEndIndex = cleanedBody.indexOf('</p>', smartReplyIndex) + 4;
                typingArea = cleanedBody.substring(0, smartReplyEndIndex);
                quotedPart = cleanedBody.substring(smartReplyEndIndex);
            } else {
                // For quoted/forwarded messages, place signature before them
                typingArea = cleanedBody.substring(0, splitIndex);
                quotedPart = cleanedBody.substring(splitIndex);
            }
        } else {
            typingArea = cleanedBody;
        }

        const updatedBody = smartReplyIndex !== -1
            ? `
                ${typingArea.trim()}
                ${newSignature}
                ${quotedPart}
                `
            : `
                ${newSignature}
                ${typingArea.trim()}
                ${quotedPart}
                `;

        console.log("Signature Manager: updated body length", updatedBody.length);

        setBodyValue(updatedBody);
    };

    return {
        signatures,
        selectedSignatureId,
        loading,
        handleSignatureSelect,
        setSelectedSignatureId
    };
};