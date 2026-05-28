import { createContext, useContext, useState, type ReactNode } from 'react';

type ModalType = 'changePassword' | 'userDetails' | 'deleteConfirmation' | 'loginAsUser';

export interface ActiveModal {
    id: string;
    type: ModalType;
    props?: any;
}

interface AdminUIType {
    activeModals: ActiveModal[];
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    openModal: (type: ModalType, props?: any) => string;
    closeModal: (id?: string) => void;
}

const AdminUIContext = createContext<AdminUIType | undefined>(undefined);

export const useAdminUI = () => {
    const ctx = useContext(AdminUIContext);
    if (!ctx) throw new Error('useAdminUI must be used inside AdminUIProvider');
    return ctx;
};

interface AdminUIProviderProps {
    children: ReactNode;
}

export const AdminUIProvider = ({ children }: AdminUIProviderProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeModals, setActiveModals] = useState<ActiveModal[]>([]);
    
    // Debug logs
    const openModal = (type: ModalType, props?: any) => {
        const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setActiveModals(prev => {
            // Check if a modal of this type is already open
            const existingModalIndex = prev.findIndex(modal => modal.type === type);

            // If it's already open, don't add a new one
            if (existingModalIndex >= 0) {
                // If you want to bring it to front, you can move it to the end
                const updatedModals = [...prev];
                const [existingModal] = updatedModals.splice(existingModalIndex, 1);
                return [...updatedModals, existingModal];
            }

            // Otherwise, add the new modal
            return [
                ...prev,
                {
                    id: modalId,
                    type,
                    props,
                },
            ];
        });
        return modalId;
    };

    const closeModal = (id?: string) => {
        setActiveModals(prev => {
            if (!id) {
                return prev.slice(0, -1);
            }
            return prev.filter(modal => modal.id !== id);
        });
    };

    const value = {
        activeModals,
        isLoading,
        setIsLoading,
        openModal,
        closeModal,
    };

    return (
        <AdminUIContext.Provider value={value}>
            {children}
        </AdminUIContext.Provider>
    );
};
