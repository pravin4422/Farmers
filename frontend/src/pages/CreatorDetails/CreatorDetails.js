import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Mainpages/CreatorDetail.css';

function CreatorDetail() {
  const [showForm, setShowForm] = useState(false);
  const [language, setLanguage] = useState('en');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [showHistory, setShowHistory] = useState(false);
  const [filterType, setFilterType] = useState('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Form states
  const [seedDate, setSeedDate] = useState('');
  const [seedWeight, setSeedWeight] = useState('');
  const [seedCost, setSeedCost] = useState('');
  const [seedingCount, setSeedingCount] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [moneyPerPerson, setMoneyPerPerson] = useState('');
  
  // Data states
  const [lastEntry, setLastEntry] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  
  // Seeding taker states
  const [seedingTakers, setSeedingTakers] = useState([]);
  const [seedingPerson, setSeedingPerson] = useState('');
  const [seedingTakenCount, setSeedingTakenCount] = useState('');
  const [seedingPersonMoney, setSeedingPersonMoney] = useState('');
  
  // Worker states
  const [plantingDate, setPlantingDate] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [moneyGiven, setMoneyGiven] = useState('yes');
  const [costPerPerson, setCostPerPerson] = useState('');
  const [workers, setWorkers] = useState([]);

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
    checkAuthentication();
    fetchLastEntry();
    
    // Handle edit from history page
    if (window.history.state?.usr?.editEntry) {
      const entry = window.history.state.usr.editEntry;
      handleEdit(entry);
    }
  }, []);

  // ✅ Silent authentication check - no alert
  const checkAuthentication = () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login', { replace: true });
    }
  };

  // ✅ Fetch with silent redirect on auth failure
  const fetchLastEntry = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/creator-details/latest`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setLastEntry(data);
      }
    } catch (error) {
      console.error('Error fetching last entry:', error);
    }
  };

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

  const saveEntryToDatabase = async (entryData) => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${API_BASE_URL}/creator-details/${editingId}` 
        : `${API_BASE_URL}/creator-details`;
      
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(entryData),
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return false;
      }
      
      if (response.ok) {
        const savedEntry = await response.json();
        setLastEntry(savedEntry);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      return false;
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
      
      if (response.ok) {
        return true;
      } else {
        throw new Error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      return false;
    }
  };

  const totalSeedingCost = peopleCount && moneyPerPerson ? parseInt(peopleCount) * parseInt(moneyPerPerson) : 0;
  const totalSeedingsTaken = seedingTakers.reduce((sum, p) => sum + p.taken, 0);
  const totalMoneyForSeedings = seedingTakers.reduce((sum, p) => sum + p.money, 0);

  const handleAddOrUpdateEntry = async () => {
    if (!seedDate) {
      return;
    }

    setLoading(true);
    
    const entryData = {
      seedDate,
      seedWeight,
      seedCost,
      seedingCount,
      peopleCount,
      moneyPerPerson,
      totalSeedingCost,
      seedingTakers,
      plantingDate,
      workers,
      createdAt: editingId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = await saveEntryToDatabase(entryData);
    
    if (success) {
      resetForm();
      setShowForm(false);
      setEditingIndex(null);
      setEditingId(null);
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setSeedDate('');
    setSeedWeight('');
    setSeedCost('');
    setSeedingCount('');
    setPeopleCount('');
    setMoneyPerPerson('');
    setSeedingTakers([]);
    setPlantingDate('');
    setWorkers([]);
  };

  const handleEdit = (entry) => {
    setSeedDate(entry.seedDate);
    setSeedWeight(entry.seedWeight);
    setSeedCost(entry.seedCost);
    setSeedingCount(entry.seedingCount);
    setPeopleCount(entry.peopleCount);
    setMoneyPerPerson(entry.moneyPerPerson);
    setSeedingTakers(entry.seedingTakers || []);
    setPlantingDate(entry.plantingDate || '');
    setWorkers(entry.workers || []);
    setShowForm(true);
    setEditingId(entry._id || entry.id);
  };

  const handleDelete = async (entryId) => {
    if (window.confirm(t('Are you sure you want to delete this entry?', 'இந்த பதிவை அழிக்க வேண்டுமா?'))) {
      const success = await deleteEntryFromDatabase(entryId);
      if (success) {
        if (lastEntry && (lastEntry.id === entryId || lastEntry._id === entryId)) {
          fetchLastEntry();
        }
        if (showHistory) {
          fetchHistoryEntries();
        }
      }
    }
  };

  const handleAddSeedingTaker = () => {
    if (!seedingPerson || !seedingTakenCount || !seedingPersonMoney) return;
    setSeedingTakers([
      ...seedingTakers,
      {
        name: seedingPerson,
        taken: parseInt(seedingTakenCount),
        money: parseInt(seedingPersonMoney),
      },
    ]);
    setSeedingPerson('');
    setSeedingTakenCount('');
    setSeedingPersonMoney('');
  };

  const handleAddWorker = () => {
    if (!workerName || !costPerPerson) return;
    setWorkers([
      ...workers,
      {
        name: workerName,
        moneyGiven,
        cost: parseInt(costPerPerson),
      },
    ]);
    setWorkerName('');
    setMoneyGiven('yes');
    setCostPerPerson('');
  };

  const handleViewHistory = () => {
    navigate('/CreatorHistory');
  };

  const handleFilterChange = () => {
    if (showHistory) {
      fetchHistoryEntries();
    }
  };

  const t = (en, ta) => (language === 'ta' ? ta : en);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderEntry = (entry, isLast = false) => (
    <div key={entry._id || entry.id} className={`entry-card ${isLast ? 'last-entry' : ''}`}>
      {isLast && <div className="last-entry-badge">{t('Latest Entry', 'சமீபத்திய பதிவு')}</div>}
      
      <p><strong>{t('Date:', 'நாள்:')}</strong> {formatDate(entry.seedDate)}</p>
      <p><strong>{t('Seed Weight:', 'விதை எடை:')}</strong> {entry.seedWeight} kg</p>
      <p><strong>{t('Seed Cost:', 'விதை செலவு:')}</strong> ₹ {entry.seedCost}</p>
      <p><strong>{t('Seedings:', 'விதைப்புகள்:')}</strong> {entry.seedingCount}</p>
      <p><strong>{t('People Involved:', 'சேர்ந்தவர்கள்:')}</strong> {entry.peopleCount}</p>

      {entry.seedingTakers && entry.seedingTakers.length > 0 && (
        <>
          <p><strong>{t('Seeding Takers:', 'விதைப்புகளை எடுத்தவர்கள்:')}</strong></p>
          {entry.seedingTakers.map((taker, i) => (
            <div key={i} className="taker-card">
              <p>👤 {taker.name}</p>
              <p>{t('Seedings Taken:', 'விதைப்புகள்:')} {taker.taken}</p>
              <p>{t('Money:', 'தொகை:')} ₹ {taker.money}</p>
            </div>
          ))}
        </>
      )}

      {entry.workers && entry.workers.length > 0 && (
        <>
          <p><strong>{t('Planted Workers:', 'நட்ட நபர்கள்:')}</strong></p>
          {entry.workers.map((w, i) => (
            <div key={i} className="taker-card">
              <p> {w.name}</p>
              <p>{t('Money Given:', 'கொடுக்கப்பட்டதா:')} {w.moneyGiven === 'yes' ? t('Yes', 'ஆம்') : t('No', 'இல்லை')}</p>
              <p>{t('Cost:', 'செலவு:')} ₹ {w.cost}</p>
            </div>
          ))}
          <p><strong>{t('Total Workers:', 'மொத்த நபர்கள்:')}</strong> {entry.workers.length}</p>
          <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹ {entry.workers.reduce((sum, w) => sum + parseInt(w.cost || 0), 0)}</p>
        </>
      )}

      <div className="entry-actions">
        <button onClick={() => handleEdit(entry)} disabled={loading}>
           {t('Edit', 'திருத்த')}
        </button>
        <button onClick={() => handleDelete(entry._id || entry.id)} disabled={loading}>
           {t('Delete', 'அழிக்க')}
        </button>
      </div>
      
      {entry.createdAt && (
        <p className="entry-timestamp">
          {t('Created:', 'உருவாக்கப்பட்டது:')} {formatDate(entry.createdAt)}
          {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
            <span> | {t('Updated:', 'புதுப்பிக்கப்பட்டது:')} {formatDate(entry.updatedAt)}</span>
          )}
        </p>
      )}
    </div>
  );

  return (
    <div className="creator-detail-container">
      <div className="top-bar">
        <h1>🌾 {t('Creator Detail', 'உருவாக்குநர் விவரம்')}</h1>
        <div className="top-actions">
          <button className="toggle-btn" onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}>
             {t('தமிழ்', 'English')}
          </button>
          <button className="print-btn" onClick={() => window.print()}>
             {t('Print', 'அச்சிடுக')}
          </button>
          <button className="tracker-btn" onClick={() => navigate('/tractor')}>
             {t('Tracker', 'டிராக்டர்')}
          </button>
          <button className="agromedical-btn" onClick={() => navigate('/agromedicalproducts')}>
             {t('Agromedical Products', 'வேளாண் மருத்துவ பொருட்கள்')}
          </button>
          <button className="cultivating-btn" onClick={() => navigate('/cultivatingfield')}>
             {t('Cultivating Field', 'வயல் உழுது')}
          </button>
        </div>
      </div>

      <div className="action-buttons">
        <button className="add-button" onClick={() => {
          setShowForm(!showForm);
          setEditingIndex(null);
          setEditingId(null);
          resetForm();
        }} disabled={loading}>
          {showForm ? t('Cancel', 'ரத்துசெய்') : t(' Add Entry', ' பதிவை சேர்க்க')}
        </button>
        
        <button className="history-button" onClick={handleViewHistory} disabled={loading}>
           {showHistory ? t('Hide History', 'வரலாற்றை மறைக்க') : t('View History', 'வரலாற்றைப் பார்க்க')}
        </button>
      </div>

      {showForm && (
        <div className="entry-form">
          <h2> {t('Seed Sowing Details', 'விதை விதைக்கும் விவரம்')}</h2>

          <label>{t('Date of Sowing:', 'விதைத்த நாள்')}</label>
          <input type="date" value={seedDate} onChange={(e) => setSeedDate(e.target.value)} />

          <label>{t('Seed Weight (kg):', 'விதையின் எடை (கி.கி):')}</label>
          <input type="number" value={seedWeight} onChange={(e) => setSeedWeight(e.target.value)} />

          <label>{t('Cost of Seed (₹):', 'விதையின் செலவு (₹):')}</label>
          <input type="number" value={seedCost} onChange={(e) => setSeedCost(e.target.value)} />

          <label>{t('Number of Seedings:', 'விதைப்புகளின் எண்ணிக்கை:')}</label>
          <input type="number" value={seedingCount} onChange={(e) => setSeedingCount(e.target.value)} />

          <label>{t('People for Seeding:', 'விதைக்கும் மக்கள்:')}</label>
          <input type="number" value={peopleCount} onChange={(e) => setPeopleCount(e.target.value)} />

          <label>{t('Money per Person (₹):', 'ஒருவருக்கு செலவு (₹):')}</label>
          <input type="number" value={moneyPerPerson} onChange={(e) => setMoneyPerPerson(e.target.value)} />

          <div className="taking-seeding-inline">
            <h4>{t('Taking Seeding', 'விதைப்புகளை எடுத்தல்')}</h4>
            <label>{t('Name of Person:', 'நபரின் பெயர்:')}</label>
            <input value={seedingPerson} onChange={(e) => setSeedingPerson(e.target.value)} />

            <label>{t('Number of Seedings Taken:', 'எடுத்த விதைப்புகள்:')}</label>
            <input type="number" value={seedingTakenCount} onChange={(e) => setSeedingTakenCount(e.target.value)} />

            <label>{t('Money Given (₹):', 'கொடுக்கப்பட்ட தொகை (₹):')}</label>
            <input type="number" value={seedingPersonMoney} onChange={(e) => setSeedingPersonMoney(e.target.value)} />

            <button onClick={handleAddSeedingTaker}> {t('Add Person', 'நபரை சேர்க்க')}</button>

            <div className="seeding-takers-list">
              {seedingTakers.map((person, index) => (
                <div key={index} className="taker-card">
                  <p> <strong>{person.name}</strong></p>
                  <p>{t('Seedings Taken:', 'விதைப்புகள்:')} {person.taken}</p>
                  <p>{t('Money:', 'தொகை:')} ₹ {person.money}</p>
                </div>
              ))}
            </div>

            <div className="seeding-summary">
              <p><strong>{t('Total Seedings Taken:', 'மொத்த எடுத்தல்:')}</strong> {totalSeedingsTaken}</p>
              <p><strong>{t('Total Money for Seedings:', 'மொத்த செலவு:')}</strong> ₹ {totalMoneyForSeedings}</p>
            </div>
          </div>

          <div className="planting-section">
            <h4> {t('Planted Cost (Natta Kooli)', 'நட்ட கூலி')}</h4>
            <label>{t('Planting Date:', 'நட்ட தேதி:')}</label>
            <input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} />

            <label>{t('Name of Worker:', 'வேலை செய்யும் நபர்:')}</label>
            <input value={workerName} onChange={(e) => setWorkerName(e.target.value)} />

            <label>{t('Money Given?', 'கூலி வழங்கப்பட்டதா?')}</label>
            <select value={moneyGiven} onChange={(e) => setMoneyGiven(e.target.value)}>
              <option value="yes">{t('Yes', 'ஆம்')}</option>
              <option value="no">{t('No', 'இல்லை')}</option>
            </select>

            <label>{t('Cost per Person (₹):', 'ஒருவர் கூலி (₹):')}</label>
            <input type="number" value={costPerPerson} onChange={(e) => setCostPerPerson(e.target.value)} />

            <button onClick={handleAddWorker}> {t('Add Worker', 'நபரை சேர்க்க')}</button>

            <div className="worker-list">
              {workers.map((worker, i) => (
                <div key={i} className="taker-card">
                  <p> {worker.name}</p>
                  <p>{t('Money Given:', 'கூலி வழங்கப்பட்டது:')} {worker.moneyGiven === 'yes' ? t('Yes', 'ஆம்') : t('No', 'இல்லை')}</p>
                  <p>{t('Cost:', 'செலவு:')} ₹ {worker.cost}</p>
                </div>
              ))}
            </div>

            <div className="planting-summary">
              <p><strong>{t('Total Workers:', 'மொத்த நபர்கள்:')}</strong> {workers.length}</p>
              <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹ {workers.reduce((sum, w) => sum + parseInt(w.cost || 0), 0)}</p>
            </div>
          </div>

          <button onClick={handleAddOrUpdateEntry} disabled={loading} className="save-button">
            {loading ? '⏳' : '✅'} {editingId ? t('Update Entry', 'பதிவை புதுப்பிக்க') : t('Save Entry', 'பதிவை சேமிக்க')}
          </button>
        </div>
      )}

      <div className="last-entry-section">
        <h2> {t('Latest Entry', 'சமீபத்திய பதிவு')}</h2>
        {lastEntry ? (
          renderEntry(lastEntry, true)
        ) : (
          <p className="no-entries">{t('No entries yet.', 'எந்த பதிவும் இல்லை.')}</p>
        )}
      </div>

      {showHistory && (
        <div className="history-section">
          <div className="filter-controls">
            <h3> {t('History Filter', 'வரலாற்று வடிப்பு')}</h3>
            
            <div className="filter-type-selection">
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
              <button onClick={handleFilterChange} disabled={loading}>
                 {t('Search', 'தேடல்')}
              </button>
            </div>
          </div>

          <div className="history-entries">
            <h3>{t('History Entries', 'வரலாற்று பதிவுகள்')}</h3>
            {loading ? (
              <p> {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
            ) : historyEntries.length === 0 ? (
              <p className="no-entries">{t('No entries found for the selected filter.', 'தேர்ந்தெடுக்கப்பட்ட வடிப்புக்கு எந்த பதிவும் இல்லை.')}</p>
            ) : (
              historyEntries.map(entry => renderEntry(entry))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorDetail;