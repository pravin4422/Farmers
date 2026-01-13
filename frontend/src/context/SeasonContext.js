import React, { createContext, useState, useContext, useEffect } from 'react';

const SeasonContext = createContext();

export const SeasonProvider = ({ children }) => {
  const [season, setSeason] = useState(() => localStorage.getItem('season') || '');
  const [year, setYear] = useState(() => localStorage.getItem('year') || '');

  useEffect(() => {
    if (season) localStorage.setItem('season', season);
  }, [season]);

  useEffect(() => {
    if (year) localStorage.setItem('year', year);
  }, [year]);

  return (
    <SeasonContext.Provider value={{ season, setSeason, year, setYear }}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within SeasonProvider');
  }
  return context;
};
