import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const EXCHANGE_RATES = {
  USD: { rate: 1, symbol: '$' },
  INR: { rate: 83, symbol: '₹' },
  EUR: { rate: 0.92, symbol: '€' },
  GBP: { rate: 0.79, symbol: '£' }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('global_currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('global_currency', currency);
  }, [currency]);

  const formatCurrency = (amountInUSD, decimals = 2) => {
    if (amountInUSD === undefined || amountInUSD === null) return '';
    const rate = EXCHANGE_RATES[currency].rate;
    const symbol = EXCHANGE_RATES[currency].symbol;
    const converted = parseFloat(amountInUSD) * rate;
    return `${symbol}${converted.toFixed(decimals)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, EXCHANGE_RATES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
