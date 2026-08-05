import React, { useState, useRef, useEffect, useMemo } from 'react';
import scrollUpIcon from '@images/scroll-up-icon.svg';
import scrollDownIcon from "@images/scroll-dwon-icon.svg";
import chevronRightIcon from "@images/chevron-right-icon.svg";
import chevronRightIconHover from "@images/chevron-right-icon-hover.svg";
import chevronDownIcon from "@images/chevron-down-icon.svg"
import chevronDownIconHover from "@images/chevron-down-icon-hover.svg";
import blackColorIcon from "@images/folder-dark-icon.svg";
import redColorIcon from "@images/folder-red-icon.svg";
import grayColorIcon from "@images/folder-gray-icon.svg";
import orangeColorIcon from "@images/folder-orange-icon.svg";
import pinkColorIcon from "@images/folder-pink-icon.svg";
import yellowColorIcon from "@images/folder-yellow-icon.svg";
import deepRoyalBlueColorIcon from "@images/folder-deep-royal-blue-icon.svg";
import greenLiteColorIcon from "@images/folder-green-lite-icon.svg";
import brightBlueColorIcon from "@images/folder-bright-blue-icon.svg";
import greenDarkColorIcon from "@images/folder-green-dark-icon.svg";
import InteractiveIcon from '@components/ui/InteractiveIcon';
import folderIcon from "@images/plus-icon.svg";
import folderIconHover from "@images/plus-icon-hover.svg";
import arrowSubFolderIcon from "@images/arrow-sub-folder-icon-16.svg";
import arrowSubFolderHoverIcon from "@images/arrow-sub-folder-hover-icon-16.svg"
import FolderActionsDropdown from '@components/ui/sidebar/FolderActionsDropdown';
import { useMailUI } from "@context/MailUIContext";
import { useCustomFolderScrollbar } from '@hooks/useCustomFolderScrollbar';

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  value: string;
  depth?: number;
}

interface CustomFolderSectionProps {
  folders: Folder[];
  activeBoxId?: string;
  onChangeBox?: (boxId: string) => void;
  onEditFolder?: (boxId: string) => void;
  onDeleteFolder?: (boxId: string, folderName: string) => void;
  onCreateFolder?: () => void;
}

export const CustomFolderSection: React.FC<CustomFolderSectionProps> = ({
  folders,
  activeBoxId,
  onChangeBox,
  onEditFolder,
  onDeleteFolder,
  onCreateFolder
}) => {
  const { isSidebarOpen } = useMailUI();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownResetKey] = useState(0);
  const dropdownRef = useRef<HTMLLIElement>(null);

  // Set of folder IDs that have been collapsed by the user (starts empty = all expanded)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const toggleCollapse = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) { next.delete(folderId); } else { next.add(folderId); }
      return next;
    });
  };

  // Which folders have at least one direct child (checked via DFS order: next item has greater depth)
  const foldersWithChildren = useMemo(() => {
    const set = new Set<string>();
    folders.forEach((folder, i) => {
      if (i + 1 < folders.length && (folders[i + 1].depth ?? 0) > (folder.depth ?? 0)) {
        set.add(folder.id);
      }
    });
    return set;
  }, [folders]);

  // Filter the list so descendants of collapsed parents are hidden
  const visibleFolders = useMemo(() => {
    const result: Folder[] = [];
    let lastCollapsedDepth = Infinity;
    for (const folder of folders) {
      const depth = folder.depth ?? 0;
      if (depth > lastCollapsedDepth) continue; // hidden under a collapsed ancestor
      lastCollapsedDepth = Infinity; // coming back to same/lower depth, reset
      result.push(folder);
      if (foldersWithChildren.has(folder.id) && collapsedFolders.has(folder.id)) {
        lastCollapsedDepth = depth; // hide everything deeper than this
      }
    }
    return result;
  }, [folders, collapsedFolders, foldersWithChildren]);
  const {
    scrollRef,
    fadeTopRef,
    fadeBottomRef,
    scrollbarRef,
    handleRef,
    scrollUp,
    scrollDown,
  } = useCustomFolderScrollbar();

  const getFolderIcon = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "#212121": blackColorIcon,
      "#EA3843": redColorIcon,
      "#808080": grayColorIcon,
      "#FF8A00": orangeColorIcon,
      "#FF5BA0": pinkColorIcon,
      "#FFB800": yellowColorIcon,
      "#263DB8": deepRoyalBlueColorIcon,
      "#49BA14": greenLiteColorIcon,
      "#00A3EF": brightBlueColorIcon,
      "#398415": greenDarkColorIcon
    };
    return colorMap[color] || 'folder-orange-icon.svg';
  };

  const handleFolderClick = (folder: Folder) => {
    if (onChangeBox) {
      onChangeBox(folder.value);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close dropdown if sidebar is open or if clicking outside the dropdown
      if (isSidebarOpen ||
        (dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !(event.target as HTMLElement).closest('.folder-actions-dropdown'))) {
        setOpenDropdownId(null);
      }
    };

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <div className="create-folder-sec" id="customFolderSection">
      <div className="sidebar-create-folder-box-main">
        <span
          className="add-folder-btn tooltips-ds"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onCreateFolder) {
              onCreateFolder();
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <InteractiveIcon
            defaultIcon={folderIcon}
            hoverIcon={folderIconHover}
            activeIcon=""
            isActive={false}
            alt=""
            className="interactive-icon hover-image"
            renderAs="img"
            tooltip={isSidebarOpen ? '' : 'Add Folder'}
          />
        </span>
        <a
          className="sidebar-create-folder-box tooltips-ds open-folder-box"
          onClick={(e) => {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }}
        >
          <div className="d-flex align-items-center">
            <span className={`create-folder-arrow ${isCollapsed ? 'collapsed' : ''}`}>
              {isCollapsed ?
                <InteractiveIcon
                  defaultIcon={chevronRightIcon}
                  hoverIcon={chevronRightIconHover}
                  activeIcon=""
                  isActive={false}
                  alt=""
                  className="interactive-icon hover-image"
                  renderAs="img"
                  tooltip=""
                /> :
                <InteractiveIcon
                  defaultIcon={chevronDownIcon}
                  hoverIcon={chevronDownIconHover}
                  activeIcon=""
                  isActive={false}
                  alt=""
                  className="interactive-icon hover-image"
                  renderAs="img"
                  tooltip=""
                />
              }
            </span>
            <span className="label-text ms-2">Folder</span>
          </div>
        </a>
      </div>

      <div className={`add-floder-single-box collapse ${!isCollapsed ? 'show' : ''}`} id="sidebarCreateFolderBox">
        <div>
          <button
            className={`create-folder-scroll-btn btn create-folder-scroll-up ${isSidebarOpen ? 'd-none' : ''}`}
            aria-label="Scroll Up"
            onClick={scrollUp}
          >
            <img src={scrollUpIcon} alt="" />
          </button>

          <div className="nav-custom-scroll-wrapper" ref={scrollWrapperRef}>
            <ul
              className="left-side-manu-link-list create-new-folder-sec nav-custom-scroll-content"
              id="sidebarCustomMenu"
              ref={scrollRef}
            >
              <div className="nav-custom-scroll-fade-top" ref={fadeTopRef} />

              {visibleFolders.map((folder) => {
                const isActive = activeBoxId === folder.id;
                const depth = folder.depth ?? 0;
                const isChild = depth > 0;
                const hasChildren = foldersWithChildren.has(folder.id);
                const isCollapsedFolder = collapsedFolders.has(folder.id);
                return (
                  <li
                    key={folder.id}
                    className="m-item"
                    id={`${folder.name}`}
                    onClick={() => handleFolderClick(folder)}
                    ref={openDropdownId === folder.id ? dropdownRef : null}
                    style={isSidebarOpen ? { paddingLeft: `${depth * 22}px` } : undefined}
                  >
                    <div className={`m-link ${!isSidebarOpen && openDropdownId === folder.id ? 'sub-open-hover-active' : ''} ${isActive ? 'active' : ''}`}>

                      {/* Expand/collapse toggle for parent folders (expanded sidebar only) */}
                      {isSidebarOpen && hasChildren && (
                        <span
                          onClick={(e) => toggleCollapse(folder.id, e)}
                          style={{ cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', marginRight: '2px' }}
                        >
                          <InteractiveIcon
                            defaultIcon={isCollapsedFolder ? chevronRightIcon : chevronDownIcon}
                            hoverIcon={isCollapsedFolder ? chevronRightIconHover : chevronDownIconHover}
                            activeIcon=""
                            isActive={false}
                            alt={isCollapsedFolder ? 'Expand' : 'Collapse'}
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip=""
                          />
                        </span>
                      )}

                      {/* Leaf-child connector (expanded sidebar only, no children) */}
                      {/* {isSidebarOpen && isChild && !hasChildren && (
                        <span className='create-new-sab-folder-icon'>
                          <InteractiveIcon
                            defaultIcon={arrowSubFolderHoverIcon}
                            hoverIcon={arrowSubFolderHoverIcon}
                            activeIcon=""
                            isActive={false}
                            alt="sub-folder"
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip=""                            
                          />
                        </span>
                      )} */}

                      <img className="hover-image" src={getFolderIcon(folder.color)} />
                      <span className="active-line-t"
                        style={{ '--active-line-bg': folder.color || 'rgba(0, 151, 239, 1)' } as React.CSSProperties}
                      />
                      <div className="nav-link-before-collapse-single-box-100">
                        <div className="nav-link-before-collapse">
                          <span id="boxName">{folder.name}</span>
                          <FolderActionsDropdown
                            key={`${folder.id} - ${dropdownResetKey}}`}
                            isOpen={openDropdownId === folder.id}
                            onToggle={(nextOpen) => setOpenDropdownId(nextOpen ? folder.id : null)}
                            onEdit={() => { setOpenDropdownId(null); onEditFolder?.(folder.value); }}
                            onDelete={() => { setOpenDropdownId(null); onDeleteFolder?.(folder.value, folder.name); }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}

              <div className="nav-custom-scroll-fade-bottom" ref={fadeBottomRef} />
            </ul>

            <div className="nav-custom-scroll-scrollbar" ref={scrollbarRef}>
              <div className="nav-custom-scroll-handle" ref={handleRef} />
            </div>
          </div>

          <button
            className={`create-folder-scroll-btn btn create-folder-scroll-down ${isSidebarOpen ? 'd-none' : ''}`}
            aria-label="Scroll Down"
            onClick={scrollDown}
          >
            <img src={scrollDownIcon} alt="" />
          </button>
        </div>
      </div>
    </div>
  );
};
