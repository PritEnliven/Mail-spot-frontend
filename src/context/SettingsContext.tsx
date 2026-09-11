import { getSettings } from '@services/settings/settingsService';
import { getActiveAccountId } from '@services/apiService';
import { useAccount } from '@context/AccountContext';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface ShortCutType {
  id: string;
  name: string;
  key: string;
  defaultValue: string;
}

export interface SettingsType {
  undoSendPeriod: number;
  shortcuts: ShortCutType[];
  pageSize: number;
  markAsReadDelay: number;
  enableSignature: boolean;
  enableReplyForwardUse: boolean;
  threadView: boolean;
  notification: boolean;
  recoveryEmail: string;
  downloadLocation: string;
}

interface SettingsContextType {
  settings: SettingsType;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<SettingsType>) => void;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SettingsType = {
  undoSendPeriod: 30,
  markAsReadDelay: 0,
  shortcuts: [

  ],
  pageSize: 25,
  enableSignature: true,
  enableReplyForwardUse: true,
  threadView: true,
  downloadLocation: '',
  notification: true,
  recoveryEmail: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const normalizeShortcuts = (raw: any): ShortCutType[] => {
  if (Array.isArray(raw) && raw.length > 0) {
    const apiMap = new Map<string, string>(
      raw.map((sc: any) => [sc?.id, typeof sc?.key === 'string' ? sc.key : ''])
    );
    return defaultSettings.shortcuts.map(sc => ({
      ...sc,
      key: apiMap.has(sc.id) ? (apiMap.get(sc.id) ?? '') : sc.key,
    }));
  }
  return defaultSettings.shortcuts;
};

const normalizeSettings = (raw: any): SettingsType => {
  return {
    undoSendPeriod: typeof raw?.undoSendPeriod === 'number' ? raw.undoSendPeriod : defaultSettings.undoSendPeriod,
    markAsReadDelay: typeof raw?.markAsReadDelay === 'number' ? raw.markAsReadDelay : defaultSettings.markAsReadDelay,
    shortcuts: normalizeShortcuts(raw?.shortCuts),
    pageSize: typeof raw?.pageSize === 'number'
      ? raw.pageSize
      : (typeof raw?.maximumPageSize === 'number'
        ? raw.maximumPageSize
        : defaultSettings.pageSize),
    enableSignature: typeof raw?.enableSignature === 'boolean' ? raw.enableSignature : defaultSettings.enableSignature,
    enableReplyForwardUse: typeof raw?.enableReplyForwardUse === 'boolean' ? raw.enableReplyForwardUse : defaultSettings.enableReplyForwardUse,
    threadView: typeof raw?.threadView === 'boolean' ? raw.threadView : true,
    downloadLocation: typeof raw?.downloadLocation === 'string' ? raw.downloadLocation : defaultSettings.downloadLocation,
    notification: typeof raw?.notification === 'boolean' ? raw.notification : defaultSettings.notification,
    recoveryEmail: typeof raw?.recoveryEmail === 'string' ? raw.recoveryEmail : defaultSettings.recoveryEmail,
  };
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { activeAccountId } = useAccount();
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refreshSettings = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const accountIdAtStart = getActiveAccountId();

    try {
      setLoading(true);
      setError(null);
      const response = await getSettings();
      if (requestId !== requestIdRef.current) return;
      if (accountIdAtStart !== getActiveAccountId()) return;

      if (response?.data) {
        setSettings(normalizeSettings(response.data));
      } else {
        setSettings(defaultSettings);
        setError(response?.message || 'Failed to load settings');
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setSettings(defaultSettings);
      setError('Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    requestIdRef.current += 1;
    setSettings(defaultSettings);
    setError(null);
    void refreshSettings();
  }, [activeAccountId, refreshSettings]);

  const updateSettings = useCallback((newSettings: Partial<SettingsType>) => {
    setSettings(prev => prev ? { ...prev, ...newSettings } : { ...defaultSettings, ...newSettings });
  }, []);

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
