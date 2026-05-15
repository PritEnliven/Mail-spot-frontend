import { getSettings } from '@services/settings/settingsService';
import { createContext, useContext, useState, useEffect } from 'react';

export interface SettingsType {
  undoSendPeriod: number;
  pageSize: number;
  enableSignature: boolean;
  enableReplyForwardUse: boolean;
  recoveryEmail: string;
}

interface SettingsContextType {
  settings: SettingsType;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<SettingsType>) => void;
}

const defaultSettings: SettingsType = {
  undoSendPeriod: 30,
  pageSize: 25,
  enableSignature: true,
  enableReplyForwardUse: true,
  recoveryEmail: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const normalizeSettings = (raw: any): SettingsType => {
  return {
    undoSendPeriod: typeof raw?.undoSendPeriod === 'number' ? raw.undoSendPeriod : defaultSettings.undoSendPeriod,
    pageSize: typeof raw?.pageSize === 'number'
      ? raw.pageSize
      : (typeof raw?.maximumPageSize === 'number'
        ? raw.maximumPageSize
        : defaultSettings.pageSize),
    enableSignature: typeof raw?.enableSignature === 'boolean' ? raw.enableSignature : defaultSettings.enableSignature,
    enableReplyForwardUse: typeof raw?.enableReplyForwardUse === 'boolean' ? raw.enableReplyForwardUse : defaultSettings.enableReplyForwardUse,
    recoveryEmail: typeof raw?.recoveryEmail === 'string' ? raw.recoveryEmail : defaultSettings.recoveryEmail,
  };
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await getSettings();
        setSettings(normalizeSettings(response.data));
      } catch (err) {
        setError('Failed to load settings');
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = (newSettings: Partial<SettingsType>) => {
    setSettings(prev => prev ? { ...prev, ...newSettings } : { ...defaultSettings, ...newSettings });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings
      }}
    >
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