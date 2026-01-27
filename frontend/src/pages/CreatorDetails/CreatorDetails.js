import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeason } from '../../context/SeasonContext';
import SeasonSelector from '../../components/SeasonSelector';
import '../../css/Mainpages/CreatorDetail.css';

function CreatorDetail() {
  const { season, year } = useSeason();
  const [showForm, setShowForm] = useState(false);
  const [language, setLanguage] = useState('en');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [filterSeason, setFilterSeason] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDay, setFilterDay] = useState('');
  
  // Season and Year states
  // Removed - now using context
  
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
  const [showHistory, setShowHistory] = useState(false);
  
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

  // Refetch latest entry when season or year changes
  useEffect(() => {
    if (season && year) {
      fetchLastEntry();
    }
  }, [season, year]);

  const checkAuthentication = () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login', { replace: true });
    }
  };

  const fetchLastEntry = async () => {
    try {
      let url = `${API_BASE_URL}/creator-details/latest`;
      
      // Add season and year parameters if available
      if (season && year) {
        url += `?season=${encodeURIComponent(season)}&year=${encodeURIComponent(year)}`;
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
        setLastEntry(data);
      } else if (response.status === 404) {
        // No entry found for this season/year combination
        setLastEntry(null);
      }
    } catch (error) {
      console.error('Error fetching last entry:', error);
    }
  };

  const fetchHistoryEntries = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/creator-details/history?`;
      
      const params = [];
      if (filterSeason) params.push(`season=${encodeURIComponent(filterSeason)}`);
      if (filterYear) params.push(`year=${encodeURIComponent(filterYear)}`);
      if (filterDay) params.push(`day=${encodeURIComponent(filterDay)}`);
      
      if (params.length > 0) {
        url += params.join('&');
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

  const saveEntryToDatabase = async (entryData, entryId = null) => {
    try {
      const id = entryId || editingId;
      const method = id ? 'PUT' : 'POST';
      const url = id 
        ? `${API_BASE_URL}/creator-details/${id}` 
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
    if (!season || !year) {
      alert(t('Please select Season and Year', 'பருவம் மற்றும் ஆண்டு தேர்ந்தெடுக்கவும்'));
      return;
    }

    setLoading(true);
    
    // Check if entry exists for this season and year
    let existingEntryId = editingId;
    if (!existingEntryId && lastEntry && lastEntry.season === season && lastEntry.year === parseInt(year)) {
      existingEntryId = lastEntry._id || lastEntry.id;
    }
    
    const entryData = {
      season,
      year,
      seedDate: seedDate || null,
      seedWeight: seedWeight || null,
      seedCost: seedCost || null,
      seedingCount: seedingCount || null,
      peopleCount: peopleCount || null,
      moneyPerPerson: moneyPerPerson || null,
      totalSeedingCost: totalSeedingCost || null,
      seedingTakers: seedingTakers.length > 0 ? seedingTakers : null,
      plantingDate: plantingDate || null,
      workers: workers.length > 0 ? workers : null,
      createdAt: existingEntryId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Saving entry:', entryData);
    const success = await saveEntryToDatabase(entryData, existingEntryId);
    
    if (success) {
      alert(t('Saved successfully!', 'வெற்றிகரமாக சேமிக்கப்பட்டது!'));
      await fetchLastEntry();
    } else {
      alert(t('Failed to save. Please try again.', 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'));
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    // Season and year are not reset - they persist across forms
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
    // Season and year are set in context, not in form
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
      }
    }
  };

  const handleAddSeedingTaker = () => {
    if (!seedingPerson || !seedingTakenCount) return;
    setSeedingTakers([
      ...seedingTakers,
      {
        name: seedingPerson,
        taken: parseInt(seedingTakenCount),
        money: seedingPersonMoney ? parseInt(seedingPersonMoney) : 0,
      },
    ]);
    setSeedingPerson('');
    setSeedingTakenCount('');
    setSeedingPersonMoney('');
  };

  const handleAddWorker = () => {
    if (!workerName) return;
    setWorkers([
      ...workers,
      {
        name: workerName,
        moneyGiven,
        cost: costPerPerson ? parseInt(costPerPerson) : 0,
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
      
      <p><strong>{t('Season:', 'பருவம்:')}</strong> {entry.season}</p>
      <p><strong>{t('Year:', 'ஆண்டு:')}</strong> {entry.year}</p>
      {entry.seedDate && <p><strong>{t('Date:', 'நாள்:')}</strong> {formatDate(entry.seedDate)}</p>}
      {entry.seedWeight && <p><strong>{t('Seed Weight:', 'விதை எடை:')}</strong> {entry.seedWeight} kg</p>}
      {entry.seedCost && <p><strong>{t('Seed Cost:', 'விதை செலவு:')}</strong> ₹ {entry.seedCost}</p>}
      {entry.seedingCount && <p><strong>{t('Seedings:', 'விதைப்புகள்:')}</strong> {entry.seedingCount}</p>}
      {entry.peopleCount && <p><strong>{t('People Involved:', 'சேர்ந்தவர்கள்:')}</strong> {entry.peopleCount}</p>}

      {entry.seedingTakers && entry.seedingTakers.length > 0 && (
        <>
          <p><strong>{t('Seeding Takers:', 'விதைப்புகளை எடுத்தவர்கள்:')}</strong></p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
            {entry.seedingTakers.map((taker, i) => (
              <div key={i} className="taker-card" style={{flex: '0 0 calc(33.333% - 10px)', minWidth: '150px'}}>
                <p> {taker.name}</p>
                <p>{t('Seedings Taken:', 'விதைப்புகள்:')} {taker.taken}</p>
                <p>{t('Money:', 'தொகை:')} ₹ {taker.money}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {entry.workers && entry.workers.length > 0 && (
        <>
          <p><strong>{t('Planted Workers:', 'நட்ட நபர்கள்:')}</strong></p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
            {entry.workers.map((w, i) => (
              <div key={i} className="taker-card" style={{flex: '0 0 calc(33.333% - 10px)', minWidth: '150px'}}>
                <p> {w.name}</p>
                <p>{t('Money Given:', 'கொடுக்கப்பட்டதா:')} {w.moneyGiven === 'yes' ? t('Yes', 'ஆம்') : t('No', 'இல்லை')}</p>
                <p>{t('Cost:', 'செலவு:')} ₹ {w.cost}</p>
              </div>
            ))}
          </div>
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
        <h1>{t('Creator Detail', 'உருவாக்குநர் விவரம்')}</h1>
        <div className="top-actions">
          <button className="toggle-btn" onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')} style={{background: 'blue'}}>
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
          <button className="review-btn" onClick={() => navigate('/review')}>
             {t('Review', 'மதிப்பாய்வு')}
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
        
        <button className="history-button" onClick={() => navigate('/CreatorHistory')} disabled={loading}>
           {t('View History', 'வரலாற்றைப் பார்க்க')}
        </button>
      </div>

      <SeasonSelector language={language} t={t} />

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

          <button onClick={handleAddOrUpdateEntry} disabled={loading} className="save-button" style={{marginTop: '20px'}}>
            {loading} {t('Save Seed Sowing', 'விதைப்பு சேமிக்க')}
          </button>

          <hr style={{margin: '30px 0', border: '1px solid #ddd'}} />

          <div className="taking-seeding-inline">
            <h4>{t('Taking Seeding', 'விதைப்புகளை எடுத்தல்')}</h4>
            <label>{t('Name of Person:', 'நபரின் பெயர்:')}</label>
            <input value={seedingPerson} onChange={(e) => setSeedingPerson(e.target.value)} />

            <label>{t('Number of Seedings Taken:', 'எடுத்த விதைப்புகள்:')}</label>
            <input type="number" value={seedingTakenCount} onChange={(e) => setSeedingTakenCount(e.target.value)} />

            <label>{t('Money Given (₹):', 'கொடுக்கப்பட்ட தொகை (₹):')}</label>
            <input type="number" value={seedingPersonMoney} onChange={(e) => setSeedingPersonMoney(e.target.value)} />

            <button onClick={handleAddSeedingTaker}> {t('Add Person', 'நபரை சேர்க்க')}</button>

            <button onClick={handleAddOrUpdateEntry} disabled={loading} className="save-button" style={{marginTop: '20px'}}>
              {loading } {t('Save Taking Seeding', 'விதைப்பு எடுத்தல் சேமிக்க')}
            </button>

            <div className="seeding-takers-list">
              {seedingTakers.map((person, index) => (
                <div key={index} className="taker-card">
                  <p> <strong>{person.name}</strong></p>
                  <p>{t('Seedings Taken:', 'விதைப்புகள்:')} {person.taken}</p>
                  <p>{t('Money:', 'தொகை:')} ₹ {person.money}</p>
                  <div className="entry-actions">
                    <button onClick={() => {
                      setSeedingPerson(person.name);
                      setSeedingTakenCount(person.taken);
                      setSeedingPersonMoney(person.money);
                      setSeedingTakers(seedingTakers.filter((_, i) => i !== index));
                    }}> {t('Edit', 'திருத்த')}</button>
                    <button onClick={() => setSeedingTakers(seedingTakers.filter((_, i) => i !== index))}> {t('Delete', 'அழிக்க')}</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="seeding-summary">
              <p><strong>{t('Total Seedings Taken:', 'மொத்த எடுத்தல்:')}</strong> {totalSeedingsTaken}</p>
              <p><strong>{t('Total Money for Seedings:', 'மொத்த செலவு:')}</strong> ₹ {totalMoneyForSeedings}</p>
            </div>
          </div>

          <hr style={{margin: '30px 0', border: '1px solid #ddd'}} />

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

            <button onClick={handleAddOrUpdateEntry} disabled={loading} className="save-button" style={{marginTop: '20px'}}>
              {loading} {t('Save Planted Cost', 'நட்ட கூலி சேமிக்க')}
            </button>

            <div className="worker-list">
              {workers.map((worker, i) => (
                <div key={i} className="taker-card">
                  <p> {worker.name}</p>
                  <p>{t('Money Given:', 'கூலி வழங்கப்பட்டது:')} {worker.moneyGiven === 'yes' ? t('Yes', 'ஆம்') : t('No', 'இல்லை')}</p>
                  <p>{t('Cost:', 'செலவு:')} ₹ {worker.cost}</p>
                  <div className="entry-actions">
                    <button onClick={() => {
                      setWorkerName(worker.name);
                      setMoneyGiven(worker.moneyGiven);
                      setCostPerPerson(worker.cost);
                      setWorkers(workers.filter((_, idx) => idx !== i));
                    }}> {t('Edit', 'திருத்த')}</button>
                    <button onClick={() => setWorkers(workers.filter((_, idx) => idx !== i))}> {t('Delete', 'அழிக்க')}</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="planting-summary">
              <p><strong>{t('Total Workers:', 'மொத்த நபர்கள்:')}</strong> {workers.length}</p>
              <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹ {workers.reduce((sum, w) => sum + parseInt(w.cost || 0), 0)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="last-entry-section">
        <h2> {season && year 
          ? t(`Latest Entry for ${season} ${year}`, `${season} ${year} இன் சமீபத்திய பதிவு`)
          : t('Latest Entry', 'சமீபத்திய பதிவு')
        }</h2>
        {lastEntry ? (
          renderEntry(lastEntry, true)
        ) : (
          <p className="no-entries">
            {season && year 
              ? t(`No entries found for ${season} ${year}.`, `${season} ${year} க்கு எந்த பதிவும் இல்லை.`)
              : t('No entries yet.', 'எந்த பதிவும் இல்லை.')
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default CreatorDetail;