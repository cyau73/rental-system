// src/lib/status-styles.ts

export type StatusTheme = {
    bg: string;
    text: string;
    border: string;
    label: string;
};

export const STATUS_THEMES: Record<string, StatusTheme> = {
    FOR_RENT: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-500',
        label: 'For Rent'
    },
    RENTED: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-600',
        label: 'Rented'
    },
    FOR_SALE: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-500',
        label: 'For Sale'
    },
    SOLD: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-600',
        label: 'Sold'
    },
    NOT_AVAILABLE: {
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        border: 'border-slate-400',
        label: 'Not Available'
    },
};

/**
 * Helper to get the theme safely with a fallback
 */
export const getStatusTheme = (status: string): StatusTheme => {
    return STATUS_THEMES[status] || {
        bg: 'bg-gray-50',
        text: 'text-black',
        border: 'border-gray-300',
        label: status ? status.replace(/_/g, ' ') : 'Unknown'
    };
};