// import InteractiveIcon from "@components/ui/InteractiveIcon";
// import editIcon from '@images/edit2-icon.svg';
// import editIconHover from '@images/edit2-icon-hover.svg';
// import deleteIcon from '@images/trash-icon.svg';
// import deleteIconHover from '@images/trash-icon-hover.svg';
// import checkBoxIcon from '@images/checkbox-check-box-green.svg';
// import { useState } from "react";
// import { type ShortCutType } from "@context/SettingsContext";

// interface KeyboardShortCutListProps {
//     shortcuts: ShortCutType[];
// }

// const KeyboardShortCutList = ({ shortcuts }: KeyboardShortCutListProps) => {

//     const [editingId, setEditingId] = useState<string | null>(null);
//     const [shortcutValue, setShortcutValue] = useState('');

//     const formatActionName = (name: string) =>
//         name
//             .split('_')
//             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//             .join(' ');

//     const handleEdit = (id: string, value: string) => {
//         setEditingId(id);
//         setShortcutValue(value);
//     };

//     const handleSave = (id: string) => {
//         console.log('save', id, shortcutValue);

//         // API call here

//         setEditingId(null);
//         setShortcutValue('');
//     };

//     const handleDelete = (id: string) => {
//         console.log('delete', id);
//     };

//     return (
//         <div className="setting-features pt-0 pb-0 pe-0 ">
//             <div className="setting-signature-box">
//                 <div className="signature-table-new key-table-new ">
//                     <table className="table" id="shortcutkeyTable">
//                         <thead>
//                             <tr>
//                                 <th>
//                                     <div className="setting-th-head">No.</div>
//                                 </th>
//                                 <th>
//                                     <div className="setting-th-head">Action Name</div>
//                                 </th>
//                                 <th className="Default-size">
//                                     <div className="setting-th-head ">Default Shortcut</div>
//                                 </th>
//                                 <th className="text-end">
//                                     <div className="setting-th-head">Action</div>
//                                 </th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {shortcuts.map((item: any, index: any) => {
//                                 const isEditing = editingId === item.id;

//                                 return (
//                                     <tr key={item.id} className={`blue-line-aft${isEditing ? ' active' : ''}`}>

//                                         <td>{index + 1}</td>
//                                         <td>{formatActionName(item.name)}</td>

//                                         <td>
//                                             <div className="shortcut-key-change-box" style={{ minWidth: '120px', display: 'flex', alignItems: 'center' }}>
//                                                 {isEditing ? (
//                                                     <input
//                                                         type="text"
//                                                         autoFocus
//                                                         className="shortcut-name-input"
//                                                         value={item.defaultValue}
//                                                         readOnly
//                                                         placeholder="Press shortcut..."
//                                                         style={{ display: 'inline-block' }}
//                                                         onKeyDown={(e) => {
//                                                             const key = e.key.toLowerCase();

//                                                             if (['control', 'shift', 'alt', 'meta'].includes(key)) {
//                                                                 return;
//                                                             }

//                                                             const keys: string[] = [];

//                                                             if (e.ctrlKey) keys.push('ctrl');
//                                                             if (e.shiftKey) keys.push('shift');
//                                                             if (e.altKey) keys.push('alt');
//                                                             if (e.metaKey) keys.push('meta');

//                                                             keys.push(key);
//                                                             setShortcutValue(keys.join('+'));
//                                                         }}
//                                                     />
//                                                 ) : (
//                                                     <div className="display-shortcut">
//                                                         <span className="shortcut-name-text">
//                                                             {item.defaultValue}
//                                                         </span>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </td>

//                                         <td>
//                                             <div className="d-flex align-items-center justify-content-end">
//                                                 {isEditing ? (
//                                                     <a
//                                                         href="#"
//                                                         onClick={(e) => {
//                                                             e.preventDefault();
//                                                             handleSave(item.id);
//                                                         }}
//                                                         className="hover-link align-items-center me-2"
//                                                     >
//                                                         <img
//                                                             src={checkBoxIcon}
//                                                             alt="Save"
//                                                             className="interactive-icon hover-image"
//                                                         />
//                                                     </a>
//                                                 ) : (
//                                                     <a
//                                                         href="#"
//                                                         onClick={(e) => {
//                                                             e.preventDefault();
//                                                             handleEdit(item.id, item.key);
//                                                         }}
//                                                         className="hover-link align-items-center me-2"
//                                                     >
//                                                         <InteractiveIcon
//                                                             defaultIcon={editIcon}
//                                                             hoverIcon={editIconHover}
//                                                             activeIcon=""
//                                                             isActive={false}
//                                                             alt="Edit"
//                                                             className="interactive-icon hover-image"
//                                                             renderAs="img"
//                                                             tooltip=""
//                                                         />
//                                                     </a>
//                                                 )}

//                                                 <a
//                                                     href="#"
//                                                     onClick={(e) => {
//                                                         e.preventDefault();
//                                                         handleDelete(item.id);
//                                                     }}
//                                                     className="hover-link d-flex align-items-center"
//                                                 >
//                                                     <InteractiveIcon
//                                                         defaultIcon={deleteIcon}
//                                                         hoverIcon={deleteIconHover}
//                                                         activeIcon=""
//                                                         isActive={false}
//                                                         alt="Delete"
//                                                         className="interactive-icon hover-image"
//                                                         renderAs="img"
//                                                         tooltip=""
//                                                     />
//                                                 </a>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default KeyboardShortCutList;


import { useEffect, useState } from 'react';
import InteractiveIcon from "@components/ui/InteractiveIcon";
import editIcon from '@images/edit2-icon.svg';
import editIconHover from '@images/edit2-icon-hover.svg';
import deleteIcon from '@images/trash-icon.svg';
import deleteIconHover from '@images/trash-icon-hover.svg';
import checkBoxIcon from '@images/checkbox-check-box-green.svg';
import { type ShortCutType } from "@context/SettingsContext";
import { updateShortcut } from '@services/settings/settingsService';
import { showSuccess } from '@components/ui/toast/toastNotification';

interface KeyboardShortCutListProps {
    shortcuts: ShortCutType[];
}

const KeyboardShortCutList = ({ shortcuts }: KeyboardShortCutListProps) => {
    const [shortcutList, setShortcutList] = useState<ShortCutType[]>(shortcuts);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [shortcutValue, setShortcutValue] = useState('');

    useEffect(() => {
        setShortcutList(shortcuts);
    }, [shortcuts]);

    const formatActionName = (name: string) =>
        name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

    const handleEdit = (id: string, value: string) => {
        setEditingId(id);
        setShortcutValue(value);
    };

    const handleSave = async (id: string) => {
        setShortcutList(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, defaultValue: shortcutValue }
                    : item
            )
        );

        console.log('save', id, shortcutValue);
        const response = await updateShortcut({ id, shortcut: shortcutValue });
        if (response.statusCode === 200) {
            showSuccess("Shortcut updated successfully");
        }
        setEditingId(null);
        setShortcutValue('');
    };

    const handleDelete = (id: string) => {
        console.log('delete', id);
    };

    return (
        shortcutList.length > 0 ? (
            <div className="setting-features pt-0 pb-0 pe-0">
                <div className="setting-signature-box">
                    <div className="signature-table-new key-table-new">
                        <table className="table" id="shortcutkeyTable">
                            <thead>
                                <tr>
                                    <th>
                                        <div className="setting-th-head">No.</div>
                                    </th>
                                    <th>
                                        <div className="setting-th-head">Action Name</div>
                                    </th>
                                    <th className="Default-size">
                                        <div className="setting-th-head">Default Shortcut</div>
                                    </th>
                                    <th className="text-end">
                                        <div className="setting-th-head">Action</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {shortcutList.map((item, index) => {
                                    const isEditing = editingId === item.id;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`blue-line-aft${isEditing ? ' active' : ''}`}
                                        >
                                            <td>{index + 1}</td>

                                            <td>{formatActionName(item.name)}</td>

                                            <td>
                                                <div
                                                    className="shortcut-key-change-box"
                                                    style={{
                                                        minWidth: '120px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            readOnly
                                                            className="shortcut-name-input"
                                                            value={shortcutValue}
                                                            style={{ display: 'inline-block' }}
                                                            placeholder="Press shortcut..."
                                                            onKeyDown={(e) => {
                                                                e.preventDefault();

                                                                const key = e.key.toLowerCase();

                                                                if (
                                                                    ['control', 'shift', 'alt', 'meta'].includes(key)
                                                                ) {
                                                                    return;
                                                                }

                                                                const keys: string[] = [];

                                                                if (e.ctrlKey) keys.push('ctrl');
                                                                if (e.shiftKey) keys.push('shift');
                                                                if (e.altKey) keys.push('alt');
                                                                if (e.metaKey) keys.push('meta');

                                                                keys.push(key);

                                                                setShortcutValue(keys.join('+'));
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="display-shortcut">
                                                            <span className="shortcut-name-text">
                                                                {item.defaultValue}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="d-flex align-items-center justify-content-end">
                                                    {isEditing ? (
                                                        <a
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleSave(item.id);
                                                            }}
                                                            className="hover-link align-items-center me-2"
                                                        >
                                                            <img
                                                                src={checkBoxIcon}
                                                                alt="Save"
                                                                className="interactive-icon hover-image"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleEdit(item.id, item.defaultValue);
                                                            }}
                                                            className="hover-link align-items-center me-2"
                                                        >
                                                            <InteractiveIcon
                                                                defaultIcon={editIcon}
                                                                hoverIcon={editIconHover}
                                                                activeIcon=""
                                                                isActive={false}
                                                                alt="Edit"
                                                                className="interactive-icon hover-image"
                                                                renderAs="img"
                                                                tooltip=""
                                                            />
                                                        </a>
                                                    )}

                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDelete(item.id);
                                                        }}
                                                        className="hover-link d-flex align-items-center"
                                                    >
                                                        <InteractiveIcon
                                                            defaultIcon={deleteIcon}
                                                            hoverIcon={deleteIconHover}
                                                            activeIcon=""
                                                            isActive={false}
                                                            alt="Delete"
                                                            className="interactive-icon hover-image"
                                                            renderAs="img"
                                                            tooltip=""
                                                        />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : (
            <div className="setting-signature-box p-0">
                <form className="filter-blocked-sec">
                    <div className="text-center p-3 fs-12-commom">
                        No Shortcuts Found.
                    </div>
                </form>
            </div>
        )
    )

};

export default KeyboardShortCutList;