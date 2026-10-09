// import {
//     Essentials,
//     Paragraph,
//     Bold,
//     Italic,
//     Heading,
//     FontColor,
//     SourceEditing,
//     FontSize,
//     Underline,
//     Table,
//     TableProperties,
//     TableCellProperties,
//     TableToolbar,
//     Link,
//      LinkUI,
//     LinkEditing,
//     ContextualBalloon,
//     Alignment,
//     List,
//     Strikethrough,
//     Code,
//     HorizontalLine,
//     GeneralHtmlSupport,
//     Autoformat,
//     AutoLink,
//     Autosave,
//     CodeBlock,
//     FontBackgroundColor,
//     FontFamily,
//     ImageBlock,
//     ImageEditing,
//     ImageInline,
//     ImageStyle,
//     ImageToolbar,
//     ImageResize,
//     ImageUpload,
//     ImageUtils,
//     // MediaEmbed,
//     PasteFromMarkdownExperimental,
//     PasteFromOffice,
//     PlainTableOutput,
//     TableColumnResize,
//     ShowBlocks,
//     Indent,
//     IndentBlock,
//     Highlight,
//     ButtonView
// } from 'ckeditor5';
// import { config } from "./config"

// /**
//  * Clipboard screenshots usually arrive as a File with a generic browser name
//  * (e.g. "image.png"). Real inserts/pastes of files keep the original name
//  * (e.g. "Vacation.jpg"), which the backend needs via data-filename.
//  */
// function getOriginalImageFilename(file: File | undefined): string | undefined {
//     const name = file?.name?.trim();
//     if (!name) return undefined;
//     if (/^image\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name)) return undefined;
//     return name;
// }

// // Base64 Upload Adapter Plugin
// function createBase64UploadAdapter(loader: any) {
//     return {
//         upload: function () {
//             return loader.file.then(function (file: File) {
//                 return new Promise(function (resolve, reject) {
//                     var reader = new FileReader();
//                     reader.onload = function () {
//                         const response: Record<string, unknown> = { default: reader.result };
//                         const filename = getOriginalImageFilename(file);
//                         if (filename) {
//                             response.filename = filename;
//                         }
//                         resolve(response);
//                     };
//                     reader.onerror = function (err) {
//                         reject(err);
//                     };
//                     reader.readAsDataURL(file);
//                 });
//             });
//         },
//         abort: function () {
//             // Nothing to abort for Base64 uploads
//         }
//     };
// }

// function Base64UploadAdapterPlugin(editor: any) {
//     editor.plugins.get('FileRepository').createUploadAdapter = function (loader: any) {
//         return createBase64UploadAdapter(loader);
//     };
// }

// /**
//  * Keeps original file names on inserted/pasted images as data-filename so the
//  * backend can recover names like Vacation.jpg from compose HTML (base64 alone
//  * has no filename; nameless clipboard screenshots are left without the attr).
//  */
// function ImageFilenamePlugin(editor: any) {
//     const IMAGE_TYPES = ['imageInline', 'imageBlock'] as const;

//     for (const imageType of IMAGE_TYPES) {
//         if (editor.model.schema.isRegistered(imageType)) {
//             editor.model.schema.extend(imageType, {
//                 allowAttributes: ['dataFilename'],
//             });
//         }
//     }

//     editor.conversion.for('upcast').attributeToAttribute({
//         view: {
//             name: 'img',
//             key: 'data-filename',
//         },
//         model: 'dataFilename',
//     });

//     editor.conversion.for('downcast').add((dispatcher: any) => {
//         for (const imageType of IMAGE_TYPES) {
//             dispatcher.on(
//                 `attribute:dataFilename:${imageType}`,
//                 (evt: any, data: any, conversionApi: any) => {
//                     if (!conversionApi.consumable.consume(data.item, evt.name)) {
//                         return;
//                     }

//                     const viewElement = conversionApi.mapper.toViewElement(data.item);
//                     if (!viewElement) return;

//                     const imageUtils = editor.plugins.get('ImageUtils');
//                     const img = imageUtils?.findViewImgElement(viewElement);
//                     if (!img) return;

//                     if (data.attributeNewValue != null && data.attributeNewValue !== '') {
//                         conversionApi.writer.setAttribute(
//                             'data-filename',
//                             data.attributeNewValue,
//                             img
//                         );
//                     } else {
//                         conversionApi.writer.removeAttribute('data-filename', img);
//                     }
//                 }
//             );
//         }
//     });

//     const imageUploadEditing = editor.plugins.get('ImageUploadEditing');
//     if (!imageUploadEditing) return;

//     imageUploadEditing.on('uploadComplete', (_evt: any, { data, imageElement }: any) => {
//         const filename = typeof data?.filename === 'string' ? data.filename.trim() : '';
//         if (!filename) return;

//         editor.model.change((writer: any) => {
//             writer.setAttribute('dataFilename', filename, imageElement);
//         });
//     });
// }

// const COPY_LINK_ICON =
//     '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org"><path d="M7 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M17 3H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>';
// const COPIED_LINK_ICON =
//     '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.16669 11.6667L7.08335 14.5833L15.8334 5.41667" stroke="#0073B6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// function copyTextToClipboard(text: string) {
//     const writeWithFallback = () => {
//         const textarea = document.createElement('textarea');
//         textarea.value = text;
//         textarea.setAttribute('readonly', '');
//         textarea.style.position = 'fixed';
//         textarea.style.left = '-9999px';
//         textarea.style.top = '0';
//         textarea.style.opacity = '0';
//         document.body.appendChild(textarea);
//         textarea.focus();
//         textarea.select();
//         textarea.setSelectionRange(0, textarea.value.length);
//         document.execCommand('copy');
//         document.body.removeChild(textarea);
//     };

//     if (navigator?.clipboard?.writeText) {
//         return navigator.clipboard.writeText(text).catch(writeWithFallback);
//     }

//     writeWithFallback();
//     return Promise.resolve();
// }

// // Enhanced Link Plugin
// function EnhancedLinkPlugin(editor: any) {
//     editor.ui.componentFactory.add('copyLink', (locale: any) => {
//         const view = new ButtonView(locale);
//         const linkCommand = editor.commands.get('link');
//         // Keep last known URL — balloon button clicks can clear selection before execute runs
//         let lastLinkUrl = '';
//         let copiedResetTimer: ReturnType<typeof setTimeout> | null = null;

//         const resetCopyButton = () => {
//             view.set({
//                 icon: COPY_LINK_ICON,
//                 label: 'Copy Link',
//                 withText: false,
//                 tooltip: true,
//             });
//             view.element?.classList.remove('ck-copy-link-copied');
//         };

//         const showCopiedFeedback = () => {
//             if (copiedResetTimer) {
//                 clearTimeout(copiedResetTimer);
//             }

//             view.set({
//                 icon: COPIED_LINK_ICON,
//                 label: 'Copied..',
//                 withText: true,
//                 tooltip: false,
//             });
//             view.element?.classList.add('ck-copy-link-copied');

//             copiedResetTimer = setTimeout(() => {
//                 resetCopyButton();
//                 copiedResetTimer = null;
//             }, 1000);
//         };

//         view.set({
//             label: 'Copy Link',
//             icon: COPY_LINK_ICON,
//             tooltip: true,
//             withText: false,
//         });

//         linkCommand.on('change:value', (_evt: any, _name: any, value: any) => {
//             if (value) {
//                 lastLinkUrl = typeof value === 'string' ? value : String(value);
//             } else if (copiedResetTimer) {
//                 // Balloon closed / left link — restore default copy state
//                 clearTimeout(copiedResetTimer);
//                 copiedResetTimer = null;
//                 resetCopyButton();
//             }
//         });

//         if (linkCommand.value) {
//             lastLinkUrl = typeof linkCommand.value === 'string'
//                 ? linkCommand.value
//                 : String(linkCommand.value);
//         }

//         view.bind('isEnabled').to(linkCommand, 'value', (value: any) => !!value);

//         // Keep selection/focus in the editor so linkCommand.value is not cleared on click
//         view.on('render', () => {
//             view.element?.addEventListener('mousedown', (evt: Event) => {
//                 evt.preventDefault();
//             });
//         });

//         view.on('execute', () => {
//             const selectionUrl = editor.model.document.selection.getAttribute('linkHref');
//             const previewEl = document.querySelector(
//                 '.ck-link-toolbar a.ck-button, .ck-link-actions a.ck-button, a.ck-link-actions__preview'
//             ) as HTMLAnchorElement | null;
//             const previewUrl =
//                 previewEl?.getAttribute('href') ||
//                 previewEl?.textContent?.trim() ||
//                 '';

//             const url =
//                 (typeof linkCommand.value === 'string' ? linkCommand.value : '') ||
//                 selectionUrl ||
//                 lastLinkUrl ||
//                 previewUrl;

//             if (!url) return;

//             Promise.resolve(copyTextToClipboard(String(url))).then(showCopiedFeedback);
//         });

//         return view;
//     });
// }

// // Gmail-like image size / remove options shown when an image is clicked
// function GmailImageOptionsPlugin(editor: any) {
//     const sizeOptions: Array<{ name: string; label: string; width: string | null }> = [
//         { name: 'imageSizeSmall', label: 'Small', width: '25%' },
//         { name: 'imageSizeBestFit', label: 'Best fit', width: '100%' },
//         { name: 'imageSizeOriginal', label: 'Original size', width: null },
//     ];

//     for (const option of sizeOptions) {
//         editor.ui.componentFactory.add(option.name, (locale: any) => {
//             const view = new ButtonView(locale);
//             const resizeCommand = editor.commands.get('resizeImage');

//             view.set({
//                 label: option.label,
//                 withText: true,
//                 tooltip: false,
//                 isToggleable: true,
//                 class: 'ck-gmail-image-option',
//             });

//             if (resizeCommand) {
//                 view.bind('isEnabled').to(resizeCommand, 'isEnabled');
//                 view.bind('isOn').to(resizeCommand, 'value', (value: any) => {
//                     const currentWidth = value?.width ?? null;
//                     return currentWidth === option.width;
//                 });
//             }

//             view.on('execute', () => {
//                 editor.execute('resizeImage', { width: option.width });
//                 editor.editing.view.focus();
//             });

//             return view;
//         });
//     }

//     editor.ui.componentFactory.add('imageRemove', (locale: any) => {
//         const view = new ButtonView(locale);
//         const resizeCommand = editor.commands.get('resizeImage');
//         const imageUtils = editor.plugins.get('ImageUtils');

//         view.set({
//             label: 'Remove',
//             withText: true,
//             tooltip: false,
//             class: 'ck-gmail-image-option ck-gmail-image-remove',
//         });

//         if (resizeCommand) {
//             view.bind('isEnabled').to(resizeCommand, 'isEnabled');
//         }

//         view.on('execute', () => {
//             const imageElement = imageUtils?.getClosestSelectedImageElement(
//                 editor.model.document.selection
//             );
//             if (!imageElement) return;

//             editor.model.change((writer: any) => {
//                 writer.remove(imageElement);
//             });
//             editor.editing.view.focus();
//         });

//         return view;
//     });
// }

// const ckEditorConfig: any = {
//     licenseKey: config.CKEDITOR_LICENSE_KEY,
//     fontColor: {
//         colors: [
//             { color: '#212121', label: ' ' },
//             { color: '#EA3843', label: ' ' },
//             { color: '#808080', label: ' ' },
//             { color: '#FF8A00', label: ' ' },
//             { color: '#FF5BA0', label: ' ' },
//             { color: '#FFB800', label: ' ' },
//             { color: '#263DB8', label: ' ' },
//             { color: '#49BA14', label: ' ' },
//             { color: '#00A3EF', label: ' ' },
//             { color: '#398415', label: ' ' },
//         ],
//         documentColors: 0
//     },
//     toolbar: {
//         items: [
//             'fontFamily', 'fontSize', 'fontColor', 'heading', 'SourceEditing', 'bold', 'italic', 'underline', 'insertTable', 'customMedia', 'link', 'alignment', 'bulletedList', 'numberedList', 'undo', 'redo', 'strikethrough', 'code', 'horizontalLine',
//             {
//                 label: 'More options',
//                 icon: 'text',
//                 items: []
//             },
//         ],
//         shouldNotGroupWhenFull: false,
//         removePlugins: ['ToolbarItemsTexts']
//     },
//     extraPlugins: [Base64UploadAdapterPlugin, ImageFilenamePlugin, EnhancedLinkPlugin, GmailImageOptionsPlugin],

//     plugins: [
//         Essentials, Paragraph, Autoformat, AutoLink, Autosave,
//         Bold, Italic, Underline, Strikethrough, Code, CodeBlock,
//         FontColor, FontBackgroundColor, FontFamily, FontSize,
//         Heading, Highlight, HorizontalLine,
//         Alignment, List,
//         Link,LinkUI, LinkEditing, ContextualBalloon,
//         ImageBlock, ImageEditing, ImageInline, ImageStyle, ImageToolbar, ImageResize, ImageUpload, ImageUtils,
//         // MediaEmbed,
//         Indent, IndentBlock,
//         Table, TableToolbar, TableColumnResize, PlainTableOutput, TableProperties, TableCellProperties,
//         PasteFromMarkdownExperimental, PasteFromOffice,
//         ShowBlocks, SourceEditing,
//         GeneralHtmlSupport,
//         EnhancedLinkPlugin,
//         GmailImageOptionsPlugin
//     ],
//     language: 'en',
//     fontFamily: {
//         options: [
//             'default',
//             { title: 'Sans Serif', model: 'Arial, Helvetica, sans-serif' },
//             { title: 'Serif', model: 'Times New Roman, Times, serif' },
//             { title: 'Fixed Width', model: 'Courier New, Courier, monospace' },
//             { title: 'Wide', model: 'Arial Black, Gadget, sans-serif' },
//             { title: 'Narrow', model: 'Arial Narrow, Arial, sans-serif' },
//             { title: 'Comic Sans MS', model: 'Comic Sans MS, cursive' },
//             { title: 'Garamond', model: 'Garamond, serif' },
//             { title: 'Georgia', model: 'Georgia, serif' },
//             { title: 'Tahoma', model: 'Tahoma, Geneva, sans-serif' },
//             { title: 'Trebuchet MS', model: 'Trebuchet MS, Helvetica, sans-serif' },
//             { title: 'Verdana', model: 'Verdana, Geneva, sans-serif' },
//             { title: 'DM Sans', model: 'DM Sans, sans-serif' },
//         ],
//         supportAllValues: true,
//     },
//     fontSize: {
//         options: [10, 12, 14, 'default', 18, 20, 22],
//         supportAllValues: true
//     },
//     fullscreen: {
//         onEnterCallback: (container: any) => {
//             container.classList.add('editor-container', 'editor-container_classic-editor', 'editor-container_include-fullscreen', 'main-container');
//         }
//     },
//     heading: {
//         options: [{
//             model: 'paragraph',
//             title: 'Paragraph',
//             class: 'ck-heading_paragraph'
//         },
//         {
//             model: 'heading1',
//             view: 'h1',
//             title: 'Heading 1',
//             class: 'ck-heading_heading1'
//         },
//         {
//             model: 'heading2',
//             view: 'h2',
//             title: 'Heading 2',
//             class: 'ck-heading_heading2'
//         },
//         {
//             model: 'heading3',
//             view: 'h3',
//             title: 'Heading 3',
//             class: 'ck-heading_heading3'
//         },
//         {
//             model: 'heading4',
//             view: 'h4',
//             title: 'Heading 4',
//             class: 'ck-heading_heading4'
//         },
//         {
//             model: 'heading5',
//             view: 'h5',
//             title: 'Heading 5',
//             class: 'ck-heading_heading5'
//         },
//         {
//             model: 'heading6',
//             view: 'h6',
//             title: 'Heading 6',
//             class: 'ck-heading_heading6'
//         }
//         ] as any
//     },
//     htmlSupport: {
//         // Broad allow-list so pasted HTML email templates aren't unwrapped
//         // before GHS's runtime dataFilter (see onReady in CkEditorRichText)
//         // ever gets a chance to run. Emails commonly use 'center' (legacy but
//         // still the most Outlook-safe centering wrapper), 'figure' for image
//         // blocks, 'colgroup'/'col' for column widths, plain lists/headings,
//         // and legacy 'font'/'u'/'b'/'i' tags — any tag NOT on this list gets
//         // unwrapped on paste, and its style/class/attributes are lost with it.
//         allow: [{
//             name: /^(table|thead|tbody|tfoot|tr|td|th|colgroup|col|img|a|span|div|p|br|strong|em|b|i|u|s|font|center|figure|figcaption|ul|ol|li|h1|h2|h3|h4|h5|h6|hr|blockquote|pre|code)$/,
//             attributes: true,
//             classes: true,
//             styles: true
//         }] as any
//     },
//     image: {
//         // Paste / upload as inline so multiple images can sit side-by-side like Gmail
//         insert: {
//             type: 'inline'
//         },
//         resizeUnit: '%',
//         resizeOptions: [
//             { name: 'resizeImage:small', value: '25', label: 'Small', icon: 'small' },
//             { name: 'resizeImage:bestFit', value: '100', label: 'Best fit', icon: 'large' },
//             { name: 'resizeImage:original', value: null, label: 'Original size', icon: 'original' },
//         ],
//         toolbar: [
//             'imageSizeSmall',
//             'imageSizeBestFit',
//             'imageSizeOriginal',
//             '|',
//             'imageRemove'
//         ]
//     },
//     placeholder: 'Type or paste your content here!',
//     table: {
//         contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties', 'tableC'],
//         tableProperties: {
//             defaultProperties: {
//                 borderStyle: 'solid',
//                 borderColor: '#BBC0C4',
//                 borderWidth: '1px',
//             },
//         },
//         tableCellProperties: {
//             defaultProperties: {
//                 borderStyle: 'solid',
//                 borderColor: '#BBC0C4',
//                 borderWidth: '1px',
//                 padding: '4px',
//             },
//         },
//     },
//     link: {
//         toolbar: ['linkPreview', '|', 'editLink', 'copyLink', 'unlink'],
//         addTargetToExternalLinks: true,
//         defaultProtocol: 'https://',
//         decorators: {
//             // Empty to remove downloadable option  
//         }
//     },
//     ui: {
//         Dialog: {
//             Position: 'editor-center'
//         }
//     }
// }

// export default ckEditorConfig;





// import {
//     Essentials,
//     Paragraph,
//     Bold,
//     Italic,
//     Heading,
//     FontColor,
//     SourceEditing,
//     FontSize,
//     Underline,
//     Table,
//     TableProperties,
//     TableCellProperties,
//     TableToolbar,
//     Link,
//      LinkUI,
//     LinkEditing,
//     ContextualBalloon,
//     Alignment,
//     List,
//     Strikethrough,
//     Code,
//     HorizontalLine,
//     GeneralHtmlSupport,
//     Autoformat,
//     AutoLink,
//     Autosave,
//     CodeBlock,
//     FontBackgroundColor,
//     FontFamily,
//     ImageBlock,
//     ImageEditing,
//     ImageInline,
//     ImageStyle,
//     ImageToolbar,
//     ImageResize,
//     ImageUpload,
//     ImageUtils,
//     // MediaEmbed,
//     PasteFromMarkdownExperimental,
//     PasteFromOffice,
//     PlainTableOutput,
//     TableColumnResize,
//     ShowBlocks,
//     Indent,
//     IndentBlock,
//     Highlight,
//     ButtonView
// } from 'ckeditor5';
// import { config } from "./config"
 
// /**
//  * Clipboard screenshots usually arrive as a File with a generic browser name
//  * (e.g. "image.png"). Real inserts/pastes of files keep the original name
//  * (e.g. "Vacation.jpg"), which the backend needs via data-filename.
//  */
// function getOriginalImageFilename(file: File | undefined): string | undefined {
//     const name = file?.name?.trim();
//     if (!name) return undefined;
//     if (/^image\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name)) return undefined;
//     return name;
// }
 
// // Base64 Upload Adapter Plugin
// function createBase64UploadAdapter(loader: any) {
//     return {
//         upload: function () {
//             return loader.file.then(function (file: File) {
//                 return new Promise(function (resolve, reject) {
//                     var reader = new FileReader();
//                     reader.onload = function () {
//                         const response: Record<string, unknown> = { default: reader.result };
//                         const filename = getOriginalImageFilename(file);
//                         if (filename) {
//                             response.filename = filename;
//                         }
//                         resolve(response);
//                     };
//                     reader.onerror = function (err) {
//                         reject(err);
//                     };
//                     reader.readAsDataURL(file);
//                 });
//             });
//         },
//         abort: function () {
//             // Nothing to abort for Base64 uploads
//         }
//     };
// }
 
// function Base64UploadAdapterPlugin(editor: any) {
//     editor.plugins.get('FileRepository').createUploadAdapter = function (loader: any) {
//         return createBase64UploadAdapter(loader);
//     };
// }
 
// /**
//  * Keeps original file names on inserted/pasted images as data-filename so the
//  * backend can recover names like Vacation.jpg from compose HTML (base64 alone
//  * has no filename; nameless clipboard screenshots are left without the attr).
//  */
// function ImageFilenamePlugin(editor: any) {
//     const IMAGE_TYPES = ['imageInline', 'imageBlock'] as const;
 
//     for (const imageType of IMAGE_TYPES) {
//         if (editor.model.schema.isRegistered(imageType)) {
//             editor.model.schema.extend(imageType, {
//                 allowAttributes: ['dataFilename'],
//             });
//         }
//     }
 
//     editor.conversion.for('upcast').attributeToAttribute({
//         view: {
//             name: 'img',
//             key: 'data-filename',
//         },
//         model: 'dataFilename',
//     });
 
//     editor.conversion.for('downcast').add((dispatcher: any) => {
//         for (const imageType of IMAGE_TYPES) {
//             dispatcher.on(
//                 `attribute:dataFilename:${imageType}`,
//                 (evt: any, data: any, conversionApi: any) => {
//                     if (!conversionApi.consumable.consume(data.item, evt.name)) {
//                         return;
//                     }
 
//                     const viewElement = conversionApi.mapper.toViewElement(data.item);
//                     if (!viewElement) return;
 
//                     const imageUtils = editor.plugins.get('ImageUtils');
//                     const img = imageUtils?.findViewImgElement(viewElement);
//                     if (!img) return;
 
//                     if (data.attributeNewValue != null && data.attributeNewValue !== '') {
//                         conversionApi.writer.setAttribute(
//                             'data-filename',
//                             data.attributeNewValue,
//                             img
//                         );
//                     } else {
//                         conversionApi.writer.removeAttribute('data-filename', img);
//                     }
//                 }
//             );
//         }
//     });
 
//     const imageUploadEditing = editor.plugins.get('ImageUploadEditing');
//     if (!imageUploadEditing) return;
 
//     imageUploadEditing.on('uploadComplete', (_evt: any, { data, imageElement }: any) => {
//         const filename = typeof data?.filename === 'string' ? data.filename.trim() : '';
//         if (!filename) return;
 
//         editor.model.change((writer: any) => {
//             writer.setAttribute('dataFilename', filename, imageElement);
//         });
//     });
// }
 
// const COPY_LINK_ICON =
//     '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org"><path d="M7 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M17 3H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>';
// const COPIED_LINK_ICON =
//     '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.16669 11.6667L7.08335 14.5833L15.8334 5.41667" stroke="#0073B6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 
// /**
//  * Saare toolbar icons ek jagah.
//  * Key = CKEditor component name (toolbar items wala naam).
//  * Icon badalna ho to sirf yahan SVG badlo. SVG me fill/stroke attribute mat rakhna,
//  * tabhi hover/active/disabled ka color apne aap aayega.
//  */
// const TOOLBAR_ICONS: Record<string, string> = {
//     // "More options" group ka icon (toolbar config me use hota hai)
//     moreOptions:
//         '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2.4258 16.7533L8.2591 3.1775C9.1 2.108 10.9 2.108 11.7409 3.1775L17.5742 16.7533A0.625 0.625 0 0 1 16.4258 17.2467L10.5925 3.6709C10.2 3.609 9.8 3.609 9.4075 3.6709L3.5742 17.2467A0.625 0.625 0 0 1 2.4258 16.7533ZM6 9.5872H14A0.625 0.625 0 0 1 14 10.8372H6A0.625 0.625 0 0 1 6 9.5872Z"/></svg>',
 
//     // Toolbar ka 'link' button (placeholder - apna SVG aave tyare path replace karjo)
//     link:
//         '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7.83325 9.375H12.8332A.625.625 0 0 1 12.8332 10.625H7.83325A.625.625 0 0 1 7.83325 9.375ZM7.83333 4.375H7A5.625 5.625 0 0 0 7 15.625H7.83333A.625.625 0 0 0 7.83333 14.375H7A4.375 4.375 0 0 1 7 5.625H7.83333A.625.625 0 0 0 7.83333 4.375ZM12.8333 4.375H13.6667A5.625 5.625 0 0 1 13.6667 15.625H12.8333A.625.625 0 0 1 12.8333 14.375H13.6667A4.375 4.375 0 0 0 13.6667 5.625H12.8333A.625.625 0 0 1 12.8333 4.375Z"/></svg>',
 

//     // Future ma koi bhi icon badalvo hoy to bas ek line add karo, jem ke:
//     // bold: '<svg ...>...</svg>',
//     // fontColor: '<svg ...>...</svg>',
//     // insertTable: '<svg ...>...</svg>',
//     // undo: '<svg ...>...</svg>',
// };
 
// /**
//  * Common plugin: TOOLBAR_ICONS ma jetla keys chhe te badha components no icon override kare.
//  * Normal button (bold, link, undo...) ane dropdown (fontColor, insertTable...) banne handle kare chhe.
//  */
// function ToolbarIconsPlugin(editor: any) {
//     const factory = editor.ui.componentFactory;
//     const originalCreate = factory.create.bind(factory);
 
//     factory.create = (name: string) => {
//         const view: any = originalCreate(name);
//         const icon = TOOLBAR_ICONS[name];
 
//         if (icon && view) {
//             if (view.buttonView) {
//                 // Dropdown (fontColor, insertTable, alignment...)
//                 view.buttonView.icon = icon;
//             } else if ('icon' in view) {
//                 // Normal button (link, bold, undo...)
//                 view.icon = icon;
//             }
//         }
 
//         return view;
//     };
// }
 
// function copyTextToClipboard(text: string) {
//     const writeWithFallback = () => {
//         const textarea = document.createElement('textarea');
//         textarea.value = text;
//         textarea.setAttribute('readonly', '');
//         textarea.style.position = 'fixed';
//         textarea.style.left = '-9999px';
//         textarea.style.top = '0';
//         textarea.style.opacity = '0';
//         document.body.appendChild(textarea);
//         textarea.focus();
//         textarea.select();
//         textarea.setSelectionRange(0, textarea.value.length);
//         document.execCommand('copy');
//         document.body.removeChild(textarea);
//     };
 
//     if (navigator?.clipboard?.writeText) {
//         return navigator.clipboard.writeText(text).catch(writeWithFallback);
//     }
 
//     writeWithFallback();
//     return Promise.resolve();
// }
 
// // Enhanced Link Plugin
// function EnhancedLinkPlugin(editor: any) {
//     editor.ui.componentFactory.add('copyLink', (locale: any) => {
//         const view = new ButtonView(locale);
//         const linkCommand = editor.commands.get('link');
//         // Keep last known URL — balloon button clicks can clear selection before execute runs
//         let lastLinkUrl = '';
//         let copiedResetTimer: ReturnType<typeof setTimeout> | null = null;
 
//         const resetCopyButton = () => {
//             view.set({
//                 icon: COPY_LINK_ICON,
//                 label: 'Copy Link',
//                 withText: false,
//                 tooltip: true,
//             });
//             view.element?.classList.remove('ck-copy-link-copied');
//         };
 
//         const showCopiedFeedback = () => {
//             if (copiedResetTimer) {
//                 clearTimeout(copiedResetTimer);
//             }
 
//             view.set({
//                 icon: COPIED_LINK_ICON,
//                 label: 'Copied..',
//                 withText: true,
//                 tooltip: false,
//             });
//             view.element?.classList.add('ck-copy-link-copied');
 
//             copiedResetTimer = setTimeout(() => {
//                 resetCopyButton();
//                 copiedResetTimer = null;
//             }, 1000);
//         };
 
//         view.set({
//             label: 'Copy Link',
//             icon: COPY_LINK_ICON,
//             tooltip: true,
//             withText: false,
//         });
 
//         linkCommand.on('change:value', (_evt: any, _name: any, value: any) => {
//             if (value) {
//                 lastLinkUrl = typeof value === 'string' ? value : String(value);
//             } else if (copiedResetTimer) {
//                 // Balloon closed / left link — restore default copy state
//                 clearTimeout(copiedResetTimer);
//                 copiedResetTimer = null;
//                 resetCopyButton();
//             }
//         });
 
//         if (linkCommand.value) {
//             lastLinkUrl = typeof linkCommand.value === 'string'
//                 ? linkCommand.value
//                 : String(linkCommand.value);
//         }
 
//         view.bind('isEnabled').to(linkCommand, 'value', (value: any) => !!value);
 
//         // Keep selection/focus in the editor so linkCommand.value is not cleared on click
//         view.on('render', () => {
//             view.element?.addEventListener('mousedown', (evt: Event) => {
//                 evt.preventDefault();
//             });
//         });
 
//         view.on('execute', () => {
//             const selectionUrl = editor.model.document.selection.getAttribute('linkHref');
//             const previewEl = document.querySelector(
//                 '.ck-link-toolbar a.ck-button, .ck-link-actions a.ck-button, a.ck-link-actions__preview'
//             ) as HTMLAnchorElement | null;
//             const previewUrl =
//                 previewEl?.getAttribute('href') ||
//                 previewEl?.textContent?.trim() ||
//                 '';
 
//             const url =
//                 (typeof linkCommand.value === 'string' ? linkCommand.value : '') ||
//                 selectionUrl ||
//                 lastLinkUrl ||
//                 previewUrl;
 
//             if (!url) return;
 
//             Promise.resolve(copyTextToClipboard(String(url))).then(showCopiedFeedback);
//         });
 
//         return view;
//     });
// }
 
// // Gmail-like image size / remove options shown when an image is clicked
// function GmailImageOptionsPlugin(editor: any) {
//     const sizeOptions: Array<{ name: string; label: string; width: string | null }> = [
//         { name: 'imageSizeSmall', label: 'Small', width: '25%' },
//         { name: 'imageSizeBestFit', label: 'Best fit', width: '100%' },
//         { name: 'imageSizeOriginal', label: 'Original size', width: null },
//     ];
 
    
 
//     for (const option of sizeOptions) {
//         editor.ui.componentFactory.add(option.name, (locale: any) => {
//             const view = new ButtonView(locale);
//             const resizeCommand = editor.commands.get('resizeImage');
 
//             view.set({
//                 label: option.label,
//                 withText: true,
//                 tooltip: false,
//                 isToggleable: true,
//                 class: 'ck-gmail-image-option',
//             });
 
//             if (resizeCommand) {
//                 view.bind('isEnabled').to(resizeCommand, 'isEnabled');
//                 view.bind('isOn').to(resizeCommand, 'value', (value: any) => {
//                     const currentWidth = value?.width ?? null;
//                     return currentWidth === option.width;
//                 });
//             }
 
//             view.on('execute', () => {
//                 editor.execute('resizeImage', { width: option.width });
//                 editor.editing.view.focus();
//             });
 
//             return view;
//         });
//     }
 
//     editor.ui.componentFactory.add('imageRemove', (locale: any) => {
//         const view = new ButtonView(locale);
//         const resizeCommand = editor.commands.get('resizeImage');
//         const imageUtils = editor.plugins.get('ImageUtils');
 
//         view.set({
//             label: 'Remove',
//             withText: true,
//             tooltip: false,
//             class: 'ck-gmail-image-option ck-gmail-image-remove',
//         });
 
//         if (resizeCommand) {
//             view.bind('isEnabled').to(resizeCommand, 'isEnabled');
//         }
 
//         view.on('execute', () => {
//             const imageElement = imageUtils?.getClosestSelectedImageElement(
//                 editor.model.document.selection
//             );
//             if (!imageElement) return;
 
//             editor.model.change((writer: any) => {
//                 writer.remove(imageElement);
//             });
//             editor.editing.view.focus();
//         });
 
//         return view;
//     });
// }
 
// /**
//  * Compose modal ma toolbar ne editor ni upar thi kadhi ne niche (footer ni upar) mukse.
//  *
//  * KHAAS: toolbar na element ne ekli nathi khasedto, pan poori `.ck-editor__top`
//  * (ck-editor__top > ck-sticky-panel > ck-sticky-panel__content > toolbar) structure
//  * slot ma move kare chhe. Etle tamari ckeditor css na badha selectors
//  * (".ck.ck-editor__top .ck-sticky-panel .ck-sticky-panel__content ..." vagere)
//  * jem na tem lagu pade chhe - css file ma kai badalvu/umervu nahi.
//  *
//  * Slot (.compose-editor-toolbar-slot) na hoy (bija editors) tyare kai j change nathi thatu.
//  */
// const BOTTOM_TOOLBAR_STYLE_ID = 'ck-bottom-toolbar-overrides';
 
// // Matra "upar khulva" mate ni nani rules (tamari main css ma "niche khulva" ni rules chhe).
// function ensureBottomToolbarStyles() {
//     if (typeof document === 'undefined' || document.getElementById(BOTTOM_TOOLBAR_STYLE_ID)) return;
//     const style = document.createElement('style');
//     style.id = BOTTOM_TOOLBAR_STYLE_ID;
 
// }
 
 
 
// const TOOLTIP_SUPPRESS_CLASS = 'ck-tooltips-suppressed';

// /** Injects (once) the CSS used to hide tooltips for the brief moment a dropdown opens. */
// function ensureTooltipSuppressStyle() {
//     const id = 'ck-tooltip-suppress-style';
//     if (document.getElementById(id)) return;
//     const style = document.createElement('style');
//     style.id = id;
//     style.textContent = `body.${TOOLTIP_SUPPRESS_CLASS} .ck.ck-tooltip { display: none !important; }`;
//     document.head.appendChild(style);
// }

// /**
//  * "More options" (A) formatting dropdown:
//  * - Open / close only when the A icon is clicked
//  * - Do NOT close on outside click, blur, or when using tools inside the panel
//  * - Opening focuses the first icon (Font Family); CKEditor shows tooltips on focus —
//  *   clear that so tooltips only appear on intentional hover
//  */
// function pinMoreOptionsDropdown(dropdownView: any) {
//     if (!dropdownView || typeof dropdownView.on !== 'function') return;

//     let allowCloseFromButton = false;

//     dropdownView.listenTo(dropdownView.buttonView, 'open', () => {
//         // Currently open → user is toggling closed via the A icon
//         if (dropdownView.isOpen) {
//             allowCloseFromButton = true;
//         }
//     }, { priority: 'highest' });

//     dropdownView.on('set:isOpen', (evt: any, _name: string, value: boolean) => {
//         if (value === false && !allowCloseFromButton) {
//             // Outside click / blur / execute inside panel — keep open
//             evt.return = true;
//         }
//         allowCloseFromButton = false;
//     }, { priority: 'high' });

//     // Hide tooltips from the moment the panel opens (before CKEditor focuses the first
//     // button and pins its "Font Family" tooltip) until that focus has been cleared.
//     dropdownView.on('change:isOpen', () => {
//         if (dropdownView.isOpen) {
//             ensureTooltipSuppressStyle();
//             document.body.classList.add(TOOLTIP_SUPPRESS_CLASS);
//         }
//     }, { priority: 'highest' });

//     dropdownView.on('change:isOpen', () => {
//         if (!dropdownView.isOpen) return;

//         // After CKEditor focuses the first panel button and pins its tooltip, clear it.
//         const clearFocusTooltip = () => {
//             try {
//                 const panelEl: HTMLElement | undefined = dropdownView.panelView?.element;
//                 const active = document.activeElement as HTMLElement | null;
//                 if (!panelEl || !active || !panelEl.contains(active)) return;

//                 // Ignore this programmatic focus so TooltipManager does not pin "Font Family"
//                 active.setAttribute('data-cke-tooltip-disabled', 'true');
//                 // Escape immediately unpins any visible .ck-tooltip balloon
//                 active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
//                 active.blur();
//                 // Hover tooltips work again once focus is cleared
//                 active.removeAttribute('data-cke-tooltip-disabled');
//             } finally {
//                 // Tooltips are visible again (hover only)
//                 document.body.classList.remove(TOOLTIP_SUPPRESS_CLASS);
//             }
//         };

//         requestAnimationFrame(() => {
//             requestAnimationFrame(clearFocusTooltip);
//         });
//     }, { priority: 'lowest' });
// }

// function isMoreOptionsDropdown(view: any): boolean {
//     if (!view?.buttonView) return false;
//     const label = view.buttonView.label;
//     if (label === 'Formatting options') return true;
//     const el: HTMLElement | undefined = view.buttonView.element;
//     if (el?.getAttribute('data-cke-tooltip-text') === 'Formatting options') return true;
//     return !!view.element?.classList?.contains('ck-toolbar__grouped-dropdown');
// }

// function PinMoreOptionsDropdownPlugin(editor: any) {
//     editor.on('ready', () => {
//         const toolbar = editor.ui?.view?.toolbar;
//         if (!toolbar?.items) return;

//         const pinIfNeeded = (item: any) => {
//             if (isMoreOptionsDropdown(item)) {
//                 pinMoreOptionsDropdown(item);
//             }
//         };

//         Array.from(toolbar.items).forEach(pinIfNeeded);
//         toolbar.items.on('add', (_evt: any, item: any) => pinIfNeeded(item));
//     });
// }

// /**
//  * Toolbar tooltips:
//  * - Removes CKEditor's built-in ~600ms hover delay (data-cke-tooltip-instant)
//  * - Forces every tooltip (including the ones inside the "Formatting options" panel) to open
//  *   on top (data-cke-tooltip-position="n"). Set at DOM level because CKEditor reads these
//  *   attributes when the tooltip is shown.
//  * - Tooltips of buttons inside a dropdown panel get an extra CSS class (data-cke-tooltip-class)
//  *   so they can be lifted a few px above the dark panel edge instead of touching it
//  *   (see ".ck-tooltip.ck-tooltip-above-panel" in the main CSS).
//  * Buttons inside the "Formatting options" panel render later, so we re-mark on DOM changes.
//  */
// function InstantTooltipsPlugin(editor: any) {
//     editor.on('ready', () => {
//         const root: HTMLElement | undefined = editor.ui?.view?.toolbar?.element;
//         if (!root) return;

//         const markInstant = () => {
//             root.querySelectorAll<HTMLElement>('[data-cke-tooltip-text]').forEach((el) => {
//                 if (el.dataset.ckeTooltipInstant !== 'true') {
//                     el.dataset.ckeTooltipInstant = 'true';
//                 }
//                 if (el.dataset.ckeTooltipPosition !== 'n') {
//                     el.dataset.ckeTooltipPosition = 'n';
//                 }
//                 // Buttons inside a dropdown panel (e.g. "Formatting options"): lift tooltip above panel edge
//                 if (el.closest('.ck-dropdown__panel') && el.dataset.ckeTooltipClass !== 'ck-tooltip-above-panel') {
//                     el.dataset.ckeTooltipClass = 'ck-tooltip-above-panel';
//                 }
//             });
//         };

//         markInstant();
//         const observer = new MutationObserver(markInstant);
//         observer.observe(root, { childList: true, subtree: true });
//         editor.once('destroy', () => observer.disconnect());
//     });
// }


// function ToolbarAtBottomPlugin(editor: any) {
//     editor.on('ready', () => {
//         const rootEl: HTMLElement | null = editor.ui?.view?.element ?? null;
//         // Compose modal + reply/forward/reply-all all host a footer toolbar slot
//         const slot = rootEl
//             ?.closest('.compose-email-modal, .reply-mail-box')
//             ?.querySelector('.compose-editor-toolbar-slot') as HTMLElement | null;
//         if (!rootEl || !slot) return;
 
//         const toolbarEl: HTMLElement | undefined = editor.ui.view.toolbar?.element;
//         if (!toolbarEl) return;
 
//         ensureBottomToolbarStyles();
 
//         // 0) CKEditor ni tamari css ma [dir=ltr] .ck-dropdown__arrow {width:10px} jevi rules chhe.
//         //    dir attribute editor root par hoy chhe; toolbar bahar nikli jata e rules lagta nahota
//         //    (arrow motha, icon spacing khotu). Etle slot par dir set karo.
//         slot.setAttribute('dir', editor.locale?.uiLanguageDirection || 'ltr');
 
//         // 0.1) Font color marker (toolbar ma gol circle) - selected color batave.
//         //      css ma `var(--ck-color-font-color-marker)` vaparyo chhe, je root par set thato hase;
//         //      toolbar bahar jata e variable nahoto malto. Have slot par set kariye chhiye.
//         const fontColorCommand = editor.commands.get('fontColor');
//         const DEFAULT_FONT_COLOR = '#212121';
//         const syncFontColorMarker = () => {
//             const value = fontColorCommand?.value;
//             slot.style.setProperty(
//                 '--ck-color-font-color-marker',
//                 typeof value === 'string' && value ? value : DEFAULT_FONT_COLOR
//             );
//         };
//         if (fontColorCommand) {
//             syncFontColorMarker();
//             fontColorCommand.on('change:value', syncFontColorMarker);
//         }
 
//         // 1) Sticky panel band: toolbar niche chhe, etle "scroll par fixed thai jaay" tevu na joiye
//         const stickyPanel = editor.ui.view.stickyPanel;
//         if (stickyPanel) {
//             try { stickyPanel.unbind('isActive'); } catch (_e) { /* already unbound */ }
//             try { stickyPanel.isActive = false; } catch (_e) { /* ignore */ }
//         }
 
//         // 2) Poori .ck-editor__top structure slot ma move karo (css selectors same rahe)
//         let topEl = toolbarEl.closest('.ck-editor__top') as HTMLElement | null;
//         if (!topEl) {
//             // Fallback (jo editor ma .ck-editor__top na hoy): same structure jate banavo
//             topEl = document.createElement('div');
//             topEl.className = 'ck ck-reset_all ck-editor__top';
//             const sticky = document.createElement('div');
//             sticky.className = 'ck ck-sticky-panel';
//             const content = document.createElement('div');
//             content.className = 'ck ck-sticky-panel__content';
//             content.appendChild(toolbarEl);
//             sticky.appendChild(content);
//             topEl.appendChild(sticky);
//         }
 
//         slot.querySelectorAll(':scope > .ck-editor__top').forEach((el) => el.remove());
//         slot.classList.add('ck-editor'); // ".ck-editor .ck-source-editing-button" jeva selectors mate
//         slot.appendChild(topEl);
//         rootEl.classList.add('ck-toolbar-at-bottom');
 
//         // 3) Dropdown panels + tooltips upar ni taraf
//         //    Compose footer is bottom-docked — south panels (e.g. Insert table grid)
//         //    get clipped on short viewports, so force north positions.
//         const openUp = (view: any) => {
//             if (!view || typeof view !== 'object') return;
 
//             if ('tooltipPosition' in view) view.tooltipPosition = 'n';
//             if (view.buttonView && 'tooltipPosition' in view.buttonView) {
//                 view.buttonView.tooltipPosition = 'n';
//             }
 
//             if ('panelPosition' in view) {
//                 const forceNorthPosition = () => {
//                     if (!view.isOpen) return;
//                     const btnEl: HTMLElement | undefined = view.buttonView?.element ?? view.element;
//                     if (!btnEl) return;
//                     // Only force upward when this toolbar lives in the compose footer slot
//                     if (!btnEl.closest('.compose-modal-footer')) return;
 
//                     const boundsEl =
//                         (btnEl.closest('.compose-modal-footer') as HTMLElement | null) ?? slot;
//                     const bounds = boundsEl.getBoundingClientRect();
//                     const btn = btnEl.getBoundingClientRect();
//                     const panelWidthGuess = 220;
//                     const roomOnRight = bounds.right - btn.left;
//                     const roomOnLeft = btn.right - bounds.left;
//                     // Open upward; align to trigger (ne = under left edge, nw = under right edge)
//                     if (roomOnRight >= panelWidthGuess) {
//                         view.panelPosition = 'ne';
//                     } else if (roomOnLeft >= panelWidthGuess) {
//                         view.panelPosition = 'nw';
//                     } else {
//                         view.panelPosition = roomOnRight >= roomOnLeft ? 'ne' : 'nw';
//                     }
//                 };
 
//                 view.on('change:isOpen', forceNorthPosition, { priority: 'highest' });
//                 // CKEditor may recalculate to south after open — re-assert north
//                 view.on('change:isOpen', () => {
//                     if (!view.isOpen) return;
//                     requestAnimationFrame(forceNorthPosition);
//                 }, { priority: 'low' });
//             }
 
//             // "More options" jevi nested toolbar dropdown
//             const nested = view.toolbarView?.items;
//             if (nested) {
//                 Array.from(nested).forEach(openUp);
//                 nested.on('add', (_evt: any, item: any) => openUp(item));
//             }
//         };
 
//         const toolbar = editor.ui.view.toolbar;
//         Array.from(toolbar.items).forEach(openUp);
//         toolbar.items.on('add', (_evt: any, item: any) => openUp(item));
 
//         editor.once('destroy', () => topEl && topEl.remove());
//     });

    
// }
 
 
// const ckEditorConfig: any = {
//     licenseKey: config.CKEDITOR_LICENSE_KEY,
//     fontColor: {
//         colors: [
//             { color: '#212121', label: ' ' },
//             { color: '#EA3843', label: ' ' },
//             { color: '#808080', label: ' ' },
//             { color: '#FF8A00', label: ' ' },
//             { color: '#FF5BA0', label: ' ' },
//             { color: '#FFB800', label: ' ' },
//             { color: '#263DB8', label: ' ' },
//             { color: '#49BA14', label: ' ' },
//             { color: '#00A3EF', label: ' ' },
//             { color: '#398415', label: ' ' },
//         ],
//         documentColors: 0
//     },
//     toolbar: {
//         items: [
//             'fontColor',  
//             {
//                 label: 'Formatting options',
//                  icon: TOOLBAR_ICONS.moreOptions,
//                 items: [                 
//                     'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikethrough',  'alignment', 'bulletedList', 'numberedList',  'undo', 'redo', 'insertTable', 'customMedia', 'SourceEditing', 'code', 'horizontalLine',
//                 ]
//             },
//             'link',
//         ],
//         shouldNotGroupWhenFull: true,
//         // removePlugins: ['ToolbarItemsTexts']
//     },
//     extraPlugins: [Base64UploadAdapterPlugin, ImageFilenamePlugin, EnhancedLinkPlugin, GmailImageOptionsPlugin, ToolbarAtBottomPlugin, ToolbarIconsPlugin, PinMoreOptionsDropdownPlugin, InstantTooltipsPlugin],
 
//     plugins: [
//         Essentials, Paragraph, Autoformat, AutoLink, Autosave,
//         Bold, Italic, Underline, Strikethrough, Code, CodeBlock,
//         FontColor, FontBackgroundColor, FontFamily, FontSize,
//         Heading, Highlight, HorizontalLine,
//         Alignment, List,
//         Link,LinkUI, LinkEditing, ContextualBalloon,
//         ImageBlock, ImageEditing, ImageInline, ImageStyle, ImageToolbar, ImageResize, ImageUpload, ImageUtils,
//         // MediaEmbed,
//         Indent, IndentBlock,
//         Table, TableToolbar, TableColumnResize, PlainTableOutput, TableProperties, TableCellProperties,
//         PasteFromMarkdownExperimental, PasteFromOffice,
//         ShowBlocks, SourceEditing,
//         GeneralHtmlSupport,
//         EnhancedLinkPlugin,
//         GmailImageOptionsPlugin
//     ],
//     language: 'en',
//     fontFamily: {
//         options: [
//             'default',
//             { title: 'Sans Serif', model: 'Arial, Helvetica, sans-serif' },
//             { title: 'Serif', model: 'Times New Roman, Times, serif' },
//             { title: 'Fixed Width', model: 'Courier New, Courier, monospace' },
//             { title: 'Wide', model: 'Arial Black, Gadget, sans-serif' },
//             { title: 'Narrow', model: 'Arial Narrow, Arial, sans-serif' },
//             { title: 'Comic Sans MS', model: 'Comic Sans MS, cursive' },
//             { title: 'Garamond', model: 'Garamond, serif' },
//             { title: 'Georgia', model: 'Georgia, serif' },
//             { title: 'Tahoma', model: 'Tahoma, Geneva, sans-serif' },
//             { title: 'Trebuchet MS', model: 'Trebuchet MS, Helvetica, sans-serif' },
//             { title: 'Verdana', model: 'Verdana, Geneva, sans-serif' },
//             { title: 'DM Sans', model: 'DM Sans, sans-serif' },
//         ],
//         supportAllValues: true,
//     },
//    fontSize: {
//     options: [
//         { title: 'Small', model: '10px', view: { name: 'span', styles: { 'font-size': '10px' } } },
//         'default',
//         { title: 'Large', model: '18px', view: { name: 'span', styles: { 'font-size': '18px' } } },
//         { title: 'Huge',  model: '32px', view: { name: 'span', styles: { 'font-size': '32px' } } },
//     ],
//     supportAllValues: true,
// },
//     fullscreen: {
//         onEnterCallback: (container: any) => {
//             container.classList.add('editor-container', 'editor-container_classic-editor', 'editor-container_include-fullscreen', 'main-container');
//         }
//     },
//     heading: {
//         options: [{
//             model: 'paragraph',
//             title: 'Paragraph',
//             class: 'ck-heading_paragraph'
//         },
//         {
//             model: 'heading1',
//             view: 'h1',
//             title: 'Heading 1',
//             class: 'ck-heading_heading1'
//         },
//         {
//             model: 'heading2',
//             view: 'h2',
//             title: 'Heading 2',
//             class: 'ck-heading_heading2'
//         },
//         {
//             model: 'heading3',
//             view: 'h3',
//             title: 'Heading 3',
//             class: 'ck-heading_heading3'
//         },
//         {
//             model: 'heading4',
//             view: 'h4',
//             title: 'Heading 4',
//             class: 'ck-heading_heading4'
//         },
//         {
//             model: 'heading5',
//             view: 'h5',
//             title: 'Heading 5',
//             class: 'ck-heading_heading5'
//         },
//         {
//             model: 'heading6',
//             view: 'h6',
//             title: 'Heading 6',
//             class: 'ck-heading_heading6'
//         }
//         ] as any
//     },
//     htmlSupport: {
//         // Broad allow-list so pasted HTML email templates aren't unwrapped
//         // before GHS's runtime dataFilter (see onReady in CkEditorRichText)
//         // ever gets a chance to run. Emails commonly use 'center' (legacy but
//         // still the most Outlook-safe centering wrapper), 'figure' for image
//         // blocks, 'colgroup'/'col' for column widths, plain lists/headings,
//         // and legacy 'font'/'u'/'b'/'i' tags — any tag NOT on this list gets
//         // unwrapped on paste, and its style/class/attributes are lost with it.
//         allow: [{
//             name: /^(table|thead|tbody|tfoot|tr|td|th|colgroup|col|img|a|span|div|p|br|strong|em|b|i|u|s|font|center|figure|figcaption|ul|ol|li|h1|h2|h3|h4|h5|h6|hr|blockquote|pre|code)$/,
//             attributes: true,
//             classes: true,
//             styles: true
//         }] as any
//     },
//     image: {
//         // Paste / upload as inline so multiple images can sit side-by-side like Gmail
//         insert: {
//             type: 'inline'
//         },
//         resizeUnit: '%',
//         resizeOptions: [
//             { name: 'resizeImage:small', value: '25', label: 'Small', icon: 'small' },
//             { name: 'resizeImage:bestFit', value: '100', label: 'Best fit', icon: 'large' },
//             { name: 'resizeImage:original', value: null, label: 'Original size', icon: 'original' },
//         ],
//         toolbar: [
//             'imageSizeSmall',
//             'imageSizeBestFit',
//             'imageSizeOriginal',
//             '|',
//             'imageRemove'
//         ]
//     },
//     placeholder: 'Type or paste your content here!',
//     table: {
//         contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties', 'tableC'],
//         tableProperties: {
//             defaultProperties: {
//                 borderStyle: 'solid',
//                 borderColor: '#BBC0C4',
//                 borderWidth: '1px',
//             },
//         },
//         tableCellProperties: {
//             defaultProperties: {
//                 borderStyle: 'solid',
//                 borderColor: '#BBC0C4',
//                 borderWidth: '1px',
//                 padding: '4px',
//             },
//         },
//     },
//     link: {
//         toolbar: ['linkPreview', '|', 'editLink', 'copyLink', 'unlink'],
//         addTargetToExternalLinks: true,
//         defaultProtocol: 'https://',
//         decorators: {
//             // Empty to remove downloadable option  
//         }
//     },
//     ui: {
//         Dialog: {
//             Position: 'editor-center'
//         }
//     }
// }
 
// /** Signature settings: flat dark toolbar matching compose icons (no Paragraph/heading). */
// export const ckEditorSettingsConfig: any = {
//     ...ckEditorConfig,
//     toolbar: {
//         items: [
//             'fontFamily', 'fontSize', 'fontColor', 'SourceEditing', 'bold', 'italic', 'underline', 'insertTable', 'customMedia', 'link', 'alignment', 'bulletedList', 'numberedList', 'undo', 'redo', 'strikethrough', 'code', 'horizontalLine',
//             {
//                 label: 'More options',
//                 icon: 'text',
//                 items: []
//             },
//         ],
//         shouldNotGroupWhenFull: false,
//         removePlugins: ['ToolbarItemsTexts']
//     },
//     // Keep toolbar on top in settings (no compose footer slot)
//     extraPlugins: [
//         Base64UploadAdapterPlugin,
//         ImageFilenamePlugin,
//         EnhancedLinkPlugin,
//         GmailImageOptionsPlugin,
//         ToolbarIconsPlugin,
//         InstantTooltipsPlugin,
//     ],
// };

// export default ckEditorConfig;



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
    ImageStyle,
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
    ButtonView,
    createDropdown,
    addToolbarToDropdown,
    IconBulletedList,
    IconNumberedList,
    IconCode,
    IconSource,
} from 'ckeditor5';
import { config } from "./config"
import { MyCustomMediaPlugin } from '../components/ui/CkEditor/ckEditorExtraPlugin';
 
/**
 * Clipboard screenshots usually arrive as a File with a generic browser name
 * (e.g. "image.png"). Real inserts/pastes of files keep the original name
 * (e.g. "Vacation.jpg"), which the backend needs via data-filename.
 */
function getOriginalImageFilename(file: File | undefined): string | undefined {
    const name = file?.name?.trim();
    if (!name) return undefined;
    if (/^image\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name)) return undefined;
    return name;
}
 
// Base64 Upload Adapter Plugin
function createBase64UploadAdapter(loader: any) {
    return {
        upload: function () {
            return loader.file.then(function (file: File) {
                return new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        const response: Record<string, unknown> = { default: reader.result };
                        const filename = getOriginalImageFilename(file);
                        if (filename) {
                            response.filename = filename;
                        }
                        resolve(response);
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
 
/**
 * Keeps original file names on inserted/pasted images as data-filename so the
 * backend can recover names like Vacation.jpg from compose HTML (base64 alone
 * has no filename; nameless clipboard screenshots are left without the attr).
 */
function ImageFilenamePlugin(editor: any) {
    const IMAGE_TYPES = ['imageInline', 'imageBlock'] as const;
 
    for (const imageType of IMAGE_TYPES) {
        if (editor.model.schema.isRegistered(imageType)) {
            editor.model.schema.extend(imageType, {
                allowAttributes: ['dataFilename'],
            });
        }
    }
 
    editor.conversion.for('upcast').attributeToAttribute({
        view: {
            name: 'img',
            key: 'data-filename',
        },
        model: 'dataFilename',
    });
 
    editor.conversion.for('downcast').add((dispatcher: any) => {
        for (const imageType of IMAGE_TYPES) {
            dispatcher.on(
                `attribute:dataFilename:${imageType}`,
                (evt: any, data: any, conversionApi: any) => {
                    if (!conversionApi.consumable.consume(data.item, evt.name)) {
                        return;
                    }
 
                    const viewElement = conversionApi.mapper.toViewElement(data.item);
                    if (!viewElement) return;
 
                    const imageUtils = editor.plugins.get('ImageUtils');
                    const img = imageUtils?.findViewImgElement(viewElement);
                    if (!img) return;
 
                    if (data.attributeNewValue != null && data.attributeNewValue !== '') {
                        conversionApi.writer.setAttribute(
                            'data-filename',
                            data.attributeNewValue,
                            img
                        );
                    } else {
                        conversionApi.writer.removeAttribute('data-filename', img);
                    }
                }
            );
        }
    });
 
    const imageUploadEditing = editor.plugins.get('ImageUploadEditing');
    if (!imageUploadEditing) return;
 
    imageUploadEditing.on('uploadComplete', (_evt: any, { data, imageElement }: any) => {
        const filename = typeof data?.filename === 'string' ? data.filename.trim() : '';
        if (!filename) return;
 
        editor.model.change((writer: any) => {
            writer.setAttribute('dataFilename', filename, imageElement);
        });
    });
}
 
const COPY_LINK_ICON =
    '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org"><path d="M7 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M17 3H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>';
const COPIED_LINK_ICON =
    '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.16669 11.6667L7.08335 14.5833L15.8334 5.41667" stroke="#0073B6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 
/**
 * Saare toolbar icons ek jagah.
 * Key = CKEditor component name (toolbar items wala naam).
 * Icon badalna ho to sirf yahan SVG badlo. SVG me fill/stroke attribute mat rakhna,
 * tabhi hover/active/disabled ka color apne aap aayega.
 */
const TOOLBAR_ICONS: Record<string, string> = {
    // "More options" group ka icon (toolbar config me use hota hai)
    moreOptions:
        '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2.4258 16.7533L8.2591 3.1775C9.1 2.108 10.9 2.108 11.7409 3.1775L17.5742 16.7533A0.625 0.625 0 0 1 16.4258 17.2467L10.5925 3.6709C10.2 3.609 9.8 3.609 9.4075 3.6709L3.5742 17.2467A0.625 0.625 0 0 1 2.4258 16.7533ZM6 9.5872H14A0.625 0.625 0 0 1 14 10.8372H6A0.625 0.625 0 0 1 6 9.5872Z"/></svg>',
 
    // Toolbar ka 'link' button (placeholder - apna SVG aave tyare path replace karjo)
    link:
        '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7.83325 9.375H12.8332A.625.625 0 0 1 12.8332 10.625H7.83325A.625.625 0 0 1 7.83325 9.375ZM7.83333 4.375H7A5.625 5.625 0 0 0 7 15.625H7.83333A.625.625 0 0 0 7.83333 14.375H7A4.375 4.375 0 0 1 7 5.625H7.83333A.625.625 0 0 0 7.83333 4.375ZM12.8333 4.375H13.6667A5.625 5.625 0 0 1 13.6667 15.625H12.8333A.625.625 0 0 1 12.8333 14.375H13.6667A4.375 4.375 0 0 0 13.6667 5.625H12.8333A.625.625 0 0 1 12.8333 4.375Z"/></svg>',

    // Future ma koi bhi icon badalvo hoy to bas ek line add karo, jem ke:
    // bold: '<svg ...>...</svg>',
    // fontColor: '<svg ...>...</svg>',
    // insertTable: '<svg ...>...</svg>',
    // undo: '<svg ...>...</svg>',
};
 
/**
 * Common plugin: TOOLBAR_ICONS ma jetla keys chhe te badha components no icon override kare.
 * Normal button (bold, link, undo...) ane dropdown (fontColor, insertTable...) banne handle kare chhe.
 */
function ToolbarIconsPlugin(editor: any) {
    const factory = editor.ui.componentFactory;
    const originalCreate = factory.create.bind(factory);
 
    factory.create = (name: string) => {
        const view: any = originalCreate(name);
        const icon = TOOLBAR_ICONS[name];
 
        if (icon && view) {
            if (view.buttonView) {
                // Dropdown (fontColor, insertTable, alignment...)
                view.buttonView.icon = icon;
            } else if ('icon' in view) {
                // Normal button (link, bold, undo...)
                view.icon = icon;
            }
        }
 
        return view;
    };
}
 
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
 
// Gmail-like image size / remove options shown when an image is clicked
function GmailImageOptionsPlugin(editor: any) {
    const sizeOptions: Array<{ name: string; label: string; width: string | null }> = [
        { name: 'imageSizeSmall', label: 'Small', width: '25%' },
        { name: 'imageSizeBestFit', label: 'Best fit', width: '100%' },
        { name: 'imageSizeOriginal', label: 'Original size', width: null },
    ];
  
    for (const option of sizeOptions) {
        editor.ui.componentFactory.add(option.name, (locale: any) => {
            const view = new ButtonView(locale);
            const resizeCommand = editor.commands.get('resizeImage');
 
            view.set({
                label: option.label,
                withText: true,
                tooltip: false,
                isToggleable: true,
                class: 'ck-gmail-image-option',
            });
 
            if (resizeCommand) {
                view.bind('isEnabled').to(resizeCommand, 'isEnabled');
                view.bind('isOn').to(resizeCommand, 'value', (value: any) => {
                    const currentWidth = value?.width ?? null;
                    return currentWidth === option.width;
                });
            }
 
            view.on('execute', () => {
                editor.execute('resizeImage', { width: option.width });
                editor.editing.view.focus();
            });
 
            return view;
        });
    }
 
    editor.ui.componentFactory.add('imageRemove', (locale: any) => {
        const view = new ButtonView(locale);
        const resizeCommand = editor.commands.get('resizeImage');
        const imageUtils = editor.plugins.get('ImageUtils');
 
        view.set({
            label: 'Remove',
            withText: true,
            tooltip: false,
            class: 'ck-gmail-image-option ck-gmail-image-remove',
        });
 
        if (resizeCommand) {
            view.bind('isEnabled').to(resizeCommand, 'isEnabled');
        }
 
        view.on('execute', () => {
            const imageElement = imageUtils?.getClosestSelectedImageElement(
                editor.model.document.selection
            );
            if (!imageElement) return;
 
            editor.model.change((writer: any) => {
                writer.remove(imageElement);
            });
            editor.editing.view.focus();
        });
 
        return view;
    });
}
 
/**
 * Compose modal ma toolbar ne editor ni upar thi kadhi ne niche (footer ni upar) mukse.
 *
 * KHAAS: toolbar na element ne ekli nathi khasedto, pan poori `.ck-editor__top`
 * (ck-editor__top > ck-sticky-panel > ck-sticky-panel__content > toolbar) structure
 * slot ma move kare chhe. Etle tamari ckeditor css na badha selectors
 * (".ck.ck-editor__top .ck-sticky-panel .ck-sticky-panel__content ..." vagere)
 * jem na tem lagu pade chhe - css file ma kai badalvu/umervu nahi.
 *
 * Slot (.compose-editor-toolbar-slot) na hoy (bija editors) tyare kai j change nathi thatu.
 */
const BOTTOM_TOOLBAR_STYLE_ID = 'ck-bottom-toolbar-overrides';
 
// Matra "upar khulva" mate ni nani rules (tamari main css ma "niche khulva" ni rules chhe).
function ensureBottomToolbarStyles() {
    if (typeof document === 'undefined' || document.getElementById(BOTTOM_TOOLBAR_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = BOTTOM_TOOLBAR_STYLE_ID;
 
}
 
 
 
const TOOLTIP_DISABLED_ATTR = 'data-cke-tooltip-disabled';

/**
 * When the dropdown panel opens, CKEditor focuses its first button and TooltipManager
 * would pin a tooltip for it (focus without hover => shown immediately).
 * We use the official `data-cke-tooltip-disabled` attribute on that first focused
 * element. A capture listener on `window` runs before TooltipManager's own capture
 * listener on `document`, so the attribute is already set when TooltipManager checks it.
 */
function suppressTooltipOnFirstPanelFocus(dropdownView: any) {
    function finish() {
        window.removeEventListener('focus', onFocus, true);
    }

    function onFocus(evt: FocusEvent) {
        const target = evt.target as HTMLElement | null;
        const panelEl: HTMLElement | undefined = dropdownView.panelView?.element;

        if (!(target instanceof HTMLElement) || !panelEl || !panelEl.contains(target)) return;

        target.setAttribute(TOOLTIP_DISABLED_ATTR, 'true');
        // Hover tooltips work again from the next frame
        requestAnimationFrame(() => target.removeAttribute(TOOLTIP_DISABLED_ATTR));
        finish();
    }

    window.addEventListener('focus', onFocus, true);

    // Safety: stop listening even if the panel never received focus
    requestAnimationFrame(() => requestAnimationFrame(finish));
}

/**
 * "More options" (A) formatting dropdown:
 * - Open / close only when the A icon is clicked
 * - Do NOT close on outside click, blur, or when using tools inside the panel
 * - Opening focuses the first icon (Font Family); no tooltip should be pinned for that
 *   programmatic focus, tooltips should appear only on intentional hover
 */
function pinMoreOptionsDropdown(dropdownView: any) {
    if (!dropdownView || typeof dropdownView.on !== 'function') return;

    let allowCloseFromButton = false;

    dropdownView.listenTo(dropdownView.buttonView, 'open', () => {
        // Currently open → user is toggling closed via the A icon
        if (dropdownView.isOpen) {
            allowCloseFromButton = true;
        }
    }, { priority: 'highest' });

    dropdownView.on('set:isOpen', (evt: any, _name: string, value: boolean) => {
        if (value === false && !allowCloseFromButton) {
            // Outside click / blur / execute inside panel — keep open
            evt.return = true;
        }
        allowCloseFromButton = false;
    }, { priority: 'high' });

    // 'highest' => runs before CKEditor focuses the first panel button
    dropdownView.on('change:isOpen', () => {
        if (dropdownView.isOpen) {
            suppressTooltipOnFirstPanelFocus(dropdownView);
        }
    }, { priority: 'highest' });
}

function isMoreOptionsDropdown(view: any): boolean {
    if (!view?.buttonView) return false;
    const label = view.buttonView.label;
    if (label === 'Formatting options') return true;
    const el: HTMLElement | undefined = view.buttonView.element;
    if (el?.getAttribute('data-cke-tooltip-text') === 'Formatting options') return true;
    // Do not treat Lists/Code (or other) grouped dropdowns as the pinned "Formatting options" panel.
    return false;
}

function PinMoreOptionsDropdownPlugin(editor: any) {
    editor.on('ready', () => {
        const toolbar = editor.ui?.view?.toolbar;
        if (!toolbar?.items) return;

        const pinIfNeeded = (item: any) => {
            if (isMoreOptionsDropdown(item)) {
                pinMoreOptionsDropdown(item);
            }
        };

        Array.from(toolbar.items).forEach(pinIfNeeded);
        toolbar.items.on('add', (_evt: any, item: any) => pinIfNeeded(item));
    });
}

/**
 * Toolbar tooltips (official TooltipManager data attributes):
 * - data-cke-tooltip-instant  => no hover delay
 * - data-cke-tooltip-position => 'n' (open on top)
 * - data-cke-tooltip-class    => buttons inside a dropdown panel get an extra class so the
 *   tooltip can sit a few px above the panel edge (".ck-tooltip.ck-tooltip-above-panel" in CSS)
 * Buttons inside the "Formatting options" panel render lazily, and tooltip text can be
 * set/changed later, so we re-mark on DOM changes and on `data-cke-tooltip-text` changes.
 */
function InstantTooltipsPlugin(editor: any) {
    editor.on('ready', () => {
        const root: HTMLElement | undefined = editor.ui?.view?.toolbar?.element;
        if (!root) return;

        const markInstant = () => {
            // Black tooltip only when this toolbar lives in the compose/reply footer slot
            const isCompose = !!root.closest('.compose-editor-toolbar-slot');

            root.querySelectorAll<HTMLElement>('[data-cke-tooltip-text]').forEach((el) => {
                if (el.dataset.ckeTooltipInstant !== 'true') {
                    el.dataset.ckeTooltipInstant = 'true';
                }
                if (el.dataset.ckeTooltipPosition !== 'n') {
                    el.dataset.ckeTooltipPosition = 'n';
                }

                // data-cke-tooltip-class accepts multiple space-separated classes
                const inPanel = !!el.closest('.ck-dropdown__panel');
                const tooltipClass = (inPanel
                    // Dark "Formatting options" panel: white tooltip, lifted above the panel edge
                    ? ['ck-tooltip-white', 'ck-tooltip-above-panel']
                    // Footer toolbar (font color, A, link): black tooltip
                    : [isCompose ? 'ck-tooltip-black' : '']
                ).filter(Boolean).join(' ');

                if (tooltipClass && el.dataset.ckeTooltipClass !== tooltipClass) {
                    el.dataset.ckeTooltipClass = tooltipClass;
                }
            });
        };

        markInstant();

        const observer = new MutationObserver(markInstant);
        observer.observe(root, {
            childList: true,
            subtree: true,
            // Only the text attribute is watched, so our own attribute writes above never retrigger it
            attributes: true,
            attributeFilter: ['data-cke-tooltip-text'],
        });
        editor.once('destroy', () => observer.disconnect());
    });
}


function ToolbarAtBottomPlugin(editor: any) {
    editor.on('ready', () => {
        const rootEl: HTMLElement | null = editor.ui?.view?.element ?? null;
        // Compose modal + reply/forward/reply-all all host a footer toolbar slot
        const slot = rootEl
            ?.closest('.compose-email-modal, .reply-mail-box')
            ?.querySelector('.compose-editor-toolbar-slot') as HTMLElement | null;
        if (!rootEl || !slot) return;
 
        const toolbarEl: HTMLElement | undefined = editor.ui.view.toolbar?.element;
        if (!toolbarEl) return;
 
        ensureBottomToolbarStyles();
 
        // 0) CKEditor ni tamari css ma [dir=ltr] .ck-dropdown__arrow {width:10px} jevi rules chhe.
        //    dir attribute editor root par hoy chhe; toolbar bahar nikli jata e rules lagta nahota
        //    (arrow motha, icon spacing khotu). Etle slot par dir set karo.
        slot.setAttribute('dir', editor.locale?.uiLanguageDirection || 'ltr');
 
        // 0.1) Font color marker (toolbar ma gol circle) - selected color batave.
        //      css ma `var(--ck-color-font-color-marker)` vaparyo chhe, je root par set thato hase;
        //      toolbar bahar jata e variable nahoto malto. Have slot par set kariye chhiye.
        const fontColorCommand = editor.commands.get('fontColor');
        const DEFAULT_FONT_COLOR = '#212121';
        const syncFontColorMarker = () => {
            const value = fontColorCommand?.value;
            slot.style.setProperty(
                '--ck-color-font-color-marker',
                typeof value === 'string' && value ? value : DEFAULT_FONT_COLOR
            );
        };
        if (fontColorCommand) {
            syncFontColorMarker();
            fontColorCommand.on('change:value', syncFontColorMarker);
        }
 
        // 1) Sticky panel band: toolbar niche chhe, etle "scroll par fixed thai jaay" tevu na joiye
        const stickyPanel = editor.ui.view.stickyPanel;
        if (stickyPanel) {
            try { stickyPanel.unbind('isActive'); } catch (_e) { /* already unbound */ }
            try { stickyPanel.isActive = false; } catch (_e) { /* ignore */ }
        }
 
        // 2) Poori .ck-editor__top structure slot ma move karo (css selectors same rahe)
        let topEl = toolbarEl.closest('.ck-editor__top') as HTMLElement | null;
        if (!topEl) {
            // Fallback (jo editor ma .ck-editor__top na hoy): same structure jate banavo
            topEl = document.createElement('div');
            topEl.className = 'ck ck-reset_all ck-editor__top';
            const sticky = document.createElement('div');
            sticky.className = 'ck ck-sticky-panel';
            const content = document.createElement('div');
            content.className = 'ck ck-sticky-panel__content';
            content.appendChild(toolbarEl);
            sticky.appendChild(content);
            topEl.appendChild(sticky);
        }
 
        slot.querySelectorAll(':scope > .ck-editor__top').forEach((el) => el.remove());
        slot.classList.add('ck-editor'); // ".ck-editor .ck-source-editing-button" jeva selectors mate
        slot.appendChild(topEl);
        rootEl.classList.add('ck-toolbar-at-bottom');
 
        // 3) Dropdown panels + tooltips upar ni taraf
        //    Compose footer is bottom-docked — south panels (e.g. Insert table grid)
        //    get clipped on short viewports, so force north positions.
        const openUp = (view: any) => {
            if (!view || typeof view !== 'object') return;
 
            if ('tooltipPosition' in view) view.tooltipPosition = 'n';
            if (view.buttonView && 'tooltipPosition' in view.buttonView) {
                view.buttonView.tooltipPosition = 'n';
            }
 
            if ('panelPosition' in view) {
                const forceNorthPosition = () => {
                    if (!view.isOpen) return;
                    const btnEl: HTMLElement | undefined = view.buttonView?.element ?? view.element;
                    if (!btnEl) return;
                    // Only force upward when this toolbar lives in the compose footer slot
                    if (!btnEl.closest('.compose-modal-footer')) return;
 
                    const boundsEl =
                        (btnEl.closest('.compose-modal-footer') as HTMLElement | null) ?? slot;
                    const bounds = boundsEl.getBoundingClientRect();
                    const btn = btnEl.getBoundingClientRect();
                    const panelWidthGuess = 220;
                    const roomOnRight = bounds.right - btn.left;
                    const roomOnLeft = btn.right - bounds.left;
                    // Open upward; align to trigger (ne = under left edge, nw = under right edge)
                    if (roomOnRight >= panelWidthGuess) {
                        view.panelPosition = 'ne';
                    } else if (roomOnLeft >= panelWidthGuess) {
                        view.panelPosition = 'nw';
                    } else {
                        view.panelPosition = roomOnRight >= roomOnLeft ? 'ne' : 'nw';
                    }
                };
 
                view.on('change:isOpen', forceNorthPosition, { priority: 'highest' });
                // CKEditor may recalculate to south after open — re-assert north
                view.on('change:isOpen', () => {
                    if (!view.isOpen) return;
                    requestAnimationFrame(forceNorthPosition);
                }, { priority: 'low' });
            }
 
            // "More options" jevi nested toolbar dropdown
            const nested = view.toolbarView?.items;
            if (nested) {
                Array.from(nested).forEach(openUp);
                nested.on('add', (_evt: any, item: any) => openUp(item));
            }
        };
 
        const toolbar = editor.ui.view.toolbar;
        Array.from(toolbar.items).forEach(openUp);
        toolbar.items.on('add', (_evt: any, item: any) => openUp(item));
 
        editor.once('destroy', () => topEl && topEl.remove());
    });

    
}
 
 
/**
 * Compose/reply/forward only: Lists + Code as real dropdowns (same pattern as alignment —
 * icon + chevron, vertical icon panel). Not used by settings toolbar.
 */
function ComposeFormatDropdownsPlugin(editor: any) {
    const factory = editor.ui.componentFactory;

    const bindCommandButton = (
        locale: any,
        commandName: string,
        label: string,
        icon: string,
        tooltipPosition: string
    ) => {
        const buttonView = new ButtonView(locale);
        const command = editor.commands.get(commandName);

        buttonView.set({
            label,
            icon,
            tooltip: true,
            tooltipPosition,
            isToggleable: true,
        });

        if (command) {
            buttonView.bind('isEnabled').to(command, 'isEnabled');
            buttonView.bind('isOn').to(command, 'value', (value: unknown) => !!value);
            buttonView.on('execute', () => {
                editor.execute(commandName);
                editor.editing.view.focus();
            });
        } else {
            buttonView.isEnabled = false;
        }

        return buttonView;
    };

    factory.add('listsDropdown', (locale: any) => {
        const dropdownView = createDropdown(locale);
        const tooltipPosition = locale.uiLanguageDirection === 'rtl' ? 'w' : 'e';
        const bulletedCommand = editor.commands.get('bulletedList');
        const numberedCommand = editor.commands.get('numberedList');

        addToolbarToDropdown(
            dropdownView,
            () => [
                bindCommandButton(locale, 'bulletedList', 'Bulleted List', IconBulletedList, tooltipPosition),
                bindCommandButton(locale, 'numberedList', 'Numbered List', IconNumberedList, tooltipPosition),
            ],
            {
                enableActiveItemFocusOnDropdownOpen: true,
                isVertical: true,
                ariaLabel: 'Lists',
            }
        );

        dropdownView.buttonView.set({
            label: 'Lists',
            tooltip: true,
            icon: IconBulletedList,
        });

        dropdownView.extendTemplate({
            attributes: {
                class: 'ck-lists-dropdown',
            },
        });

        if (bulletedCommand && numberedCommand) {
            dropdownView.bind('isEnabled').to(
                bulletedCommand,
                'isEnabled',
                numberedCommand,
                'isEnabled',
                (a: boolean, b: boolean) => a || b
            );
            dropdownView.buttonView.bind('icon').to(
                bulletedCommand,
                'value',
                numberedCommand,
                'value',
                (_bulletedOn: unknown, numberedOn: unknown) =>
                    numberedOn ? IconNumberedList : IconBulletedList
            );
        }

        dropdownView.on('execute', () => {
            editor.editing.view.focus();
        });

        return dropdownView;
    });

    factory.add('codeDropdown', (locale: any) => {
        const dropdownView = createDropdown(locale);
        const tooltipPosition = locale.uiLanguageDirection === 'rtl' ? 'w' : 'e';
        const codeCommand = editor.commands.get('code');
        const sourceEditing = editor.plugins.has('SourceEditing')
            ? editor.plugins.get('SourceEditing')
            : null;

        // Icon-only Source toggle. Do NOT reuse factory.create('sourceEditing') with
        // withText:true inside this compact panel — and keep this dropdown enabled even
        // when SourceEditing force-disables model commands (including `code`).
        const createSourceButton = () => {
            const buttonView = new ButtonView(locale);
            buttonView.set({
                label: 'Source',
                icon: IconSource,
                tooltip: true,
                tooltipPosition,
                isToggleable: true,
                withText: false,
                class: 'ck-source-editing-button',
            });

            if (!sourceEditing) {
                buttonView.isEnabled = false;
                return buttonView;
            }

            buttonView.bind('isOn').to(sourceEditing, 'isSourceEditingMode');
            buttonView.bind('isEnabled').to(
                sourceEditing,
                'isEnabled',
                editor,
                'isReadOnly',
                (pluginEnabled: boolean, isReadOnly: boolean) => pluginEnabled && !isReadOnly
            );
            buttonView.on('execute', () => {
                sourceEditing.isSourceEditingMode = !sourceEditing.isSourceEditingMode;
            });

            return buttonView;
        };

        addToolbarToDropdown(
            dropdownView,
            () => [
                createSourceButton(),
                bindCommandButton(locale, 'code', 'Code', IconCode, tooltipPosition),
            ],
            {
                // Avoid auto-focusing Source (and stealing editable focus) when the menu opens.
                enableActiveItemFocusOnDropdownOpen: false,
                isVertical: true,
                ariaLabel: 'Code',
            }
        );

        dropdownView.buttonView.set({
            label: 'Code',
            tooltip: true,
            icon: IconSource,
        });

        dropdownView.extendTemplate({
            attributes: {
                class: 'ck-code-options-dropdown',
            },
        });

        // Keep the dropdown usable in source mode so the user can toggle Source off.
        // (Binding to codeCommand.isEnabled would disable this control when Source is on.)
        // Do NOT bind buttonView.isOn — createDropdown already binds it to dropdown isOpen
        // (rebind throws observable-bind-rebind and Watchdog restarts the editor).
        dropdownView.bind('isEnabled').to(editor, 'isReadOnly', (isReadOnly: boolean) => !isReadOnly);

        const syncCodeDropdownIcon = () => {
            const sourceOn = !!sourceEditing?.isSourceEditingMode;
            const codeOn = !!codeCommand?.value;
            dropdownView.buttonView.icon = sourceOn || !codeOn ? IconSource : IconCode;
        };
        syncCodeDropdownIcon();
        codeCommand?.on('change:value', syncCodeDropdownIcon);
        sourceEditing?.on('change:isSourceEditingMode', syncCodeDropdownIcon);

        if (sourceEditing) {
            sourceEditing.on('change:isSourceEditingMode', () => {
                // Only close this Code menu — do not touch Formatting options.
                dropdownView.isOpen = false;
            });
        }

        dropdownView.on('execute', () => {
            // Source mode focuses its own textarea — don't steal focus back to the editable.
            if (sourceEditing?.isSourceEditingMode) return;
            editor.editing.view.focus();
        });

        return dropdownView;
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
            'fontColor',  
            {
                label: 'Formatting options',
                 icon: TOOLBAR_ICONS.moreOptions,
                items: [                 
                    'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikethrough',  'alignment',
                    'listsDropdown',
                    'undo', 'redo', 'insertTable',
                    'codeDropdown',
                    'horizontalLine',
                ]
            },
            'link',
            
        ],
        shouldNotGroupWhenFull: true,
        // removePlugins: ['ToolbarItemsTexts']
    },
    extraPlugins: [Base64UploadAdapterPlugin, ImageFilenamePlugin, EnhancedLinkPlugin, GmailImageOptionsPlugin, MyCustomMediaPlugin, ToolbarAtBottomPlugin, ToolbarIconsPlugin, PinMoreOptionsDropdownPlugin, InstantTooltipsPlugin, ComposeFormatDropdownsPlugin],
 
    plugins: [
        Essentials, Paragraph, Autoformat, AutoLink, Autosave,
        Bold, Italic, Underline, Strikethrough, Code, CodeBlock,
        FontColor, FontBackgroundColor, FontFamily, FontSize,
        Heading, Highlight, HorizontalLine,
        Alignment, List,
        Link,LinkUI, LinkEditing, ContextualBalloon,
        ImageBlock, ImageEditing, ImageInline, ImageStyle, ImageToolbar, ImageResize, ImageUpload, ImageUtils,
        // MediaEmbed,
        Indent, IndentBlock,
        Table, TableToolbar, TableColumnResize, PlainTableOutput, TableProperties, TableCellProperties,
        PasteFromMarkdownExperimental, PasteFromOffice,
        ShowBlocks, SourceEditing,
        GeneralHtmlSupport,
        EnhancedLinkPlugin,
        GmailImageOptionsPlugin
    ],
    language: 'en',
    fontFamily: {
        options: [
            'default',
            { title: 'Sans Serif', model: 'Arial, Helvetica, sans-serif' },
            { title: 'Serif', model: 'Times New Roman, Times, serif' },
            { title: 'Fixed Width', model: 'Courier New, Courier, monospace' },
            { title: 'Wide', model: 'Arial Black, Gadget, sans-serif' },
            { title: 'Narrow', model: 'Arial Narrow, Arial, sans-serif' },
            { title: 'Comic Sans MS', model: 'Comic Sans MS, cursive' },
            { title: 'Garamond', model: 'Garamond, serif' },
            { title: 'Georgia', model: 'Georgia, serif' },
            { title: 'Tahoma', model: 'Tahoma, Geneva, sans-serif' },
            { title: 'Trebuchet MS', model: 'Trebuchet MS, Helvetica, sans-serif' },
            { title: 'Verdana', model: 'Verdana, Geneva, sans-serif' },
            { title: 'DM Sans', model: 'DM Sans, sans-serif' },
        ],
        supportAllValues: true,
    },
   fontSize: {
    options: [
        { title: 'Small', model: '10px', view: { name: 'span', styles: { 'font-size': '10px' } } },
        'default',
        { title: 'Large', model: '18px', view: { name: 'span', styles: { 'font-size': '18px' } } },
        { title: 'Huge',  model: '32px', view: { name: 'span', styles: { 'font-size': '32px' } } },
    ],
    supportAllValues: true,
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
        // Broad allow-list so pasted HTML email templates aren't unwrapped
        // before GHS's runtime dataFilter (see onReady in CkEditorRichText)
        // ever gets a chance to run. Emails commonly use 'center' (legacy but
        // still the most Outlook-safe centering wrapper), 'figure' for image
        // blocks, 'colgroup'/'col' for column widths, plain lists/headings,
        // and legacy 'font'/'u'/'b'/'i' tags — any tag NOT on this list gets
        // unwrapped on paste, and its style/class/attributes are lost with it.
        allow: [{
            name: /^(table|thead|tbody|tfoot|tr|td|th|colgroup|col|img|a|span|div|p|br|strong|em|b|i|u|s|font|center|figure|figcaption|ul|ol|li|h1|h2|h3|h4|h5|h6|hr|blockquote|pre|code)$/,
            attributes: true,
            classes: true,
            styles: true
        }] as any
    },
    image: {
        // Paste / upload as inline so multiple images can sit side-by-side like Gmail
        insert: {
            type: 'inline'
        },
        resizeUnit: '%',
        resizeOptions: [
            { name: 'resizeImage:small', value: '25', label: 'Small', icon: 'small' },
            { name: 'resizeImage:bestFit', value: '100', label: 'Best fit', icon: 'large' },
            { name: 'resizeImage:original', value: null, label: 'Original size', icon: 'original' },
        ],
        toolbar: [
            'imageSizeSmall',
            'imageSizeBestFit',
            'imageSizeOriginal',
            '|',
            'imageRemove'
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
 
/** Signature settings: flat dark toolbar matching compose icons (no Paragraph/heading). */
export const ckEditorSettingsConfig: any = {
    ...ckEditorConfig,
    toolbar: {
        items: [
            'fontFamily', 'fontSize', 'fontColor', 'SourceEditing', 'bold', 'italic', 'underline', 'insertTable', 'link', 'alignment', 'bulletedList', 'numberedList', 'undo', 'redo', 'strikethrough', 'code', 'horizontalLine',
            {
                label: 'More options',
                icon: 'text',
                items: []
            },
        ],
        shouldNotGroupWhenFull: false,
        removePlugins: ['ToolbarItemsTexts']
    },
    // Keep toolbar on top in settings (no compose footer slot)
    extraPlugins: [
        Base64UploadAdapterPlugin,
        ImageFilenamePlugin,
        EnhancedLinkPlugin,
        GmailImageOptionsPlugin,
        MyCustomMediaPlugin,
        ToolbarIconsPlugin,
        InstantTooltipsPlugin,
    ],
};

export default ckEditorConfig;