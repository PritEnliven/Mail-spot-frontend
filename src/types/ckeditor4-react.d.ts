declare module '@ckeditor/ckeditor4-react' {
    import { Component } from 'react';
    
    interface CKEditorProps {
        id?: string;
        editor: any;
        config?: any;
        data?: string;
        onChange?: (event: any, editor: any) => void;
        onReady?: (editor: any) => void;
        onBlur?: (event: any, editor: any) => void;
        onFocus?: (event: any, editor: any) => void;
    }
    
    export default class CKEditor extends Component<CKEditorProps> {}
}

declare module 'ckeditor4' {
    export const ClassicEditor: any;
    export default any;
}
