import { ButtonView } from "ckeditor5";

// Base64 Upload Adapter Plugin
function createBase64UploadAdapter(loader: any) {
    return {
        upload: function () {
            return loader.file.then(function (file: File) {
                return new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        resolve({ default: reader.result });
                    };
                    reader.onerror = function (err) {
                        reject(err);
                    };
                    reader.readAsDataURL(file);
                });
            });
        },
        abort: function () {
            // Nothing to abort for Base64 uploads
        }
    };
}

function Base64UploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = function (loader: any) {
        return createBase64UploadAdapter(loader);
    };
}

// Custom Media Plugin
function appendMediaModal(editor: any) {
    const editorId = editor.sourceElement.id;
    const boxId = `media-box-${editorId}`;

    if (document.getElementById(boxId)) return;

    const ckRoot = editor.ui.view.element; // .ck-editor container

    const modalHTML = `
        <div class="media-link" id="${boxId}">
            <div class="media-content">
                <div class="form-group mb-4">
                    <label class="control-label">Insert Media URL</label>
                    <div class="input-icon-add custom-datepicker-month-selector-c2-vm">
                        <input type="text" id="input-${boxId}" class="form-control" placeholder="Enter link"/>
                        <img src="images/link-icon-16.svg" alt="" class="input-icon-1">                
                    </div>
                </div>

                <div class="d-flex align-items-center justify-content-between">
                    <button type="button" class="cancel-btn btn-new">
                        Cancel
                    </button>
                    <button type="button" class="confirm-btn btn-new-bg btn-new">
                        Insert
                    </button>
                </div>
            </div>
        </div>
    `;

    ckRoot.style.position = 'relative';
    ckRoot.insertAdjacentHTML('beforeend', modalHTML);
}

function MyCustomMediaPlugin(editor: any) {
    editor.ui.componentFactory.add('customMedia', (locale: any) => {
        const view = new ButtonView(locale);

        view.set({
            label: 'Insert Media',
            icon: `
                <svg viewBox="0 0 22 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.587 1.5c-.612 0-.601-.029-.601.551v14.84c0 .59-.01.559.591.559h18.846c.602 0 .591.03.591-.56V2.052c0-.58.01-.55-.591-.55H1.587Zm.701.971h1.003v1H2.288zm16.448 0h1.003v1h-1.003zm-14.24 1h13.008v12H4.467zm-2.208 1h1.003v1H2.288zm16.448 0h1.003v1h-1.003zm-16.448 2h1.003v1H2.288zm16.448 0h1.003v1h-1.003zm-16.448 2h1.003v1H2.288zm16.448 0h1.003v1h-1.003zm-16.448 2h1.003v1H2.288zm16.448 0h1.003v1h-1.003zm-16.448 2h1.003l-.029 1h-.974zm16.448 0h1.003v1h-1.003zm-16.448 2h.974v1h-.974zm16.448 0h1.003v1h-1.003z"></path>
                    <path d="M8.374 6.648a.4.4 0 0 1 .395-.4.4.4 0 0 1 .2.049l5.148 2.824a.4.4 0 0 1 0 .7l-5.148 2.824a.403.403 0 0 1-.595-.35z"></path>
                </svg>
            `,
            tooltip: true
        });

        view.on('execute', () => {
            appendMediaModal(editor);

            const editorId = editor.sourceElement.id;
            const boxId = `media-box-${editorId}`;
            const mediaBox = document.getElementById(boxId) as HTMLElement;
            const input = document.getElementById(`input-${boxId}`) as HTMLInputElement;
            const confirmBtn = mediaBox.querySelector('.confirm-btn') as HTMLButtonElement;
            const cancelBtn = mediaBox.querySelector('.cancel-btn') as HTMLButtonElement;

            input.value = '';
            mediaBox.style.display = 'block';
            input.focus();

            // One-time listeners
            const confirmHandler = () => {
                const url = input.value.trim();
                if (!url) return;

                editor.model.change((writer: any) => {
                    const mediaElement = writer.createElement('media', { url });
                    editor.model.insertContent(
                        mediaElement,
                        editor.model.document.selection
                    );
                });

                mediaBox.style.display = 'none';
                confirmBtn.removeEventListener('click', confirmHandler);
            };

            const cancelHandler = () => {
                mediaBox.style.display = 'none';
                cancelBtn.removeEventListener('click', cancelHandler);
            };

            confirmBtn.addEventListener('click', confirmHandler);
            cancelBtn.addEventListener('click', cancelHandler);
        });

        return view;
    });
}

const COPY_LINK_ICON =
    '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org"><path d="M7 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M17 3H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>';
const COPIED_LINK_ICON =
    '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.16669 11.6667L7.08335 14.5833L15.8334 5.41667" stroke="#0073B6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function copyTextToClipboard(text: string) {
    const writeWithFallback = () => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        document.execCommand('copy');
        document.body.removeChild(textarea);
    };

    if (navigator?.clipboard?.writeText) {
        return navigator.clipboard.writeText(text).catch(writeWithFallback);
    }

    writeWithFallback();
    return Promise.resolve();
}

// Enhanced Link Plugin
function EnhancedLinkPlugin(editor: any) {
    editor.ui.componentFactory.add('copyLink', (locale: any) => {
        const view = new ButtonView(locale);
        const linkCommand = editor.commands.get('link');
        // Keep last known URL — balloon button clicks can clear selection before execute runs
        let lastLinkUrl = '';
        let copiedResetTimer: ReturnType<typeof setTimeout> | null = null;

        const resetCopyButton = () => {
            view.set({
                icon: COPY_LINK_ICON,
                label: 'Copy Link',
                withText: false,
                tooltip: true,
            });
            view.element?.classList.remove('ck-copy-link-copied');
        };

        const showCopiedFeedback = () => {
            if (copiedResetTimer) {
                clearTimeout(copiedResetTimer);
            }

            view.set({
                icon: COPIED_LINK_ICON,
                label: 'Copied..',
                withText: true,
                tooltip: false,
            });
            view.element?.classList.add('ck-copy-link-copied');

            copiedResetTimer = setTimeout(() => {
                resetCopyButton();
                copiedResetTimer = null;
            }, 1000);
        };

        view.set({
            label: 'Copy Link',
            icon: COPY_LINK_ICON,
            tooltip: true,
            withText: false,
        });

        linkCommand.on('change:value', (_evt: any, _name: any, value: any) => {
            if (value) {
                lastLinkUrl = typeof value === 'string' ? value : String(value);
            } else if (copiedResetTimer) {
                // Balloon closed / left link — restore default copy state
                clearTimeout(copiedResetTimer);
                copiedResetTimer = null;
                resetCopyButton();
            }
        });

        if (linkCommand.value) {
            lastLinkUrl = typeof linkCommand.value === 'string'
                ? linkCommand.value
                : String(linkCommand.value);
        }

        view.bind('isEnabled').to(linkCommand, 'value', (value: any) => !!value);

        // Keep selection/focus in the editor so linkCommand.value is not cleared on click
        view.on('render', () => {
            view.element?.addEventListener('mousedown', (evt: Event) => {
                evt.preventDefault();
            });
        });

        view.on('execute', () => {
            const selectionUrl = editor.model.document.selection.getAttribute('linkHref');
            const previewEl = document.querySelector(
                '.ck-link-toolbar a.ck-button, .ck-link-actions a.ck-button, a.ck-link-actions__preview'
            ) as HTMLAnchorElement | null;
            const previewUrl =
                previewEl?.getAttribute('href') ||
                previewEl?.textContent?.trim() ||
                '';

            const url =
                (typeof linkCommand.value === 'string' ? linkCommand.value : '') ||
                selectionUrl ||
                lastLinkUrl ||
                previewUrl;

            if (!url) return;

            Promise.resolve(copyTextToClipboard(String(url))).then(showCopiedFeedback);
        });

        return view;
    });
}

export { Base64UploadAdapterPlugin, MyCustomMediaPlugin, EnhancedLinkPlugin };
