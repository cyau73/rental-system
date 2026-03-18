// lib/formatters.ts

// Helper to remove just commas (needed for currency validation)
export const stripCommas = (val: string) => val.toString().replace(/,/g, "");

// Helper to remove both for database storage
export const stripCommasAndDashes = (val: string) => val.toString().replace(/[,\-]/g, "");

export const formatCurrency = (val: any) => {
    if (val === undefined || val === null || val === "") return "";
    const num = val.toString().replace(/,/g, "");
    // Ensure we don't return "NaN" if the input is messy
    return isNaN(Number(num)) ? "" : Number(num).toLocaleString('en-US');
};

export const isValidNumber = (val: string) => {
    const raw = stripCommas(val);
    return !isNaN(Number(raw)) || raw === "";
};

export const formatMobile = (val: string) => {
    const digits = val.replace(/\D/g, "");

    // Malaysian Format handling
    if (digits.length <= 3) return digits;

    // For 10-digit numbers (012-345-6789)
    if (digits.length <= 10) {
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // For 11-digit numbers (011-1234-5678)
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

export const copyToClipboard = async (text: string) => {
    if (!text) return false;
    // Keep emails as-is, but strip formatting from phone numbers for dialing/pasting
    const cleanText = text.includes('@') ? text.trim() : text.replace(/\D/g, "");
    try {
        await navigator.clipboard.writeText(cleanText);
        return true;
    } catch (err) {
        console.error("Failed to copy!", err);
        return false;
    }
};