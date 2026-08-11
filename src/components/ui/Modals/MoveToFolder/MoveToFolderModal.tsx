import BaseModal from "@components/ui/BaseModal";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { useMailData } from "@context/MailDataContext";
import { useMailUI } from "@context/MailUIContext";
import closeIconHover from "@images/close-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import draftIcon from "@images/draft-icon.svg";
import folderBrightBlueIcon from "@images/folder-bright-blue-icon.svg";
import folderDarkIcon from "@images/folder-dark-icon.svg";
import folderDeepRoyalBlueIcon from "@images/folder-deep-royal-blue-icon.svg";
import folderGrayIcon from "@images/folder-gray-icon.svg";
import folderGreenDarkIcon from "@images/folder-green-dark-icon.svg";
import folderGreenLiteIcon from "@images/folder-green-lite-icon.svg";
import folderOrangeIcon from "@images/folder-orange-icon.svg";
import folderPinkIcon from "@images/folder-pink-icon.svg";
import folderRedIcon from "@images/folder-red-icon.svg";
import folderYellowIcon from "@images/folder-yellow-icon.svg";
import importantIcon from "@images/important-icon.svg";
import inboxIcon from "@images/inbox-icon.svg";
import junkIcon from "@images/junk-icon.svg";
import sendIcon from "@images/send-icon.svg";
import starredIcon from "@images/starred-icon.svg";
import trashIcon from "@images/trash-icon.svg";
import { verifyBoxName } from "@utils/emailUtil";
import { useState } from "react";
import SimpleBar from "simplebar-react";

interface MoveToFolderModalProps {
    modalId: string;
    zIndex: number;
    onSelectFolder: (folderName: string) => void | Promise<void>;
}

type FolderOption = {
    id: string;
    label: string;
    value: string;
    icon: string;
};

const CUSTOM_FOLDER_COLOR_MAP: Record<string, string> = {
    "#212121": folderDarkIcon,
    "#EA3843": folderRedIcon,
    "#808080": folderGrayIcon,
    "#FF8A00": folderOrangeIcon,
    "#FF5BA0": folderPinkIcon,
    "#FFB800": folderYellowIcon,
    "#263DB8": folderDeepRoyalBlueIcon,
    "#49BA14": folderGreenLiteIcon,
    "#00A3EF": folderBrightBlueIcon,
    "#398415": folderGreenDarkIcon,
};

function getDefaultFolderIcon(labelOrValue: string) {
    if (verifyBoxName(labelOrValue, "inbox")) return inboxIcon;
    if (verifyBoxName(labelOrValue, "sent")) return sendIcon;
    if (verifyBoxName(labelOrValue, "junk") || verifyBoxName(labelOrValue, "spam")) return junkIcon;
    if (verifyBoxName(labelOrValue, "trash")) return trashIcon;
    if (verifyBoxName(labelOrValue, "draft")) return draftIcon;
    if (verifyBoxName(labelOrValue, "important")) return importantIcon;
    if (verifyBoxName(labelOrValue, "starred")) return starredIcon;
    return folderGrayIcon;
}

function getCustomFolderIcon(color?: string) {
    if (!color) return folderOrangeIcon;
    return CUSTOM_FOLDER_COLOR_MAP[color] || folderOrangeIcon;
}

function MoveToFolderModal({ modalId, zIndex, onSelectFolder }: MoveToFolderModalProps) {
    const { closeModal } = useMailUI();
    const { sidebarState, boxName } = useMailData();
    const [isMoving, setIsMoving] = useState(false);

    const onClose = () => closeModal(modalId);

    const defaultFolders: FolderOption[] = (sidebarState.boxes || [])
        .filter(
            (box: any) =>
                box.value !== boxName &&
                !verifyBoxName(box.value, "draft") &&
                !verifyBoxName(box.value, "scheduled")
        )
        .map((box: any) => ({
            id: box.value,
            label: box.key,
            value: box.value,
            icon: getDefaultFolderIcon(box.key || box.value),
        }));

    const customFolders: FolderOption[] = (sidebarState.customBoxes || [])
        .filter((box: any) => box.value !== boxName && box.value?.value !== boxName)
        .map((box: any) => ({
            id: box.value?.value ?? box.value,
            label: box.key ?? box.value?.name,
            value: box.value?.value ?? box.value,
            icon: getCustomFolderIcon(box.value?.color),
        }));

    const handleSelect = async (folderValue: string) => {
        if (isMoving) return;
        setIsMoving(true);
        try {
            await onSelectFolder(folderValue);
            onClose();
        } catch (error) {
            console.error("Failed to move email:", error);
        } finally {
            setIsMoving(false);
        }
    };

    const hasResults = defaultFolders.length > 0 || customFolders.length > 0;

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            className="move-to-folder-modal"
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={false}
            showBackdrop={true}
            width="100%"
            maxWidth="100%"
            minWidth="100%"
        >
            <div className="move-to-folder-sheet">
                <div className="move-to-folder-sheet__handle" aria-hidden="true" />

                <div className="move-to-folder-sheet__header">
                    <h5 className="move-to-folder-sheet__title">Move to</h5>
                    <button
                        type="button"
                        className="move-to-folder-sheet__close btn hover-link icon-hover-effect"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <InteractiveIcon
                            defaultIcon={closeIcon}
                            hoverIcon={closeIconHover}
                            activeIcon=""
                            isActive={false}
                            alt="Close"
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Close"
                        />
                    </button>
                </div>

                <SimpleBar
                    className="move-to-folder-sheet__body"
                    autoHide={false}
                    forceVisible="y"
                >
                    {!hasResults && (
                        <div className="move-to-folder-sheet__empty">No folders found</div>
                    )}

                    {defaultFolders.length > 0 && (
                        <section className="move-to-folder-sheet__section">
                            <div className="move-to-folder-sheet__section-label">Default</div>
                            <ul className="move-to-folder-sheet__list">
                                {defaultFolders.map((folder) => (
                                    <li key={folder.id}>
                                        <button
                                            type="button"
                                            className="move-to-folder-sheet__item"
                                            disabled={isMoving}
                                            onClick={() => handleSelect(folder.value)}
                                        >
                                            <img src={folder.icon} alt="" />
                                            <span>{folder.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {customFolders.length > 0 && (
                        <section className="move-to-folder-sheet__section">
                            <div className="move-to-folder-sheet__section-label">Your folders</div>
                            <ul className="move-to-folder-sheet__list">
                                {customFolders.map((folder) => (
                                    <li key={folder.id}>
                                        <button
                                            type="button"
                                            className="move-to-folder-sheet__item"
                                            disabled={isMoving}
                                            onClick={() => handleSelect(folder.value)}
                                        >
                                            <img src={folder.icon} alt="" />
                                            <span>{folder.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </SimpleBar>
            </div>
        </BaseModal>
    );
}

export default MoveToFolderModal;
