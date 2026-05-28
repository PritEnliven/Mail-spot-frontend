import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.tsx';
import AppToast from '@components/ui/toast/ToastNotification.tsx';

import 'ckeditor5/ckeditor5.css';
import 'simplebar-react/dist/simplebar.min.css';
import 'flatpickr/dist/flatpickr.min.css';
import "flatpickr/dist/flatpickr.css";
import "flatpickr/dist/themes/material_green.css";

import "bootstrap/dist/css/bootstrap.min.css";
import 'react-tooltip/dist/react-tooltip.css';
import GlobalUIRoot from './GlobalUiRoot.tsx';
import "@styles/header-main-style.css";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <GlobalUIRoot />
        <App />
        <AppToast />
    </BrowserRouter>
)