import {
    Essentials,
    Paragraph,
    Bold,
    Italic,
    Heading,
    FontColor,
    SourceEditing,
    FontSize,
    Underline,
    Table,
    TableToolbar,
    Link,
     LinkUI,
    LinkEditing,
    ContextualBalloon,
    Alignment,
    List,
    Strikethrough,
    Code,
    HorizontalLine,
    GeneralHtmlSupport,
    Autoformat,
    AutoLink,
    Autosave,
    CodeBlock,
    FontBackgroundColor,
    FontFamily,
    ImageBlock,
    ImageEditing,
    ImageInline,
    ImageToolbar,
    ImageResize,
    ImageUpload,
    ImageUtils,
    MediaEmbed,
    PasteFromMarkdownExperimental,
    PasteFromOffice,
    PlainTableOutput,
    TableColumnResize,
    ShowBlocks,
    Indent,
    IndentBlock,
    Highlight,
    ButtonView
} from 'ckeditor5';
import linkIcon from "@images/link-icon-16.svg";
import { config } from "./config"

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
                        <img src="${linkIcon}" alt="" class="input-icon-1">                
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

// Enhanced Link Plugin
function EnhancedLinkPlugin(editor: any) {
    editor.ui.componentFactory.add('copyLink', (locale: any) => {
        const view = new ButtonView(locale);
        const linkCommand = editor.commands.get('link');

        view.set({
            label: 'Copy Link',
            icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org"><path d="M7 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M17 3H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>',
            tooltip: true
        });

        view.bind('isEnabled').to(linkCommand, 'value', (value: any) => !!value);
        view.on('execute', () => {
            const url = linkCommand.value;
            if (url) navigator.clipboard.writeText(url);
        });

        return view;
    });
}

const ckEditorConfig: any = {
    licenseKey: config.CKEDITOR_LICENSE_KEY,
    fontColor: {
        colors: [
            { color: '#212121', label: ' ' },
            { color: '#EA3843', label: ' ' },
            { color: '#808080', label: ' ' },
            { color: '#FF8A00', label: ' ' },
            { color: '#FF5BA0', label: ' ' },
            { color: '#FFB800', label: ' ' },
            { color: '#263DB8', label: ' ' },
            { color: '#49BA14', label: ' ' },
            { color: '#00A3EF', label: ' ' },
            { color: '#398415', label: ' ' },
        ],
        documentColors: 0
    },
    toolbar: {
        items: [
            'fontColor', 'heading', 'SourceEditing', 'fontSize', 'bold', 'italic', 'underline', 'insertTable', 'customMedia', 'link', 'alignment', 'bulletedList', 'numberedList', 'undo', 'redo', 'strikethrough', 'code', 'horizontalLine',
            {
                label: 'More options',
                icon: 'text',
                items: []
            },
        ],
        shouldNotGroupWhenFull: false,
        removePlugins: ['ToolbarItemsTexts']
    },
    extraPlugins: [Base64UploadAdapterPlugin, MyCustomMediaPlugin, EnhancedLinkPlugin],
    plugins: [
        Essentials, Paragraph, Autoformat, AutoLink, Autosave,
        Bold, Italic, Underline, Strikethrough, Code, CodeBlock,
        FontColor, FontBackgroundColor, FontFamily, FontSize,
        Heading, Highlight, HorizontalLine,
        Alignment, List,
        Link,LinkUI, LinkEditing, ContextualBalloon,
        ImageBlock, ImageEditing, ImageInline, ImageToolbar, ImageResize, ImageUpload, ImageUtils,
        MediaEmbed,
        Indent, IndentBlock,
        Table, TableToolbar, TableColumnResize, PlainTableOutput,
        PasteFromMarkdownExperimental, PasteFromOffice,
        ShowBlocks, SourceEditing,
        GeneralHtmlSupport,
        EnhancedLinkPlugin
    ],
    language: 'en',
    fontFamily: {
        options: [
            'DM Sans, sans-serif',
        ] as any
    },
    fontSize: {
        options: [10, 12, 14, 'default', 18, 20, 22],
        supportAllValues: true
    },
    fullscreen: {
        onEnterCallback: (container: any) => {
            container.classList.add('editor-container', 'editor-container_classic-editor', 'editor-container_include-fullscreen', 'main-container');
        }
    },
    heading: {
        options: [{
            model: 'paragraph',
            title: 'Paragraph',
            class: 'ck-heading_paragraph'
        },
        {
            model: 'heading1',
            view: 'h1',
            title: 'Heading 1',
            class: 'ck-heading_heading1'
        },
        {
            model: 'heading2',
            view: 'h2',
            title: 'Heading 2',
            class: 'ck-heading_heading2'
        },
        {
            model: 'heading3',
            view: 'h3',
            title: 'Heading 3',
            class: 'ck-heading_heading3'
        },
        {
            model: 'heading4',
            view: 'h4',
            title: 'Heading 4',
            class: 'ck-heading_heading4'
        },
        {
            model: 'heading5',
            view: 'h5',
            title: 'Heading 5',
            class: 'ck-heading_heading5'
        },
        {
            model: 'heading6',
            view: 'h6',
            title: 'Heading 6',
            class: 'ck-heading_heading6'
        }
        ] as any
    },
    htmlSupport: {
        allow: [{
            name: /^(table|tbody|tr|td|img|a|span|div|p|br|strong|em)$/,
            attributes: true,
            classes: true,
            styles: true
        }] as any
    },
    image: {
        toolbar: [
            'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|',
            'toggleImageCaption', 'imageTextAlternative', '|',
            'resizeImage:25', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original'
        ]
    },
    placeholder: 'Type or paste your content here!',
    table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties', 'tableC'],
        showHiddenBorders: false
    },
    link: {
        toolbar: ['linkPreview', '|', 'editLink', 'copyLink', 'unlink'],
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
        decorators: {
            // Empty to remove downloadable option  
        }
    },
    ui: {
        Dialog: {
            Position: 'editor-center'
        }
    }
}

export default ckEditorConfig;
