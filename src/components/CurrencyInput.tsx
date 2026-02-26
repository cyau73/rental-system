// src/components/CurrencyInput.tsx
"use client"; // <--- THIS IS CRITICAL

import React from 'react';

export default function CurrencyInput({ name, defaultValue, placeholder, className }: any) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digits and format with commas
        const digits = e.target.value.replace(/\D/g, "");
        e.target.value = digits ? Number(digits).toLocaleString() : "";
    };

    return (
        <input
            name={name}
            type="text"
            defaultValue={defaultValue}
            placeholder={placeholder}
            className={className}
            onChange={handleChange} // This is allowed here because this is a Client Component
        />
    );
}