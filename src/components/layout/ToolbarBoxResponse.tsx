import InteractiveIcon from "@components/ui/InteractiveIcon";
import moreActionIcon from "@images/ellipsis-vertical-icon.svg";
import moreActionIconHover from "@images/ellipsis-vertical-icon-hover.svg";
import { useMailData, useMailSelection, useMailUI } from '../../context/index';
import { verifyBoxName } from "@utils/emailUtil";
import { markedAsLabel } from "@services/emailAction/emailActionService";
import { showSuccess } from "@components/ui/toast/toastNotification";
import { useEffect, useState, useRef } from "react";
import SimpleBar from 'simplebar-react';

const ToolbarBox = () => {
    const { boxName, sidebarState, emails, updateBoxCount, deleteEmailState, } = useMailData();
    const { selectedEmails, clearEmailSelection } = useMailSelection();
    const { toolbarState, activeEmailMessageId, openModal, } = useMailUI();
    const [moveToFolderOptions, setMoveToFolderOptions] = useState<any>({});

    //create moveTo folder options list from sidebarSteate

    useEffect(() => {
        const originalBoxes = sidebarState.boxes.filter((box) => box.value !== boxName && !verifyBoxName(box.value, 'draft'));
        const customBoxes = sidebarState.customBoxes.filter((box) => box.value !== boxName);
        setMoveToFolderOptions({
            boxes: originalBoxes,
            customBoxes: customBoxes
        })
        if (selectedEmails.size === 0) {
            const checkboxAll = document.getElementById('checkboxAll') as HTMLInputElement | null;
            if (checkboxAll) {
                checkboxAll.checked = false;
            }
        }
    }, [sidebarState, boxName, selectedEmails]);

    const moveToFolderHandler = async (folderName: string) => {
        const messageIds = selectedEmails.size > 0
            ? Array.from(selectedEmails)
            : (activeEmailMessageId ? [activeEmailMessageId] : []);

        const payload = {
            messageIds: messageIds as string[],
            current_active_box: boxName,
            label: folderName
        }

        const response = await markedAsLabel(payload);
        if (response.statusCode === 200) {
            showSuccess("Email moved successfully");

            // now after moving update count to that specific box update it's sidebar unread count if trash then don't read/unread just set that total selectedEmail count in trash increase it. and then remove that emails from list and clear email selection.
            const movedEmailIds = Array.from(selectedEmails);
            const movedEmails = emails.filter(email => movedEmailIds.includes(email.messageId));

            // Update counts for the target folder
            if (verifyBoxName(folderName, 'trash') || verifyBoxName(folderName, 'junk')) {
                // For trash: increase total count by number of moved emails
                updateBoxCount(folderName, 0, movedEmails.length);
            } else {
                // For other folders: update unread count based on read/unread status of moved emails
                const unreadMovedCount = movedEmails.filter(email => !email.isSeen).length;
                updateBoxCount(folderName, unreadMovedCount, movedEmails.length);
            }

            // Update counts for the source folder (current box)
            const unreadRemovedCount = movedEmails.filter(email => !email.isSeen).length;
            updateBoxCount(boxName, -unreadRemovedCount, -movedEmails.length);

            // Remove moved emails from the current list
            deleteEmailState(movedEmailIds);

            // Clear email selection
            clearEmailSelection();

            // Visually uncheck the master checkbox without firing its click handler
            const checkboxAll = document.getElementById('checkboxAll') as HTMLInputElement | null;
            if (checkboxAll) {
                checkboxAll.checked = false;
            }
        }
    }

    const createFolderHandler = () => {
        openModal('createCustomFolder');
    }

        const [isMoreOpen, setIsMoreOpen] = useState(false);
        const dropdownRef = useRef<any>(null);


        useEffect(() => {
    const handleClickOutside = (event: any) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsMoreOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, []);

    return (
        <>
            <div
                ref={dropdownRef}
                className={`more-actions-dropdown react-dropdown ${toolbarState.showMove ? '' : 'd-none'}`}
            >
                {/* Toggle */}
                <a
                    className="hover-link d-flex align-items-center icon-hover-effect"
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                >
                    <InteractiveIcon
                        defaultIcon={moreActionIcon}
                        hoverIcon={moreActionIconHover}
                        activeIcon=""
                        isActive={false}
                        alt=""
                        className="interactive-icon hover-image"
                        renderAs="img"
                        tooltip="More"
                    />
                </a>

                {/* Menu */}
                {isMoreOpen && (
                    <div className="dropdown-menu show">
                        <div className="react-subdropdown">
                            <SimpleBar
                                className="eventInfoModalSimpleBar"
                                autoHide={false}
                                forceVisible="y"
                                style={{ maxHeight: '300px' }}
                            >
                                {/* Default Boxes */}
                                {moveToFolderOptions.boxes && moveToFolderOptions.boxes.map((box: any) => (
                                    <div
                                        key={box.value}
                                        className="dropdown-item"
                                        onClick={() => {
                                            moveToFolderHandler(box.value);
                                            setIsMoreOpen(false);
                                        }}
                                    >
                                        {box.key}
                                    </div>
                                ))}

                                <div className="dropdown-divider" />

                                {/* Custom Boxes */}
                                {moveToFolderOptions.customBoxes && moveToFolderOptions.customBoxes.map((box: any) => (
                                    <div
                                        key={box.value.value}
                                        className="dropdown-item"
                                        onClick={() => {
                                            moveToFolderHandler(box.value.value);
                                            setIsMoreOpen(false);
                                        }}
                                    >
                                        {box.key}
                                    </div>
                                ))}

                                <div className="dropdown-divider" />

                                {/* Create Folder */}
                                <div
                                    className="dropdown-item"
                                    onClick={() => {
                                        createFolderHandler();
                                        setIsMoreOpen(false);
                                    }}
                                >
                                    Create folder
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default ToolbarBox;