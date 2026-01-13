import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Mainpages/CreatorHistory.css';

function CreatorHistory() {
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [filterSeason, setFilterSeason] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [activeTab, setActiveTab] = useState('creator');
  const [historyEntries, setHistoryEntries] = useState([]);
  const [tractorEntries, setTractorEntries] = useState([]);
  const [productEntries, setProductEntries] = useState([]);
  const [cultivationEntries, setCultivationEntries] = useState([]);
  const [kamittyEntries, setKamittyEntries] = useState([]);
  const [reviewEntries, setReviewEntries] = useState([]);

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
      const params = [];
      if (filterSeason) params.push(`season=${encodeURIComponent(filterSeason)}`);
      if (filterYear) params.push(`year=${encodeURIComponent(filterYear)}`);
      if (filterDay) params.push(`day=${encodeURIComponent(filterDay)}`);
      
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      
      // Fetch all module data
      const [creatorRes, tractorRes, productRes, cultivationRes, kamittyRes, expiriesRes, problemsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/creator-details/history${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/tractor${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/products${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/cultivation-activities${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/kamitty${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/expiries${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/problems${queryString}`, { headers: getAuthHeaders() })
      ]);
      
      if (creatorRes.ok) setHistoryEntries(await creatorRes.json());
      if (tractorRes.ok) setTractorEntries(await tractorRes.json());
      if (productRes.ok) setProductEntries(await productRes.json());
      if (cultivationRes.ok) setCultivationEntries(await cultivationRes.json());
      if (kamittyRes.ok) setKamittyEntries(await kamittyRes.json());
      
      const expiries = expiriesRes.ok ? await expiriesRes.json() : [];
      const problems = problemsRes.ok ? await problemsRes.json() : [];
      setReviewEntries([...expiries, ...problems]);
      
    } catch (error) {
      console.error('Error fetching entries:', error);
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

  const renderCreatorEntries = () => (
    historyEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season">🌾 {entry.season} {entry.year}</span>
          {entry.seedDate && <span className="entry-date">📅 {formatDate(entry.seedDate)}</span>}
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Seed Weight:', 'விதை எடை:')}</strong> {entry.seedWeight} kg</p>
          <p><strong>{t('Seed Cost:', 'விதை செலவு:')}</strong> ₹{entry.seedCost}</p>
          <p><strong>{t('Seedings:', 'விதைப்புகள்:')}</strong> {entry.seedingCount}</p>
          <p><strong>{t('People:', 'மக்கள்:')}</strong> {entry.peopleCount}</p>
        </div>

        <div className="entry-actions">
          <button onClick={() => handleEdit(entry)}>✏️ {t('Edit', 'திருத்த')}</button>
          <button onClick={() => handleDelete(entry._id || entry.id)}>🗑️ {t('Delete', 'அழிக்க')}</button>
        </div>
      </div>
    ))
  );

  const renderTractorEntries = () => (
    tractorEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season">🚜 {entry.season} {entry.year}</span>
          <span className="entry-date">📅 {formatDate(entry.date)}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Work:', 'வேலை:')}</strong> {entry.work}</p>
          <p><strong>{t('Tractor:', 'டிராக்டர்:')}</strong> {entry.tractorName}</p>
          <p><strong>{t('Total Hours:', 'மொத்த மணி:')}</strong> {entry.totalHours}</p>
          <p><strong>{t('Rate:', 'விலை:')}</strong> ₹{entry.rate}</p>
          <p><strong>{t('Total:', 'மொத்தம்:')}</strong> ₹{entry.total}</p>
        </div>
      </div>
    ))
  );

  const renderProductEntries = () => (
    productEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season">🧪 {entry.season} {entry.year}</span>
          <span className="entry-date">📅 {entry.date}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Product:', 'பொருள்:')}</strong> {entry.name}</p>
          <p><strong>{t('Quantity:', 'அளவு:')}</strong> {entry.quantity}</p>
          <p><strong>{t('Cost:', 'விலை:')}</strong> ₹{entry.cost}</p>
          <p><strong>{t('Total:', 'மொத்தம்:')}</strong> ₹{entry.total}</p>
        </div>
      </div>
    ))
  );

  const renderCultivationEntries = () => (
    cultivationEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season">🌱 {entry.season} {entry.year}</span>
          <span className="entry-date">📅 {entry.date}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Title:', 'தலைப்பு:')}</strong> {entry.title}</p>
          <p><strong>{t('Note:', 'குறிப்பு:')}</strong> {entry.note}</p>
          {entry.driver && <p><strong>{t('Driver:', 'ஓட்டுநர்:')}</strong> {entry.driver}</p>}
          {entry.totalHours && <p><strong>{t('Hours:', 'மணி:')}</strong> {entry.totalHours}</p>}
          {entry.total && <p><strong>{t('Total:', 'மொத்தம்:')}</strong> ₹{entry.total}</p>}
        </div>
      </div>
    ))
  );

  const renderKamittyEntries = () => (
    kamittyEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season">💰 {entry.season} {entry.year}</span>
          <span className="entry-date">📅 {entry.date}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Date:', 'தேதி:')}</strong> {entry.date}</p>
          <p><strong>{t('Created:', 'உருவாக்கப்பட்டது:')}</strong> {formatDate(entry.createdAt)}</p>
        </div>
      </div>
    ))
  );

  const renderReviewEntries = () => (
    reviewEntries.map(entry => {
      const isProblem = entry.description !== undefined;
      return (
        <div key={entry._id || entry.id} className={`entry-card ${isProblem ? 'problem-card' : ''}`}>
          <div className="entry-header">
            <span className="entry-season">
              {isProblem ? '🔴' : '🟢'} {entry.season} {entry.year}
            </span>
            <span className="entry-date">📅 {formatDate(entry.createdAt)}</span>
          </div>
          
          <div className="entry-details">
            {isProblem ? (
              <>
                <p><strong>{t('Type:', 'வகை:')}</strong> {t('Problem', 'பிரச்சனை')}</p>
                <p><strong>{t('Title:', 'தலைப்பு:')}</strong> {entry.title}</p>
                <p><strong>{t('Description:', 'விவரம்:')}</strong> {entry.description}</p>
              </>
            ) : (
              <>
                <p><strong>{t('Type:', 'வகை:')}</strong> {t('Solution', 'தீர்வு')}</p>
                <p><strong>{t('Product:', 'தயாரிப்பு:')}</strong> {entry.productName}</p>
                {entry.expiryDate && <p><strong>{t('Expiry Date:', 'காலாவதி தேதி:')}</strong> {formatDate(entry.expiryDate)}</p>}
                {entry.category && <p><strong>{t('Category:', 'வகை:')}</strong> {entry.category}</p>}
                {entry.notes && <p><strong>{t('Notes:', 'குறிப்புகள்:')}</strong> {entry.notes}</p>}
              </>
            )}
          </div>
        </div>
      );
    })
  );

  const getCurrentEntries = () => {
    switch(activeTab) {
      case 'creator': return historyEntries;
      case 'tractor': return tractorEntries;
      case 'products': return productEntries;
      case 'cultivation': return cultivationEntries;
      case 'kamitty': return kamittyEntries;
      case 'review': return reviewEntries;
      default: return [];
    }
  };

  const renderCurrentEntries = () => {
    switch(activeTab) {
      case 'creator': return renderCreatorEntries();
      case 'tractor': return renderTractorEntries();
      case 'products': return renderProductEntries();
      case 'cultivation': return renderCultivationEntries();
      case 'kamitty': return renderKamittyEntries();
      case 'review': return renderReviewEntries();
      default: return null;
    }
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
        
        <div className="filter-inputs">
          <select 
            value={filterSeason} 
            onChange={(e) => setFilterSeason(e.target.value)}
          >
            <option value="">{t('All Seasons', 'அனைத்து பருவங்கள்')}</option>
            <option value="Samba">Samba</option>
            <option value="Thaladi">Thaladi</option>
            <option value="Kuruvai">Kuruvai</option>
            <option value="Kharif">Kharif</option>
            <option value="Rabi">Rabi</option>
            <option value="Summer">Summer</option>
          </select>
          
          <input 
            type="number" 
            placeholder={t('Year', 'ஆண்டு')}
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
            min="2020"
            max={new Date().getFullYear() + 1}
          />
          
          <select 
            value={filterDay} 
            onChange={(e) => setFilterDay(e.target.value)}
          >
            <option value="">{t('All Days', 'அனைத்து நாட்கள்')}</option>
            <option value="Monday">{t('Monday', 'திங்கள்')}</option>
            <option value="Tuesday">{t('Tuesday', 'செவ்வாய்')}</option>
            <option value="Wednesday">{t('Wednesday', 'புதன்')}</option>
            <option value="Thursday">{t('Thursday', 'வியாழன்')}</option>
            <option value="Friday">{t('Friday', 'வெள்ளி')}</option>
            <option value="Saturday">{t('Saturday', 'சனி')}</option>
            <option value="Sunday">{t('Sunday', 'ஞாயிறு')}</option>
          </select>
          
          <button onClick={fetchHistoryEntries} disabled={loading}>
            🔍 {t('Search', 'தேடல்')}
          </button>
        </div>
      </div>

      <div className="results-section">
        <div className="tabs-section">
          <div className="tabs">
            <button 
              className={activeTab === 'creator' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('creator')}
            >
              🌾 {t('Seed Sowing', 'விதை விதைப்பு')}
            </button>
            <button 
              className={activeTab === 'tractor' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('tractor')}
            >
              🚜 {t('Tracker', 'டிராக்டர்')}
            </button>
            <button 
              className={activeTab === 'products' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('products')}
            >
              🧪 {t('Agromedical Products', 'வேளாண் மருத்துவ பொருட்கள்')}
            </button>
            <button 
              className={activeTab === 'cultivation' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('cultivation')}
            >
              🌱 {t('Cultivating Field', 'வயல் உழுது')}
            </button>
            <button 
              className={activeTab === 'kamitty' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('kamitty')}
            >
              💰 {t('Kamitty', 'கமிட்டி')}
            </button>
            <button 
              className={activeTab === 'review' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('review')}
            >
              📝 {t('Review History', 'மதிப்பாய்வு வரலாறு')}
            </button>
          </div>
        </div>
        
        <h3>{t('Results', 'முடிவுகள்')} ({getCurrentEntries().length})</h3>
        
        {loading ? (
          <p className="loading">⏳ {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
        ) : getCurrentEntries().length === 0 ? (
          <p className="no-results">{t('No entries found.', 'எந்த பதிவும் இல்லை.')}</p>
        ) : (
          <div className="entries-grid">
            {renderCurrentEntries()}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatorHistory;
