import './App.css';
import AppRoutes from '@routes/AppRoutes';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useParentHoverIconSwap } from "@hooks/useParentHoverIconSwap";
import { useNotifications } from '@hooks/useNotifications';
import { ScreenProvider } from '@context/ScreenContext';

function App() {
  const location = useLocation();
  useParentHoverIconSwap();
  useNotifications(); // Initialize notification permissions

  useEffect(() => {
    // Check if current route is calendar
    const isCalendarRoute = location.pathname.includes('/calendar') || location.pathname.includes('mail/calendar');
    const isSettingRoute = location.pathname.includes('/settings') || location.pathname.includes('mail/settings');

    let rootClass = 'INBOX-main';
    switch (true) {
      case isCalendarRoute:
        rootClass = 'Calendar-main';
        break;
      case isSettingRoute:
        rootClass = 'Settings-main';
        break;
      default:
        rootClass = 'INBOX-main';
        break;
    }

    // Update body class
    document.body.className = rootClass;
  }, [location.pathname]);

  return (
    <div className="App">
      <ScreenProvider>
        <AppRoutes />
      </ScreenProvider>
    </div>
  )
}

export default App
