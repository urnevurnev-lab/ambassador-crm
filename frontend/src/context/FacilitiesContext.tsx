import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export interface Facility {
    id: number;
    name: string;
    address: string;
    lat?: number;
    lng?: number;
}

interface FacilitiesContextType {
    facilities: Facility[];
    loading: boolean;
    refreshFacilities: () => Promise<void>;
}

const FacilitiesContext = createContext<FacilitiesContextType | undefined>(undefined);

export const FacilitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);

    const refreshFacilities = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/facilities');
            setFacilities(res.data);
            setLoaded(true);
        } catch (error) {
            console.error('Failed to load facilities', error);
        } finally {
            setLoading(false);
        }
    };

    // Load once on mount
    useEffect(() => {
        if (!loaded) {
            refreshFacilities();
        }
    }, [loaded]);

    return (
        <FacilitiesContext.Provider value={{ facilities, loading, refreshFacilities }}>
            {children}
        </FacilitiesContext.Provider>
    );
};

export const useFacilities = () => {
    const context = useContext(FacilitiesContext);
    if (!context) {
        throw new Error('useFacilities must be used within a FacilitiesProvider');
    }
    return context;
};
