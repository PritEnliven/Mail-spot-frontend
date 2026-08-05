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
    TableProperties,
    TableCellProperties,
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
    // MediaEmbed,
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
    extraPlugins: [Base64UploadAdapterPlugin, EnhancedLinkPlugin],

    plugins: [
        Essentials, Paragraph, Autoformat, AutoLink, Autosave,
        Bold, Italic, Underline, Strikethrough, Code, CodeBlock,
        FontColor, FontBackgroundColor, FontFamily, FontSize,
        Heading, Highlight, HorizontalLine,
        Alignment, List,
        Link,LinkUI, LinkEditing, ContextualBalloon,
        ImageBlock, ImageEditing, ImageInline, ImageToolbar, ImageResize, ImageUpload, ImageUtils,
        // MediaEmbed,
        Indent, IndentBlock,
        Table, TableToolbar, TableColumnResize, PlainTableOutput, TableProperties, TableCellProperties,
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
            name: /^(table|thead|tbody|tr|td|th|img|a|span|div|p|br|strong|em)$/,
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
        tableProperties: {
            defaultProperties: {
                borderStyle: 'solid',
                borderColor: '#BBC0C4',
                borderWidth: '1px',
            },
        },
        tableCellProperties: {
            defaultProperties: {
                borderStyle: 'solid',
                borderColor: '#BBC0C4',
                borderWidth: '1px',
                padding: '4px',
            },
        },
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
