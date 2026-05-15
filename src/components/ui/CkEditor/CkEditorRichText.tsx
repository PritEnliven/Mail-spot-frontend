import { CKEditor } from '@ckeditor/ckeditor5-react';
import { ClassicEditor } from 'ckeditor5';
import ckEditorConfig from '../../../config/ckeditor.config';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import smartMessage from "@images/smart-message-icon-16.svg";
import GenerateEmailCard from '@components/ui/CkEditor/GenerateEmailCard';
import SmartRepliesCard from '@components/ui/CkEditor/SmartRepliesCard';
import { createRoot, type Root } from 'react-dom/client';

interface CkEditorRichTextProps {
  id: string;
  value?: string;
  onChange?: (data: string) => void;
  isGenerateEmailOpen?: boolean | false
  isSmartReplyEnable?: boolean | false
  onGenerateEmailClose?: () => void;
  emailContent?: string; // For smart replies
}

function setupCustomFontColorMarker(editor: any) {
  const fontColorCommand = editor.commands.get('fontColor');
  const defaultColor = '#212121';

  if (!fontColorCommand || !editor.ui?.element) {
    console.warn('Font color command or editor element not found, skipping custom marker setup.');
    return;
  }

  const updateCssVariable = (color?: string) => {
    editor.ui.element.style.setProperty('--ck-color-font-color-marker', color || defaultColor);
  };

  updateCssVariable(fontColorCommand.value);

  const handler = (_evt: any, _name: any, value: string) => {
    updateCssVariable(value);
  };

  fontColorCommand.on('change:value', handler);

  return () => {
    fontColorCommand.off('change:value', handler);
  };
}

// ────────────────────────────────────────────────
// Main React Component
function CkEditorRichText({ id, value = '', onChange, isGenerateEmailOpen, isSmartReplyEnable, onGenerateEmailClose, emailContent }: CkEditorRichTextProps) {
  const editorConfig = useMemo(() => ckEditorConfig, []);
  const aiRootRef = useRef<Root | null>(null);
  const smartRepliesRootRef = useRef<Root | null>(null);
  const editorRef = useRef<any>(null);
  const aiContainerRef = useRef<HTMLDivElement | null>(null);
  const smartRepliesContainerRef = useRef<HTMLDivElement | null>(null);

  const onCloseGenerateEmailHandler = () => {
    onGenerateEmailClose?.();
  }

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const container = aiContainerRef.current;

    if (!container) return;

    if (isGenerateEmailOpen) {
      // Mount only if not mounted
      if (!aiRootRef.current) {
        aiRootRef.current = createRoot(container);
      }

      // focus on input
      const input = container.querySelector('input');
      if (input) {
        input.focus();
      }

      aiRootRef.current.render(<GenerateEmailCard editor={editor} onClose={onCloseGenerateEmailHandler} />);
    } else {
      // Unmount cleanly
      aiRootRef.current?.unmount();
      aiRootRef.current = null;
    }

  }, [isGenerateEmailOpen, id, aiContainerRef]);

  // Effect to handle smart replies
  useEffect(() => {
    if (!editorRef.current || !isSmartReplyEnable || !smartRepliesContainerRef.current) return;

    const editor = editorRef.current;
    const container = smartRepliesContainerRef.current;

    if (!container) return;

    // Mount smart replies
    if (!smartRepliesRootRef.current) {
      smartRepliesRootRef.current = createRoot(container);
    }

    smartRepliesRootRef.current.render(<SmartRepliesCard editor={editor} emailContent={emailContent} onClose={() => {
      // Hide smart replies after selection
      smartRepliesRootRef.current?.unmount();
      smartRepliesRootRef.current = null;
    }} />);

  }, [isSmartReplyEnable, emailContent, id, smartRepliesContainerRef, editorRef, smartRepliesContainerRef.current]);

  const removeCKColorTooltips = useCallback(() => {
    document.querySelectorAll(`
      .ck-color-grid__tile,
      .ck-color-selector__remove-color,
      .ck-color-selector__color-picker
    `).forEach((el) => {
      el.removeAttribute('title');
      el.removeAttribute('data-cke-tooltip-text');
    });

    document.querySelectorAll('.ck-tooltip').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(removeCKColorTooltips);
    observer.observe(document.body, { childList: true, subtree: true });
    removeCKColorTooltips();

    return () => observer.disconnect();
  }, [removeCKColorTooltips]);

  // Effect to handle generate panel visibility
  useEffect(() => {
    const generatePanel = aiContainerRef.current;
    if (generatePanel) {
      generatePanel.style.display = isGenerateEmailOpen ? 'block' : 'none';
    }
  }, [isGenerateEmailOpen, aiContainerRef]);

  const initLinkFormObserver = useCallback(() => {
    const observer = new MutationObserver(() => {
      const linkForm = document.querySelector('.ck-link-form');
      if (!linkForm) return;

      const wrappers = linkForm.querySelectorAll('.ck-labeled-field-view__input-wrapper');
      if (!wrappers.length) return;

      const lastWrapper = wrappers[wrappers.length - 1];
      if (!lastWrapper.classList.contains('icon-input-add')) {
        lastWrapper.classList.add('icon-input-add');
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <CKEditor
      id={id}
      editor={ClassicEditor}
      config={editorConfig}
      data={value}
      onChange={(_event: any, editor: any) => {
        const data = editor.getData();
        onChange?.(data);
      }}
      onReady={(editor: any) => {
        editorRef.current = editor;

        const editorContainer = editor.ui.view.editable.element.parentElement;

        const aiContainer = document.createElement('div');
        aiContainer.id = `generate-panel-${id}`;
        aiContainer.className = 'generate-panel-wrapper';
        aiContainer.setAttribute('data-editor-id', id); // Additional identifier for debugging
        
        // Store reference to container
        aiContainerRef.current = aiContainer;

        // Create smart replies container
        const smartRepliesContainer = document.createElement('div');
        smartRepliesContainer.id = `smart-replies-${id}`;
        smartRepliesContainer.className = 'smart-replies-wrapper';
        smartRepliesContainer.setAttribute('data-editor-id', id);
        
        // Store reference to smart replies container
        smartRepliesContainerRef.current = smartRepliesContainer;

        // Insert containers above editable area
        editorContainer?.insertBefore(
          aiContainer,
          editor.ui.view.editable.element
        );
        
        editorContainer?.insertBefore(
          smartRepliesContainer,
          editor.ui.view.editable.element
        );

        // Your existing HTML support configuration
        const htmlSupport = editor.plugins.get('GeneralHtmlSupport');
        if (htmlSupport?.dataFilter) {
          htmlSupport.dataFilter.disallowElement('figure');

          htmlSupport.dataFilter.disallowAttributes({
            name: /^.*$/,
            classes: []
          });

          htmlSupport.dataFilter.disallowAttributes({
            name: /^.*$/,
            attributes: ['contenteditable', 'tabindex', 'valign']
          });

          // Allow email-friendly elements
          ['table', 'tbody', 'tr', 'td', 'img', 'a', 'span', 'div'].forEach(tag => {
            htmlSupport.dataFilter.allowElement(tag);
          });

          htmlSupport.dataFilter.allowAttributes({
            name: /^.*$/,
            attributes: ['width', 'height', 'border', 'cellpadding', 'cellspacing', 'bgcolor', 'align', 'valign', 'style', 'class', 'href', 'target', 'src', 'alt']
          });
        }

        // Other initializations
        const cleanupLinkObserver = initLinkFormObserver();
        const cleanupFontColor = setupCustomFontColorMarker(editor);

        removeCKColorTooltips();

        // Optional: cleanup on editor destroy
        editor.on('destroy', () => {
          cleanupLinkObserver?.();
          cleanupFontColor?.();
        });
      }}
    />
  );
}

export default CkEditorRichText;