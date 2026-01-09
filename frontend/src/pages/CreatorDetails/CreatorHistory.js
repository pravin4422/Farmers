import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Mainpages/CreatorHistory.css';

function CreatorHistory() {
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [historyEntries, setHistoryEntries] = useState([]);

  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5000/api';

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login', { replace: true });
    } else {
      fetchHistoryEntries();
    }
  }, []);

  const fetchHistoryEntries = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/creator-details/history?`;
      
      if (filterType === 'date' && selectedDate) {
        url += `date=${selectedDate}`;
      } else if (filterType === 'month' && selectedMonth) {
        url += `month=${selectedMonth}`;
      } else if (filterType === 'year' && selectedYear) {
        url += `year=${selectedYear}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setHistoryEntries(data);
      }
    } catch (error) {
      console.error('Error fetching history entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntryFromDatabase = async (entryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/creator-details/${entryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return false;
      }
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting entry:', error);
      return false;
    }
  };

  const handleDelete = async (entryId) => {
    if (window.confirm(t('Are you sure you want to delete this entry?', 'இந்த பதிவை அழிக்க வேண்டுமா?'))) {
      const success = await deleteEntryFromDatabase(entryId);
      if (success) {
        fetchHistoryEntries();
      }
    }
  };

  const handleEdit = (entry) => {
    navigate('/creator', { state: { editEntry: entry } });
  };

  const t = (en, ta) => (language === 'ta' ? ta : en);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="creator-history-container">
      <div className="history-header">
        <button className="back-btn" onClick={() => navigate('/creator')}>
          ← {t('Back', 'பின்செல்')}
        </button>
        <h1>📜 {t('Creator History', 'உருவாக்குநர் வரலாறு')}</h1>
        <button className="lang-toggle" onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}>
          {t('தமிழ்', 'English')}
        </button>
      </div>

      <div className="filter-section">
        <h3>{t('Filter History', 'வரலாற்றை வடிகட்டு')}</h3>
        
        <div className="filter-options">
          <label>
            <input 
              type="radio" 
              value="date" 
              checked={filterType === 'date'} 
              onChange={(e) => setFilterType(e.target.value)} 
            />
            {t('By Date', 'தேதி வாரியாக')}
          </label>
          <label>
            <input 
              type="radio" 
              value="month" 
              checked={filterType === 'month'} 
              onChange={(e) => setFilterType(e.target.value)} 
            />
            {t('By Month', 'மாதம் வாரியாக')}
          </label>
          <label>
            <input 
              type="radio" 
              value="year" 
              checked={filterType === 'year'} 
              onChange={(e) => setFilterType(e.target.value)} 
            />
            {t('By Year', 'ஆண்டு வாரியாக')}
          </label>
        </div>

        <div className="filter-inputs">
          {filterType === 'date' && (
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          )}
          {filterType === 'month' && (
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
            />
          )}
          {filterType === 'year' && (
            <input 
              type="number" 
              placeholder={t('Year', 'ஆண்டு')}
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              min="2020"
              max={new Date().getFullYear()}
            />
          )}
          <button onClick={fetchHistoryEntries} disabled={loading}>
            🔍 {t('Search', 'தேடல்')}
          </button>
        </div>
      </div>

      <div className="results-section">
        <h3>{t('Results', 'முடிவுகள்')} ({historyEntries.length})</h3>
        
        {loading ? (
          <p className="loading">⏳ {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
        ) : historyEntries.length === 0 ? (
          <p className="no-results">{t('No entries found.', 'எந்த பதிவும் இல்லை.')}</p>
        ) : (
          <div className="entries-grid">
            {historyEntries.map(entry => (
              <div key={entry._id || entry.id} className="entry-card">
                <div className="entry-header">
                  <span className="entry-date">📅 {formatDate(entry.seedDate)}</span>
                </div>
                
                <div className="entry-details">
                  <p><strong>{t('Seed Weight:', 'விதை எடை:')}</strong> {entry.seedWeight} kg</p>
                  <p><strong>{t('Seed Cost:', 'விதை செலவு:')}</strong> ₹{entry.seedCost}</p>
                  <p><strong>{t('Seedings:', 'விதைப்புகள்:')}</strong> {entry.seedingCount}</p>
                  <p><strong>{t('People:', 'மக்கள்:')}</strong> {entry.peopleCount}</p>

                  {entry.seedingTakers && entry.seedingTakers.length > 0 && (
                    <div className="sub-section">
                      <strong>{t('Seeding Takers:', 'விதைப்பு எடுத்தவர்கள்:')}</strong>
                      {entry.seedingTakers.map((taker, i) => (
                        <div key={i} className="mini-card">
                          👤 {taker.name} - {taker.taken} ({t('₹', '₹')}{taker.money})
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.workers && entry.workers.length > 0 && (
                    <div className="sub-section">
                      <strong>{t('Workers:', 'தொழிலாளர்கள்:')}</strong>
                      {entry.workers.map((w, i) => (
                        <div key={i} className="mini-card">
                          👷 {w.name} - ₹{w.cost}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="entry-actions">
                  <button onClick={() => handleEdit(entry)}>✏️ {t('Edit', 'திருத்த')}</button>
                  <button onClick={() => handleDelete(entry._id || entry.id)}>🗑️ {t('Delete', 'அழிக்க')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatorHistory;
