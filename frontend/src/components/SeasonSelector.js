import React from 'react';
import { useSeason } from '../context/SeasonContext';
import '../css/SeasonSelector.css';

function SeasonSelector({ language, t }) {
  const { season, setSeason, year, setYear } = useSeason();

  return (
    <div className="season-selector">
      <div className="season-year-fields">
        <label>
          {t('Season:', 'பருவம்:')}
          <select value={season} onChange={(e) => setSeason(e.target.value)} required>
            <option value="">{t('Select Season', 'பருவத்தை தேர்ந்தெடுக்கவும்')}</option>
            <option value="Kuruvai">{t('Kuruvai (குறுவை)', 'குறுவை')}</option>
            <option value="Samba">{t('Samba (சம்பா)', 'சம்பா')}</option>
            <option value="Thaladi">{t('Thaladi (தாளடி)', 'தாளடி')}</option>
          </select>
        </label>

        <label>
          {t('Year:', 'ஆண்டு:')}
          <input 
            type="number" 
            value={year} 
            onChange={(e) => setYear(e.target.value)} 
            placeholder="2024" 
            min="2020" 
            max="2100" 
            required 
          />
        </label>
      </div>
      {season && year && (
        <div className="season-display">
          {t('Current:', 'தற்போதைய:')} <strong>{season} {year}</strong>
        </div>
      )}
    </div>
  );
}

export default SeasonSelector;
