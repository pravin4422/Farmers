import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../CSS/Mainpages/Tractor.css';

function Tractor() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  
  const t = (en, ta) => (language === 'ta' ? ta : en);

  // Tractor form states
  const [date, setDate] = useState('');
  const [day, setDay] = useState('');
  const [work, setWork] = useState('');
  const [tractorName, setTractorName] = useState('');
  const [timeSegments, setTimeSegments] = useState([{ period: 'Morning', hours: '' }]);
  const [rate, setRate] = useState('');
  const [moneyGiven, setMoneyGiven] = useState('Okay');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Kamitty form states
  const [numBags, setNumBags] = useState('');
  const [costPerBag, setCostPerBag] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [kamittyCost, setKamittyCost] = useState(0);
  const [kamittyDate, setKamittyDate] = useState('');
  const [kamittyDescription, setKamittyDescription] = useState('');
  const [editingKamittyId, setEditingKamittyId] = useState(null);

  // Data states
  const [lastTractorEntry, setLastTractorEntry] = useState(null);
  const [lastKamittyEntry, setLastKamittyEntry] = useState(null);
  const [historyTractorEntries, setHistoryTractorEntries] = useState([]);
  const [historyKamittyEntries, setHistoryKamittyEntries] = useState([]);

  // History filter states
  const [showTractorHistory, setShowTractorHistory] = useState(false);
  const [showKamittyHistory, setShowKamittyHistory] = useState(false);
  const [tractorFilterType, setTractorFilterType] = useState('date');
  const [kamittyFilterType, setKamittyFilterType] = useState('date');
  const [tractorSelectedDate, setTractorSelectedDate] = useState('');
  const [tractorSelectedMonth, setTractorSelectedMonth] = useState('');
  const [tractorSelectedYear, setTractorSelectedYear] = useState('');
  const [kamittySelectedDate, setKamittySelectedDate] = useState('');
  const [kamittySelectedMonth, setKamittySelectedMonth] = useState('');
  const [kamittySelectedYear, setKamittySelectedYear] = useState('');

  const recognitionRef = useRef(null);
  const [listeningField, setListeningField] = useState(null);

  // Database API endpoints - Replace with your actual API endpoints
  const API_BASE_URL = 'http://localhost:3001/api'; // Replace with your backend URL

  useEffect(() => {
    fetchLastEntries();
  }, []);

  useEffect(() => {
    const bagTotal = parseFloat(numBags || 0) * parseFloat(costPerBag || 0);
    const other = parseFloat(otherCost || 0);
    setKamittyCost(bagTotal + other);
  }, [numBags, costPerBag, otherCost]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        if (listeningField === 'day') setDay(transcript);
        else if (listeningField === 'work') setWork(transcript);
        else if (listeningField === 'tractorName') setTractorName(transcript);
        else if (listeningField === 'kamittyDescription') setKamittyDescription(transcript);
        setListeningField(null);
      };
      recognitionRef.current = recognition;
    }
  }, [language, listeningField]);

  // Fetch last entries from database
  const fetchLastEntries = async () => {
    try {
      const [tractorResponse, kamittyResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tractor/latest`),
        fetch(`${API_BASE_URL}/kamitty/latest`)
      ]);

      if (tractorResponse.ok) {
        const tractorData = await tractorResponse.json();
        setLastTractorEntry(tractorData);
      }

      if (kamittyResponse.ok) {
        const kamittyData = await kamittyResponse.json();
        setLastKamittyEntry(kamittyData);
      }
    } catch (error) {
      console.error('Error fetching last entries:', error);
    }
  };

  // Fetch history entries
  const fetchHistoryEntries = async (type) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/${type}/history?`;
      
      if (type === 'tractor') {
        if (tractorFilterType === 'date' && tractorSelectedDate) {
          url += `date=${tractorSelectedDate}`;
        } else if (tractorFilterType === 'month' && tractorSelectedMonth) {
          url += `month=${tractorSelectedMonth}`;
        } else if (tractorFilterType === 'year' && tractorSelectedYear) {
          url += `year=${tractorSelectedYear}`;
        }
      } else {
        if (kamittyFilterType === 'date' && kamittySelectedDate) {
          url += `date=${kamittySelectedDate}`;
        } else if (kamittyFilterType === 'month' && kamittySelectedMonth) {
          url += `month=${kamittySelectedMonth}`;
        } else if (kamittyFilterType === 'year' && kamittySelectedYear) {
          url += `year=${kamittySelectedYear}`;
        }
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (type === 'tractor') {
          setHistoryTractorEntries(data);
        } else {
          setHistoryKamittyEntries(data);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} history entries:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Save tractor entry to database
  const saveTractorEntryToDatabase = async (entryData) => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${API_BASE_URL}/tractor/${editingId}` 
        : `${API_BASE_URL}/tractor`;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      
      if (response.ok) {
        const savedEntry = await response.json();
        setLastTractorEntry(savedEntry);
        return true;
      } else {
        throw new Error('Failed to save tractor entry');
      }
    } catch (error) {
      console.error('Error saving tractor entry:', error);
      alert(t('Error saving entry. Please try again.', 'பதிவை சேமிப்பதில் பிழை. மீண்டும் முயற்சிக்கவும்.'));
      return false;
    }
  };

  // Save kamitty entry to database
  const saveKamittyEntryToDatabase = async (entryData) => {
    try {
      const method = editingKamittyId ? 'PUT' : 'POST';
      const url = editingKamittyId 
        ? `${API_BASE_URL}/kamitty/${editingKamittyId}` 
        : `${API_BASE_URL}/kamitty`;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      
      if (response.ok) {
        const savedEntry = await response.json();
        setLastKamittyEntry(savedEntry);
        return true;
      } else {
        throw new Error('Failed to save kamitty entry');
      }
    } catch (error) {
      console.error('Error saving kamitty entry:', error);
      alert(t('Error saving entry. Please try again.', 'பதிவை சேமிப்பதில் பிழை. மீண்டும் முயற்சிக்கவும்.'));
      return false;
    }
  };

  // Delete entry from database
  const deleteEntryFromDatabase = async (type, entryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}/${entryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        return true;
      } else {
        throw new Error(`Failed to delete ${type} entry`);
      }
    } catch (error) {
      console.error(`Error deleting ${type} entry:`, error);
      alert(t('Error deleting entry. Please try again.', 'பதிவை அழிப்பதில் பிழை. மீண்டும் முயற்சிக்கவும்.'));
      return false;
    }
  };

  const startListening = (field) => {
    if (recognitionRef.current) {
      setListeningField(field);
      recognitionRef.current.start();
    } else {
      alert('Voice input not supported in this browser.');
    }
  };

  const handleSegmentChange = (index, key, value) => {
    const updated = [...timeSegments];
    updated[index][key] = value;
    setTimeSegments(updated);
  };

  const addTimeSegment = () => {
    setTimeSegments([...timeSegments, { period: 'Morning', hours: '' }]);
  };

  const removeTimeSegment = (index) => {
    const updated = [...timeSegments];
    updated.splice(index, 1);
    setTimeSegments(updated);
  };

  const resetTractorForm = () => {
    setDate('');
    setDay('');
    setWork('');
    setTractorName('');
    setTimeSegments([{ period: 'Morning', hours: '' }]);
    setRate('');
    setMoneyGiven('Okay');
  };

  const resetKamittyForm = () => {
    setKamittyDate('');
    setKamittyDescription('');
    setNumBags('');
    setCostPerBag('');
    setOtherCost('');
    setKamittyCost(0);
  };

  const handleAddEntry = async () => {
    if (!date || !day || !work || !tractorName || timeSegments.some(s => !s.hours) || !rate) {
      alert(t('Please fill in all fields.', 'அனைத்து புலங்களும் நிரப்பவும்.'));
      return;
    }

    setLoading(true);

    const totalHours = timeSegments.reduce((acc, s) => acc + parseFloat(s.hours || 0), 0);
    const total = totalHours * parseFloat(rate);

    const entryData = {
      date,
      day,
      work,
      tractorName,
      timeSegments,
      totalHours: totalHours.toFixed(2),
      rate: parseFloat(rate),
      total: total.toFixed(2),
      moneyGiven,
      createdAt: editingId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = await saveTractorEntryToDatabase(entryData);
    
    if (success) {
      resetTractorForm();
      setEditingIndex(null);
      setEditingId(null);
    }

    setLoading(false);
  };

  const handleAddKamittyEntry = async () => {
    if (!kamittyDate || (!numBags && !otherCost)) {
      alert(t('Please fill in date and at least one cost field.', 'தேதி மற்றும் குறைந்தது ஒரு செலவு புலத்தை நிரப்பவும்.'));
      return;
    }

    setLoading(true);

    const entryData = {
      date: kamittyDate,
      description: kamittyDescription || t('Kamitty Entry', 'கமிட்டி பதிவு'),
      numBags: numBags || '0',
      costPerBag: costPerBag || '0',
      otherCost: otherCost || '0',
      totalKamitty: kamittyCost.toFixed(2),
      createdAt: editingKamittyId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = await saveKamittyEntryToDatabase(entryData);
    
    if (success) {
      resetKamittyForm();
      setEditingKamittyId(null);
    }

    setLoading(false);
  };

  const handleEdit = (entry, type) => {
    if (type === 'tractor') {
      setDate(entry.date);
      setDay(entry.day);
      setWork(entry.work);
      setTractorName(entry.tractorName);
      setTimeSegments(entry.timeSegments);
      setRate(entry.rate);
      setMoneyGiven(entry.moneyGiven);
      setEditingId(entry.id);
    } else {
      setKamittyDate(entry.date);
      setKamittyDescription(entry.description);
      setNumBags(entry.numBags);
      setCostPerBag(entry.costPerBag);
      setOtherCost(entry.otherCost);
      setEditingKamittyId(entry.id);
    }
  };

  const handleDelete = async (entryId, type) => {
    if (window.confirm(t('Are you sure you want to delete this entry?', 'இந்த பதிவை அழிக்க வேண்டுமா?'))) {
      const success = await deleteEntryFromDatabase(type, entryId);
      if (success) {
        if (type === 'tractor') {
          if (lastTractorEntry && lastTractorEntry.id === entryId) {
            fetchLastEntries(); // Refresh last entry
          }
          if (showTractorHistory) {
            fetchHistoryEntries('tractor'); // Refresh history if showing
          }
        } else {
          if (lastKamittyEntry && lastKamittyEntry.id === entryId) {
            fetchLastEntries(); // Refresh last entry
          }
          if (showKamittyHistory) {
            fetchHistoryEntries('kamitty'); // Refresh history if showing
          }
        }
      }
    }
  };

  const toggleMoneyGiven = async (entry) => {
    const updatedEntry = {
      ...entry,
      moneyGiven: entry.moneyGiven === 'Okay' ? 'Not' : 'Okay',
      updatedAt: new Date().toISOString()
    };

    setLoading(true);
    const success = await saveTractorEntryToDatabase(updatedEntry);
    if (success && showTractorHistory) {
      fetchHistoryEntries('tractor');
    }
    setLoading(false);
  };

  const handleViewHistory = (type) => {
    if (type === 'tractor') {
      setShowTractorHistory(!showTractorHistory);
      if (!showTractorHistory) {
        fetchHistoryEntries('tractor');
      }
    } else {
      setShowKamittyHistory(!showKamittyHistory);
      if (!showKamittyHistory) {
        fetchHistoryEntries('kamitty');
      }
    }
  };

  const handleFilterChange = (type) => {
    fetchHistoryEntries(type);
  };

  const handleExportCSV = () => {
    const tractorEntries = showTractorHistory ? historyTractorEntries : (lastTractorEntry ? [lastTractorEntry] : []);
    const kamittyEntries = showKamittyHistory ? historyKamittyEntries : (lastKamittyEntry ? [lastKamittyEntry] : []);

    if (tractorEntries.length === 0 && kamittyEntries.length === 0) {
      alert(t('No entries to export.', 'ஏற்றுமதி செய்ய பதிவுகள் இல்லை.'));
      return;
    }
    
    let csvContent = '';
    
    // Tractor entries
    if (tractorEntries.length > 0) {
      const tractorHeader = ['Type', 'Date', 'Day', 'Work', 'Tractor', 'Time Segments', 'Total Hours', 'Rate/hr (₹)', 'Total (₹)', 'Money Given'];
      const tractorRows = tractorEntries.map(entry => [
        'Tractor',
        entry.date,
        entry.day,
        entry.work,
        entry.tractorName,
        entry.timeSegments.map(s => `${s.period}: ${s.hours}h`).join(' | '),
        entry.totalHours,
        entry.rate,
        entry.total,
        entry.moneyGiven
      ]);
      csvContent += [tractorHeader, ...tractorRows].map(e => e.join(",")).join("\n");
    }
    
    // Kamitty entries
    if (kamittyEntries.length > 0) {
      if (csvContent) csvContent += "\n\n";
      const kamittyHeader = ['Type', 'Date', 'Description', 'Number of Bags', 'Cost per Bag', 'Other Cost', 'Total Kamitty Cost'];
      const kamittyRows = kamittyEntries.map(entry => [
        'Kamitty',
        entry.date,
        entry.description,
        entry.numBags,
        entry.costPerBag,
        entry.otherCost,
        entry.totalKamitty
      ]);
      csvContent += [kamittyHeader, ...kamittyRows].map(e => e.join(",")).join("\n");
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tractor_kamitty_entries.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTotals = () => {
    const tractorEntries = showTractorHistory ? historyTractorEntries : (lastTractorEntry ? [lastTractorEntry] : []);
    const kamittyEntries = showKamittyHistory ? historyKamittyEntries : (lastKamittyEntry ? [lastKamittyEntry] : []);
    
    const totalTractorCost = tractorEntries.reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
    const totalKamittyCost = kamittyEntries.reduce((acc, curr) => acc + parseFloat(curr.totalKamitty || 0), 0);
    const grandTotal = totalTractorCost + totalKamittyCost;

    return { totalTractorCost, totalKamittyCost, grandTotal };
  };

  const { totalTractorCost, totalKamittyCost, grandTotal } = calculateTotals();

  const renderTractorEntry = (entry, isLast = false) => (
    <div key={entry.id} className={`entry-card ${isLast ? 'last-entry' : ''}`}>
      {isLast && <div className="last-entry-badge">{t('Latest Entry', 'சமீபத்திய பதிவு')}</div>}
      
      <div className="entry-header">
        <h4>🚜 {entry.tractorName}</h4>
        <span className={`status-badge ${entry.moneyGiven === 'Okay' ? 'paid' : 'pending'}`}>
          {entry.moneyGiven === 'Okay' ? t('Paid', 'பணம் கொடுத்தது') : t('Pending', 'நிலுவை')}
        </span>
      </div>
      
      <div className="entry-details">
        <p><strong>{t('Date:', 'தேதி:')}</strong> {formatDate(entry.date)}</p>
        <p><strong>{t('Day:', 'நாள்:')}</strong> {entry.day}</p>
        <p><strong>{t('Work:', 'பணி:')}</strong> {entry.work}</p>
        <p><strong>{t('Time Slots:', 'நேரங்கள்:')}</strong> {entry.timeSegments.map(s => `${s.period}: ${s.hours}h`).join(', ')}</p>
        <p><strong>{t('Total Hours:', 'மொத்த மணி:')}</strong> {entry.totalHours}</p>
        <p><strong>{t('Rate/hr:', 'ஒருமணி விலை:')}</strong> ₹{entry.rate}</p>
        <p><strong>{t('Total:', 'மொத்தம்:')}</strong> ₹{entry.total}</p>
      </div>

      <div className="entry-actions">
        <button onClick={() => handleEdit(entry, 'tractor')} disabled={loading}>
          ✏️ {t('Edit', 'திருத்த')}
        </button>
        <button onClick={() => toggleMoneyGiven(entry)} disabled={loading} className="toggle-money-btn">
          💰 {t('Toggle Payment', 'பணம் மாற்று')}
        </button>
        <button onClick={() => handleDelete(entry.id, 'tractor')} disabled={loading}>
          🗑️ {t('Delete', 'அழிக்க')}
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

  const renderKamittyEntry = (entry, isLast = false) => (
    <div key={entry.id} className={`entry-card kamitty-entry ${isLast ? 'last-entry' : ''}`}>
      {isLast && <div className="last-entry-badge">{t('Latest Entry', 'சமீபத்திய பதிவு')}</div>}
      
      <div className="entry-header">
        <h4>🧾 {entry.description}</h4>
        <span className="cost-badge">₹{entry.totalKamitty}</span>
      </div>
      
      <div className="entry-details">
        <p><strong>{t('Date:', 'தேதி:')}</strong> {formatDate(entry.date)}</p>
        <p><strong>{t('Number of Bags:', 'பைகளின் எண்ணிக்கை:')}</strong> {entry.numBags}</p>
        <p><strong>{t('Cost per Bag:', 'ஒரு பையின் விலை:')}</strong> ₹{entry.costPerBag}</p>
        <p><strong>{t('Other Cost:', 'பிற செலவு:')}</strong> ₹{entry.otherCost}</p>
        <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹{entry.totalKamitty}</p>
      </div>

      <div className="entry-actions">
        <button onClick={() => handleEdit(entry, 'kamitty')} disabled={loading}>
          ✏️ {t('Edit', 'திருத்த')}
        </button>
        <button onClick={() => handleDelete(entry.id, 'kamitty')} disabled={loading}>
          🗑️ {t('Delete', 'அழிக்க')}
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
    <div className="tracker-container">
      <div className="language-toggle">
        <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>
          English
        </button>
        <button onClick={() => setLanguage('ta')} className={language === 'ta' ? 'active' : ''}>
          தமிழ்
        </button>
      </div>

      <h1>🚜 {t('Tractor Tracker', 'டிராக்டர் ட்ராக்கர்')}</h1>

      {/* Tractor Entry Form */}
      <div className="form-container">
        <h2>{t('Tractor Entry', 'டிராக்டர் பதிவு')}</h2>
        <div className="form-grid">
          <label>
            {t('Date:', 'தேதி:')} 
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          
          <label>
            {t('Day:', 'நாள்:')} 
            <div className="input-with-voice">
              <input type="text" value={day} onChange={e => setDay(e.target.value)} />
              <button type="button" onClick={() => startListening('day')} className="voice-btn">🎤</button>
            </div>
          </label>
          
          <label>
            {t('Work Name:', 'பணியின் பெயர்:')} 
            <div className="input-with-voice">
              <input type="text" value={work} onChange={e => setWork(e.target.value)} />
              <button type="button" onClick={() => startListening('work')} className="voice-btn">🎤</button>
            </div>
          </label>
          
          <label>
            {t('Tractor Name:', 'டிராக்டர் பெயர்:')} 
            <div className="input-with-voice">
              <input type="text" value={tractorName} onChange={e => setTractorName(e.target.value)} />
              <button type="button" onClick={() => startListening('tractorName')} className="voice-btn">🎤</button>
            </div>
          </label>
        </div>

        <div className="time-segment-group">
          <label>{t('Time Segments (e.g. Morning, Evening):', 'நேரம் பிரிவுகள்:')}</label>
          {timeSegments.map((segment, index) => (
            <div key={index} className="segment-row">
              <select value={segment.period} onChange={e => handleSegmentChange(index, 'period', e.target.value)}>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
              <input 
                type="number" 
                placeholder={t('Hours', 'மணி')} 
                value={segment.hours} 
                onChange={e => handleSegmentChange(index, 'hours', e.target.value)} 
              />
              {index > 0 && (
                <button onClick={() => removeTimeSegment(index)} className="remove-segment-btn">➖</button>
              )}
            </div>
          ))}
          <button onClick={addTimeSegment} className="add-segment-btn">➕ {t('Add Time Slot', 'நேரம் சேர்க்க')}</button>
        </div>

        <div className="form-grid">
          <label>
            {t('Price per Hour (₹):', 'ஒருமணி விலை (₹):')} 
            <input type="number" value={rate} onChange={e => setRate(e.target.value)} />
          </label>
          
          <label>
            {t('Money Given?', 'பணம் கொடுக்கப்பட்டது?')} 
            <select value={moneyGiven} onChange={e => setMoneyGiven(e.target.value)}>
              <option value="Okay">{t('Okay', 'சரி')}</option>
              <option value="Not">{t('Not', 'இல்லை')}</option>
            </select>
          </label>
        </div>

        <button 
          className="add-btn" 
          onClick={handleAddEntry} 
          disabled={loading}
        >
          {loading ? '⏳' : (editingId ? '✅' : '➕')} {editingId ? t('Update Entry', 'பதிவை புதுப்பிக்க') : t('Add Tractor Entry', 'டிராக்டர் பதிவை சேர்க்க')}
        </button>
      </div>

      {/* Kamitty Entry Form */}
      <div className="form-container kamitty-form">
        <h2>🧾 {t('Kamitty Entry', 'கமிட்டி பதிவு')}</h2>
        <div className="form-grid">
          <label>
            {t('Date:', 'தேதி:')} 
            <input type="date" value={kamittyDate} onChange={e => setKamittyDate(e.target.value)} />
          </label>
          
          <label>
            {t('Description:', 'விவரம்:')} 
            <div className="input-with-voice">
              <input 
                type="text" 
                value={kamittyDescription} 
                onChange={e => setKamittyDescription(e.target.value)} 
                placeholder={t('Optional description', 'விருப்ப விவரம்')} 
              />
              <button type="button" onClick={() => startListening('kamittyDescription')} className="voice-btn">🎤</button>
            </div>
          </label>
        </div>
        
        <div className="kamitty-section">
          <div className="form-grid">
            <label>
              {t('Number of Bags', 'பைகளின் எண்ணிக்கை')}: 
              <input type="number" value={numBags} onChange={e => setNumBags(e.target.value)} />
            </label>
            
            <label>
              {t('Cost per Bag (₹)', 'ஒரு பையின் விலை (₹)')}: 
              <input type="number" value={costPerBag} onChange={e => setCostPerBag(e.target.value)} />
            </label>
            
            <label>
              {t('Other Cost (₹)', 'பிற செலவுகள் (₹)')}: 
              <input type="number" value={otherCost} onChange={e => setOtherCost(e.target.value)} />
            </label>
          </div>
          
          <p className="kamitty-total">
            {t('Total Kamitty Cost', 'மொத்த கமிட்டி செலவு')}: ₹{kamittyCost.toFixed(2)}
          </p>
        </div>

        <button 
          className="add-btn kamitty-add-btn" 
          onClick={handleAddKamittyEntry}
          disabled={loading}
        >
          {loading ? '⏳' : (editingKamittyId ? '✅' : '➕')} {editingKamittyId ? t('Update Entry', 'பதிவை புதுப்பிக்க') : t('Add Kamitty Entry', 'கமிட்டி பதிவை சேர்க்க')}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="history-btn" onClick={() => handleViewHistory('tractor')} disabled={loading}>
          📊 {showTractorHistory ? t('Hide Tractor History', 'டிராக்டர் வரலாற்றை மறைக்க') : t('View Tractor History', 'டிராக்டர் வரலாற்றைப் பார்க்க')}
        </button>
        
        <button className="history-btn" onClick={() => handleViewHistory('kamitty')} disabled={loading}>
          📊 {showKamittyHistory ? t('Hide Kamitty History', 'கமிட்டி வரலாற்றை மறைக்க') : t('View Kamitty History', 'கமிட்டி வரலாற்றைப் பார்க்க')}
        </button>
        
        <button className="export-btn" onClick={handleExportCSV} disabled={loading}>
          📤 {t('Export CSV', 'CSV ஏற்றுமதி')}
        </button>
      </div>

      {/* Latest Tractor Entry */}
      <div className="latest-entries-section">
        <h2>🚜 {t('Latest Tractor Entry', 'சமீபத்திய டிராக்டர் பதிவு')}</h2>
        {lastTractorEntry ? (
          renderTractorEntry(lastTractorEntry, true)
        ) : (
          <p className="no-entries">{t('No tractor entries yet.', 'ஏதாவது டிராக்டர் பதிவுகள் இல்லை.')}</p>
        )}
      </div>

      {/* Latest Kamitty Entry */}
      <div className="latest-entries-section">
        <h2>🧾 {t('Latest Kamitty Entry', 'சமீபத்திய கமிட்டி பதிவு')}</h2>
        {lastKamittyEntry ? (
          renderKamittyEntry(lastKamittyEntry, true)
        ) : (
          <p className="no-entries">{t('No kamitty entries yet.', 'ஏதாவது கமிட்டி பதிவுகள் இல்லை.')}</p>
        )}
      </div>

      {/* Tractor History Section */}
      {showTractorHistory && (
        <div className="history-section">
          <div className="filter-controls">
            <h3>📊 {t('Tractor History Filter', 'டிராக்டர் வரலாற்று வடிப்பு')}</h3>
            
            <div className="filter-type-selection">
              <label>
                <input 
                  type="radio" 
                  value="date" 
                  checked={tractorFilterType === 'date'} 
                  onChange={(e) => setTractorFilterType(e.target.value)} 
                />
                {t('By Date', 'தேதி வாரியாக')}
              </label>
              <label>
                <input 
                  type="radio" 
                  value="month" 
                  checked={tractorFilterType === 'month'} 
                  onChange={(e) => setTractorFilterType(e.target.value)} 
                />
                {t('By Month', 'மாதம் வாரியாக')}
              </label>
              <label>
                <input 
                  type="radio" 
                  value="year" 
                  checked={tractorFilterType === 'year'} 
                  onChange={(e) => setTractorFilterType(e.target.value)} 
                />
                {t('By Year', 'ஆண்டு வாரியாக')}
              </label>
            </div>

            <div className="filter-inputs">
              {tractorFilterType === 'date' && (
                <input 
                  type="date" 
                  value={tractorSelectedDate} 
                  onChange={(e) => setTractorSelectedDate(e.target.value)} 
                />
              )}
              {tractorFilterType === 'month' && (
                <input 
                  type="month" 
                  value={tractorSelectedMonth} 
                  onChange={(e) => setTractorSelectedMonth(e.target.value)} 
                />
              )}
              {tractorFilterType === 'year' && (
                <input 
                  type="number" 
                  placeholder={t('Year', 'ஆண்டு')}
                  value={tractorSelectedYear} 
                  onChange={(e) => setTractorSelectedYear(e.target.value)}
                  min="2020"
                  max={new Date().getFullYear()}
                />
              )}
              <button onClick={() => handleFilterChange('tractor')} disabled={loading}>
                🔍 {t('Search', 'தேடல்')}
              </button>
            </div>
          </div>

          <div className="history-entries">
            <h3>{t('Tractor History Entries', 'டிராக்டர் வரலாற்று பதிவுகள்')}</h3>
            {loading ? (
              <p>⏳ {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
            ) : historyTractorEntries.length === 0 ? (
              <p className="no-entries">{t('No entries found for the selected filter.', 'தேர்ந்தெடுக்கப்பட்ட வடிப்புக்கு எந்த பதிவும் இல்லை.')}</p>
            ) : (
              <div className="entries-grid">
                {historyTractorEntries.map(entry => renderTractorEntry(entry))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kamitty History Section */}
      {showKamittyHistory && (
        <div className="history-section">
          <div className="filter-controls">
            <h3>📊 {t('Kamitty History Filter', 'கமிட்டி வரலாற்று வடிப்பு')}</h3>
            
            <div className="filter-type-selection">
              <label>
                <input 
                  type="radio" 
                  value="date" 
                  checked={kamittyFilterType === 'date'} 
                  onChange={(e) => setKamittyFilterType(e.target.value)} 
                />
                {t('By Date', 'தேதி வாரியாக')}
              </label>
              <label>
                <input 
                  type="radio" 
                  value="month" 
                  checked={kamittyFilterType === 'month'} 
                  onChange={(e) => setKamittyFilterType(e.target.value)} 
                />
                {t('By Month', 'மாதம் வாரியாக')}
              </label>
              <label>
                <input 
                  type="radio" 
                  value="year" 
                  checked={kamittyFilterType === 'year'} 
                  onChange={(e) => setKamittyFilterType(e.target.value)} 
                />
                {t('By Year', 'ஆண்டு வாரியாக')}
              </label>
            </div>

            <div className="filter-inputs">
              {kamittyFilterType === 'date' && (
                <input 
                  type="date" 
                  value={kamittySelectedDate} 
                  onChange={(e) => setKamittySelectedDate(e.target.value)} 
                />
              )}
              {kamittyFilterType === 'month' && (
                <input 
                  type="month" 
                  value={kamittySelectedMonth} 
                  onChange={(e) => setKamittySelectedMonth(e.target.value)} 
                />
              )}
              {kamittyFilterType === 'year' && (
                <input 
                  type="number" 
                  placeholder={t('Year', 'ஆண்டு')}
                  value={kamittySelectedYear} 
                  onChange={(e) => setKamittySelectedYear(e.target.value)}
                  min="2020"
                  max={new Date().getFullYear()}
                />
              )}
              <button onClick={() => handleFilterChange('kamitty')} disabled={loading}>
                🔍 {t('Search', 'தேடல்')}
              </button>
            </div>
          </div>

          <div className="history-entries">
            <h3>{t('Kamitty History Entries', 'கமிட்டி வரலாற்று பதிவுகள்')}</h3>
            {loading ? (
              <p>⏳ {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
            ) : historyKamittyEntries.length === 0 ? (
              <p className="no-entries">{t('No entries found for the selected filter.', 'தேர்ந்தெடுக்கப்பட்ட வடிப்புக்கு எந்த பதிவும் இல்லை.')}</p>
            ) : (
              <div className="entries-grid">
                {historyKamittyEntries.map(entry => renderKamittyEntry(entry))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total Summary */}
      <div className="total-summary">
        <h3>{t('Summary', 'சுருக்கம்')}</h3>
        <div className="summary-grid">
          <div className="summary-card tractor-summary">
            <h4>🚜 {t('Tractor Cost', 'டிராக்டர் செலவு')}</h4>
            <p className="amount">₹{totalTractorCost.toFixed(2)}</p>
          </div>
          <div className="summary-card kamitty-summary">
            <h4>🧾 {t('Kamitty Cost', 'கமிட்டி செலவு')}</h4>
            <p className="amount">₹{totalKamittyCost.toFixed(2)}</p>
          </div>
          <div className="summary-card total-summary-card">
            <h4>{t('Grand Total', 'மொத்த செலவு')}</h4>
            <p className="grand-total">₹{grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate(-1)}>
        🔙 {t('Go Back', 'பின்செல்')}
      </button>
    </div>
  );
}

export default Tractor;