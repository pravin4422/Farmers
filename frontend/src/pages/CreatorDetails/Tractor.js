import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeason } from '../../context/SeasonContext';
import '../../css/Mainpages/Tractor.css';


function Tractor() {
  const navigate = useNavigate();
  const { season, year } = useSeason();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  
  const t = (en, ta) => (language === 'ta' ? ta : en);

  const [date, setDate] = useState('');
  const [day, setDay] = useState('');
  const [work, setWork] = useState('');
  const [tractorName, setTractorName] = useState('');
  const [timeSegments, setTimeSegments] = useState([{ period: 'Morning', hours: '' }]);
  const [rate, setRate] = useState('');
  const [moneyGiven, setMoneyGiven] = useState('Okay');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [numBags, setNumBags] = useState('');
  const [costPerBag, setCostPerBag] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [kamittyCost, setKamittyCost] = useState(0);
  const [kamittyDate, setKamittyDate] = useState('');
  const [kamittyDescription, setKamittyDescription] = useState('');
  const [editingKamittyId, setEditingKamittyId] = useState(null);

  const [lastTractorEntry, setLastTractorEntry] = useState(null);
  const [lastKamittyEntry, setLastKamittyEntry] = useState(null);
  const [historyTractorEntries, setHistoryTractorEntries] = useState([]);
  const [historyKamittyEntries, setHistoryKamittyEntries] = useState([]);

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

  const [listeningField, setListeningField] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [audioRecording, setAudioRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioField, setAudioField] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchLastEntries();
  }, []);

  useEffect(() => {
    const bagTotal = parseFloat(numBags || 0) * parseFloat(costPerBag || 0);
    const other = parseFloat(otherCost || 0);
    setKamittyCost(bagTotal + other);
  }, [numBags, costPerBag, otherCost]);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;
      
      recognition.onresult = event => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        setRecordedText(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          setIsRecording(false);
          setListeningField(null);
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          
        }
      }
    };
  }, [language]);

  const fetchLastEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const [tractorResponse, kamittyResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tractors/latest`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/kamitty/latest`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
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

  const fetchHistoryEntries = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const saveTractorEntryToDatabase = async (entryData) => {
    try {
      const token = localStorage.getItem('token');
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${API_BASE_URL}/tractor/${editingId}` 
        : `${API_BASE_URL}/tractor`;
      
      console.log('Sending tractor data:', entryData);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entryData),
      });
      
      if (response.ok) {
        const savedEntry = await response.json();
        setLastTractorEntry(savedEntry);
        alert(t('Saved successfully!', 'வெற்றிகரமாக சேமிக்கப்பட்டது!'));
        return true;
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        alert(t('Error: ', 'பிழை: ') + (errorData.message || errorData.error || 'Failed to save'));
        return false;
      }
    } catch (error) {
      console.error('Error saving tractor entry:', error);
      alert(t('Error saving entry. Please try again.', 'பதிவை சேமிப்பதில் பிழை. மீண்டும் முயற்சிக்கவும்.'));
      return false;
    }
  };

  const saveKamittyEntryToDatabase = async (entryData) => {
    try {
      const token = localStorage.getItem('token');
      const method = editingKamittyId ? 'PUT' : 'POST';
      const url = editingKamittyId 
        ? `${API_BASE_URL}/kamitty/${editingKamittyId}` 
        : `${API_BASE_URL}/kamitty`;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  const deleteEntryFromDatabase = async (type, entryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/${type}/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
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
    if (!recognitionRef.current) {
      alert(t('Voice input not supported in this browser.', 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.'));
      return;
    }
    
    if (isRecording && listeningField === field) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsRecording(false);
    } else {
      if (isRecording) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping previous recognition:', e);
        }
      }
      
      setListeningField(field);
      setRecordedText('');
      setIsRecording(true);
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsRecording(false);
        setListeningField(null);
      }
    }
  };
  
  const addRecordedText = () => {
    if (!recordedText) return;
    
    if (listeningField === 'day') setDay(recordedText);
    else if (listeningField === 'work') setWork(recordedText);
    else if (listeningField === 'tractorName') setTractorName(recordedText);
    else if (listeningField === 'kamittyDescription') setKamittyDescription(recordedText);
    else if (listeningField === 'date') setDate(recordedText);
    else if (listeningField === 'rate') setRate(recordedText);
    else if (listeningField === 'numBags') setNumBags(recordedText);
    else if (listeningField === 'costPerBag') setCostPerBag(recordedText);
    else if (listeningField === 'otherCost') setOtherCost(recordedText);
    else if (listeningField === 'kamittyDate') setKamittyDate(recordedText);
    
    setRecordedText('');
    setListeningField(null);
  };
  
  const cancelRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setRecordedText('');
    setListeningField(null);
  };

  const startAudioRecording = async (field) => {
    if (audioRecording && audioField === field) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setAudioRecording(false);
      };

      mediaRecorder.start();
      setAudioRecording(true);
      setAudioField(field);
    } catch (error) {
      alert(t('Microphone access denied', 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது'));
    }
  };

  const saveAudioRecording = () => {
    if (!audioBlob) return;
    
    const audioUrl = URL.createObjectURL(audioBlob);
    
    if (audioField === 'day') setDay(audioUrl);
    else if (audioField === 'work') setWork(audioUrl);
    else if (audioField === 'tractorName') setTractorName(audioUrl);
    else if (audioField === 'kamittyDescription') setKamittyDescription(audioUrl);
    
    setAudioBlob(null);
    setAudioField(null);
  };

  const cancelAudioRecording = () => {
    if (audioRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setAudioRecording(false);
    setAudioBlob(null);
    setAudioField(null);
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
    if (!date || !day || !work || !tractorName || timeSegments.some(s => !s.hours)) {
      alert(t('Please fill in all required fields.', 'தேவையான அனைத்து புலங்களும் நிரப்பவும்.'));
      return;
    }

    if (!season || !year) {
      alert(t('Please select Season and Year from Creator Details page', 'உருவாக்குநர் விவரம் பக்கத்தில் பருவம் மற்றும் ஆண்டு தேர்ந்தெடுக்கவும்'));
      return;
    }

    setLoading(true);

    const totalHours = timeSegments.reduce((acc, s) => acc + parseFloat(s.hours || 0), 0);
    const rateValue = rate ? parseFloat(rate) : 0;
    const total = totalHours * rateValue;

    const entryData = {
      date: new Date(date).toISOString(),
      day,
      work,
      tractorName,
      timeSegments: timeSegments.map(seg => ({
        period: seg.period,
        hours: parseFloat(seg.hours)
      })),
      totalHours: parseFloat(totalHours.toFixed(2)),
      rate: rateValue,
      total: parseFloat(total.toFixed(2)),
      moneyGiven,
      year: parseInt(year),
      season
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

    if (!season || !year) {
      alert(t('Please select Season and Year from Creator Details page', 'உருவாக்குநர் விவரம் பக்கத்தில் பருவம் மற்றும் ஆண்டு தேர்ந்தெடுக்கவும்'));
      return;
    }

    setLoading(true);

    const entryData = {
      date: kamittyDate,
      description: kamittyDescription || t('Mandi', 'மண்டி'),
      numBags: numBags || '0',
      costPerBag: costPerBag || '0',
      otherCost: otherCost || '0',
      totalKamitty: kamittyCost.toFixed(2),
      year: parseInt(year),
      season,
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
      setRate(entry.rate.toString()); // Ensure string for input
      setMoneyGiven(entry.moneyGiven);
      setEditingId(entry._id || entry.id);
    } else {
      setKamittyDate(entry.date);
      setKamittyDescription(entry.description);
      setNumBags(entry.numBags);
      setCostPerBag(entry.costPerBag);
      setOtherCost(entry.otherCost);
      setEditingKamittyId(entry._id || entry.id);
    }
  };

  const handleDelete = async (entryId, type) => {
    if (window.confirm(t('Are you sure you want to delete this entry?', 'இந்த பதிவை அழிக்க வேண்டுமா?'))) {
      const success = await deleteEntryFromDatabase(type, entryId);
      if (success) {
        if (type === 'tractor') {
          if (lastTractorEntry && (lastTractorEntry._id === entryId || lastTractorEntry.id === entryId)) {
            fetchLastEntries();
          }
          if (showTractorHistory) {
            fetchHistoryEntries('tractor');
          }
        } else {
          if (lastKamittyEntry && (lastKamittyEntry._id === entryId || lastKamittyEntry.id === entryId)) {
            fetchLastEntries();
          }
          if (showKamittyHistory) {
            fetchHistoryEntries('kamitty');
          }
        }
      }
    }
  };

  const toggleMoneyGiven = async (entry) => {
    const entryId = entry._id || entry.id;
    const updatedEntry = {
      date: entry.date,
      day: entry.day,
      work: entry.work,
      tractorName: entry.tractorName,
      timeSegments: entry.timeSegments,
      totalHours: entry.totalHours,
      rate: entry.rate,
      total: entry.total,
      moneyGiven: entry.moneyGiven === 'Okay' ? 'Not' : 'Okay',
      year: entry.year,
      season: entry.season
    };

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/tractor/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedEntry),
      });
      
      if (response.ok) {
        await fetchLastEntries();
        if (showTractorHistory) {
          await fetchHistoryEntries('tractor');
        }
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error toggling payment:', error);
      alert(t('Error updating payment status. Please try again.', 'பணம் நிலையை புதுப்பிப்பதில் பிழை. மீண்டும் முயற்சிக்கவும்.'));
    } finally {
      setLoading(false);
    }
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
    <div key={entry._id || entry.id} className={`entry-card ${isLast ? 'last-entry' : ''}`}>
      {isLast && <div className="last-entry-badge">{t('Latest Entry', 'சமீபத்திய பதிவு')}</div>}
      
      <div className="entry-header">
        <h4> {entry.tractorName}</h4>
        <span className={`status-badge ${entry.moneyGiven === 'Okay' ? 'paid' : 'pending'}`}>
          {entry.moneyGiven === 'Okay' ? t('Paid', 'பணம் கொடுத்தது') : t('Pending', 'நிலுவை')}
        </span>
      </div>
      
      <div className="entry-details">
        <p><strong>{t('Date:', 'தேதி:')}</strong> {formatDate(entry.date)}</p>
        {entry.date && entry.date.startsWith('blob:') && (
          <div className="audio-playback">
            <audio src={entry.date} controls />
          </div>
        )}
        
        <p><strong>{t('Day:', 'நாள்:')}</strong> {entry.day}</p>
        {entry.day && entry.day.startsWith('blob:') && (
          <div className="audio-playback">
            <audio src={entry.day} controls />
          </div>
        )}
        
        <p><strong>{t('Work:', 'பணி:')}</strong> {entry.work}</p>
        {entry.work && entry.work.startsWith('blob:') && (
          <div className="audio-playback">
            <audio src={entry.work} controls />
          </div>
        )}
        
        {entry.tractorName && entry.tractorName.startsWith('blob:') && (
          <div className="audio-playback">
            <strong>{t('Tractor Name Audio:', 'டிராக்டர் பெயர் ஆடியோ:')}</strong>
            <audio src={entry.tractorName} controls />
          </div>
        )}
        
        <p><strong>{t('Time Slots:', 'நேரங்கள்:')}</strong> {entry.timeSegments.map(s => `${s.period}: ${s.hours}h`).join(', ')}</p>
        <p><strong>{t('Total Hours:', 'மொத்த மணி:')}</strong> {entry.totalHours}</p>
        <p><strong>{t('Rate/hr:', 'ஒருமணி விலை:')}</strong> ₹{entry.rate}</p>
        {entry.rate && typeof entry.rate === 'string' && entry.rate.startsWith('blob:') && (
          <div className="audio-playback">
            <audio src={entry.rate} controls />
          </div>
        )}
        <p><strong>{t('Total:', 'மொத்தம்:')}</strong> ₹{entry.total}</p>
      </div>

      <div className="entry-actions">
        <button onClick={() => handleEdit(entry, 'tractor')} disabled={loading}>
           {t('Edit', 'திருத்த')}
        </button>
        <button onClick={() => toggleMoneyGiven(entry)} disabled={loading} className="toggle-money-btn">
           {t('Toggle Payment', 'பணம் மாற்று')}
        </button>
        <button onClick={() => handleDelete(entry._id || entry.id, 'tractor')} disabled={loading}>
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

  const renderKamittyEntry = (entry, isLast = false) => (
    <div key={entry._id || entry.id} className={`entry-card kamitty-entry ${isLast ? 'last-entry' : ''}`}>
      {isLast && <div className="last-entry-badge">{t('Latest Entry', 'சமீபத்திய பதிவு')}</div>}
      
      <div className="entry-header">
        <h4> {entry.description}</h4>
        <span className="cost-badge">₹{entry.totalKamitty}</span>
      </div>
      
      <div className="entry-details">
        <p><strong>{t('Date:', 'தேதி:')}</strong> {formatDate(entry.date)}</p>
        {entry.date && entry.date.startsWith('blob:') && (
          <div className="audio-playback">
            <audio src={entry.date} controls />
          </div>
        )}
        
        <p><strong>{t('Description:', 'விவரம்:')}</strong> {entry.description}</p>
        {entry.description && entry.description.startsWith('blob:') && (
          <div className="audio-playback">
            <audio src={entry.description} controls />
          </div>
        )}
        
        <p><strong>{t('Number of Bags:', 'பைகளின் எண்ணிக்கை:')}</strong> {entry.numBags}</p>
        <p><strong>{t('Cost per Bag:', 'ஒரு பையின் விலை:')}</strong> ₹{entry.costPerBag}</p>
        <p><strong>{t('Other Cost:', 'பிற செலவு:')}</strong> ₹{entry.otherCost}</p>
        <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹{entry.totalKamitty}</p>
      </div>

      <div className="entry-actions">
        <button onClick={() => handleEdit(entry, 'kamitty')} disabled={loading}>
           {t('Edit', 'திருத்த')}
        </button>
        <button onClick={() => handleDelete(entry._id || entry.id, 'kamitty')} disabled={loading}>
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
    <div className="tracker-container">
      <button 
        onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')} 
        className="language-btn"
      >
        {language === 'en' ? 'தமிழ்' : 'EN'}
      </button>
      
      <h1>{t('Tractor Tracker', 'டிராக்டர் ட்ராக்கர்')}</h1>

      {/* Tractor Entry Form */}
      <div className="form-container">
        <h2>{t('Tractor Entry', 'டிராக்டர் பதிவு')}</h2>
        <div className="form-grid">
          <label>
            {t('Date:', 'தேதி:')} 
            <div className="input-with-voice">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              <button 
                type="button" 
                onClick={() => startListening('date')} 
                className={`voice-btn ${isRecording && listeningField === 'date' ? 'recording' : ''}`}
                title={t('Speech to text', 'பேச்சு உரையாக')}
              >
                {isRecording && listeningField === 'date' ? '⏹️' : '🎤'}
              </button>
              <button 
                type="button" 
                onClick={() => startAudioRecording('date')} 
                className={`voice-btn ${audioRecording && audioField === 'date' ? 'recording' : ''}`}
                title={t('Record audio', 'ஆடியோ பதிவு')}
              >
                {audioRecording && audioField === 'date' ? '⏹️' : '🎙️'}
              </button>
            </div>
            {listeningField === 'date' && recordedText && (
              <div className="recorded-text-preview">
                <span>{recordedText}</span>
                <button type="button" onClick={addRecordedText} className="add-text-btn"> {t('Add', 'சேர்')}</button>
                <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
              </div>
            )}
            {audioField === 'date' && audioBlob && (
              <div className="recorded-text-preview">
                <audio src={URL.createObjectURL(audioBlob)} controls />
                <button type="button" onClick={saveAudioRecording} className="add-text-btn"> {t('Save', 'சேமி')}</button>
                <button type="button" onClick={cancelAudioRecording} className="cancel-text-btn"></button>
              </div>
            )}
          </label>
          
          <label>
            {t('Day:', 'நாள்:')} 
            <div className="input-with-voice">
              <input type="text" value={day} onChange={e => setDay(e.target.value)} />
              <button 
                type="button" 
                onClick={() => startListening('day')} 
                className={`voice-btn ${isRecording && listeningField === 'day' ? 'recording' : ''}`}
                title={t('Speech to text', 'பேச்சு உரையாக')}
              >
                {isRecording && listeningField === 'day' ? '⏹️' : '🎤'}
              </button>
              <button 
                type="button" 
                onClick={() => startAudioRecording('day')} 
                className={`voice-btn ${audioRecording && audioField === 'day' ? 'recording' : ''}`}
                title={t('Record audio', 'ஆடியோ பதிவு')}
              >
                {audioRecording && audioField === 'day' ? '⏹️' : '🎙️'}
              </button>
            </div>
            {listeningField === 'day' && recordedText && (
              <div className="recorded-text-preview">
                <span>{recordedText}</span>
                <button type="button" onClick={addRecordedText} className="add-text-btn"> {t('Add', 'சேர்')}</button>
                <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
              </div>
            )}
            {audioField === 'day' && audioBlob && (
              <div className="recorded-text-preview">
                <audio src={URL.createObjectURL(audioBlob)} controls />
                <button type="button" onClick={saveAudioRecording} className="add-text-btn"> {t('Save', 'சேமி')}</button>
                <button type="button" onClick={cancelAudioRecording} className="cancel-text-btn"></button>
              </div>
            )}
          </label>
          
          <label>
            {t('Work Name:', 'பணியின் பெயர்:')} 
            <div className="input-with-voice">
              <input type="text" value={work} onChange={e => setWork(e.target.value)} />
              <button 
                type="button" 
                onClick={() => startListening('work')} 
                className={`voice-btn ${isRecording && listeningField === 'work' ? 'recording' : ''}`}
                title={t('Speech to text', 'பேச்சு உரையாக')}
              >
                {isRecording && listeningField === 'work' ? '⏹️' : '🎤'}
              </button>
              <button 
                type="button" 
                onClick={() => startAudioRecording('work')} 
                className={`voice-btn ${audioRecording && audioField === 'work' ? 'recording' : ''}`}
                title={t('Record audio', 'ஆடியோ பதிவு')}
              >
                {audioRecording && audioField === 'work' ? '⏹️' : '🎙️'}
              </button>
            </div>
            {listeningField === 'work' && recordedText && (
              <div className="recorded-text-preview">
                <span>{recordedText}</span>
                <button type="button" onClick={addRecordedText} className="add-text-btn"> {t('Add', 'சேர்')}</button>
                <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
              </div>
            )}
            {audioField === 'work' && audioBlob && (
              <div className="recorded-text-preview">
                <audio src={URL.createObjectURL(audioBlob)} controls />
                <button type="button" onClick={saveAudioRecording} className="add-text-btn">{t('Save', 'சேமி')}</button>
                <button type="button" onClick={cancelAudioRecording} className="cancel-text-btn"></button>
              </div>
            )}
          </label>
          
          <label>
            {t('Tractor Name:', 'டிராக்டர் பெயர்:')} 
            <div className="input-with-voice">
              <input type="text" value={tractorName} onChange={e => setTractorName(e.target.value)} />
              <button 
                type="button" 
                onClick={() => startListening('tractorName')} 
                className={`voice-btn ${isRecording && listeningField === 'tractorName' ? 'recording' : ''}`}
                title={t('Speech to text', 'பேச்சு உரையாக')}
              >
                {isRecording && listeningField === 'tractorName' ? '⏹️' : '🎤'}
              </button>
              <button 
                type="button" 
                onClick={() => startAudioRecording('tractorName')} 
                className={`voice-btn ${audioRecording && audioField === 'tractorName' ? 'recording' : ''}`}
                title={t('Record audio', 'ஆடியோ பதிவு')}
              >
                {audioRecording && audioField === 'tractorName' ? '⏹️' : '🎙️'}
              </button>
            </div>
            {listeningField === 'tractorName' && recordedText && (
              <div className="recorded-text-preview">
                <span>{recordedText}</span>
                <button type="button" onClick={addRecordedText} className="add-text-btn"> {t('Add', 'சேர்')}</button>
                <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
              </div>
            )}
            {audioField === 'tractorName' && audioBlob && (
              <div className="recorded-text-preview">
                <audio src={URL.createObjectURL(audioBlob)} controls />
                <button type="button" onClick={saveAudioRecording} className="add-text-btn"> {t('Save', 'சேமி')}</button>
                <button type="button" onClick={cancelAudioRecording} className="cancel-text-btn"></button>
              </div>
            )}
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
                <button onClick={() => removeTimeSegment(index)} className="remove-segment-btn"></button>
              )}
            </div>
          ))}
          <button onClick={addTimeSegment} className="add-segment-btn"> {t('Add Time Slot', 'நேரம் சேர்க்க')}</button>
        </div>

        <div className="form-grid">
          <label>
            {t('Price per Hour (₹):', 'ஒருமணி விலை (₹):')} 
            <div className="input-with-voice">
              <input type="number" value={rate} onChange={e => setRate(e.target.value)} />
              <button 
                type="button" 
                onClick={() => startListening('rate')} 
                className={`voice-btn ${isRecording && listeningField === 'rate' ? 'recording' : ''}`}
                title={t('Speech to text', 'பேச்சு உரையாக')}
              >
                {isRecording && listeningField === 'rate' ? '⏹️' : '🎤'}
              </button>
              <button 
                type="button" 
                onClick={() => startAudioRecording('rate')} 
                className={`voice-btn ${audioRecording && audioField === 'rate' ? 'recording' : ''}`}
                title={t('Record audio', 'ஆடியோ பதிவு')}
              >
                {audioRecording && audioField === 'rate' ? '⏹️' : '🎙️'}
              </button>
            </div>
            {listeningField === 'rate' && recordedText && (
              <div className="recorded-text-preview">
                <span>{recordedText}</span>
                <button type="button" onClick={addRecordedText} className="add-text-btn"> {t('Add', 'சேர்')}</button>
                <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
              </div>
            )}
            {audioField === 'rate' && audioBlob && (
              <div className="recorded-text-preview">
                <audio src={URL.createObjectURL(audioBlob)} controls />
                <button type="button" onClick={saveAudioRecording} className="add-text-btn"> {t('Save', 'சேமி')}</button>
                <button type="button" onClick={cancelAudioRecording} className="cancel-text-btn"></button>
              </div>
            )}
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
          {loading ? '⏳' : (editingId ? '' : '')} {editingId ? t('Update Entry', 'பதிவை புதுப்பிக்க') : t('Add Tractor Entry', 'டிராக்டர் பதிவை சேர்க்க')}
        </button>
      </div>

      {/* Kamitty Entry Form */}
      <div className="form-container kamitty-form">
        <h2> {t('Mandi', 'மண்டி')}</h2>
        <div className="form-grid">
          <label>
            {t('Date:', 'தேதி:')} 
            <div className="input-with-voice">
              <input type="date" value={kamittyDate} onChange={e => setKamittyDate(e.target.value)} />
              <button 
                type="button" 
                onClick={() => startListening('kamittyDate')} 
                className={`voice-btn ${isRecording && listeningField === 'kamittyDate' ? 'recording' : ''}`}
                title={t('Speech to text', 'பேச்சு உரையாக')}
              >
                {isRecording && listeningField === 'kamittyDate' ? '⏹️' : '🎤'}
              </button>
              <button 
                type="button" 
                onClick={() => startAudioRecording('kamittyDate')} 
                className={`voice-btn ${audioRecording && audioField === 'kamittyDate' ? 'recording' : ''}`}
                title={t('Record audio', 'ஆடியோ பதிவு')}
              >
                {audioRecording && audioField === 'kamittyDate' ? '⏹️' : '🎙️'}
              </button>
            </div>
            {listeningField === 'kamittyDate' && recordedText && (
              <div className="recorded-text-preview">
                <span>{recordedText}</span>
                <button type="button" onClick={addRecordedText} className="add-text-btn">{t('Add', 'சேர்')}</button>
                <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
              </div>
            )}
            {audioField === 'kamittyDate' && audioBlob && (
              <div className="recorded-text-preview">
                <audio src={URL.createObjectURL(audioBlob)} controls />
                <button type="button" onClick={saveAudioRecording} className="add-text-btn"> {t('Save', 'சேமி')}</button>
                <button type="button" onClick={cancelAudioRecording} className="cancel-text-btn"></button>
              </div>
            )}
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
              <button 
                type="button" 
                onClick={() => startListening('kamittyDescription')} 
                className={`voice-btn ${isRecording && listeningField === 'kamittyDescription' ? 'recording' : ''}`}
                title={t('Speech to text', 'பேச்சு உரையாக')}
              >
                {isRecording && listeningField === 'kamittyDescription' ? '⏹️' : '🎤'}
              </button>
              <button 
                type="button" 
                onClick={() => startAudioRecording('kamittyDescription')} 
                className={`voice-btn ${audioRecording && audioField === 'kamittyDescription' ? 'recording' : ''}`}
                title={t('Record audio', 'ஆடியோ பதிவு')}
              >
                {audioRecording && audioField === 'kamittyDescription' ? '⏹️' : '🎙️'}
              </button>
            </div>
            {listeningField === 'kamittyDescription' && recordedText && (
              <div className="recorded-text-preview">
                <span>{recordedText}</span>
                <button type="button" onClick={addRecordedText} className="add-text-btn"> {t('Add', 'சேர்')}</button>
                <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
              </div>
            )}
            {audioField === 'kamittyDescription' && audioBlob && (
              <div className="recorded-text-preview">
                <audio src={URL.createObjectURL(audioBlob)} controls />
                <button type="button" onClick={saveAudioRecording} className="add-text-btn"> {t('Save', 'சேமி')}</button>
                <button type="button" onClick={cancelAudioRecording} className="cancel-text-btn"></button>
              </div>
            )}
          </label>
        </div>
        
        <div className="kamitty-section">
          <div className="form-grid">
            <label>
              {t('Number of Bags', 'பைகளின் எண்ணிக்கை')}: 
              <div className="input-with-voice">
                <input type="number" value={numBags} onChange={e => setNumBags(e.target.value)} />
                <button 
                  type="button" 
                  onClick={() => startListening('numBags')} 
                  className={`voice-btn ${isRecording && listeningField === 'numBags' ? 'recording' : ''}`}
                  title={t('Speech to text', 'பேச்சு உரையாக')}
                >
                  {isRecording && listeningField === 'numBags' ? '⏹️' : '🎤'}
                </button>
              </div>
              {listeningField === 'numBags' && recordedText && (
                <div className="recorded-text-preview">
                  <span>{recordedText}</span>
                  <button type="button" onClick={addRecordedText} className="add-text-btn"> {t('Add', 'சேர்')}</button>
                  <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
                </div>
              )}
            </label>
            
            <label>
              {t('Cost per Bag (₹)', 'ஒரு பையின் விலை (₹)')}: 
              <div className="input-with-voice">
                <input type="number" value={costPerBag} onChange={e => setCostPerBag(e.target.value)} />
                <button 
                  type="button" 
                  onClick={() => startListening('costPerBag')} 
                  className={`voice-btn ${isRecording && listeningField === 'costPerBag' ? 'recording' : ''}`}
                  title={t('Speech to text', 'பேச்சு உரையாக')}
                >
                  {isRecording && listeningField === 'costPerBag' ? '⏹️' : '🎤'}
                </button>
              </div>
              {listeningField === 'costPerBag' && recordedText && (
                <div className="recorded-text-preview">
                  <span>{recordedText}</span>
                  <button type="button" onClick={addRecordedText} className="add-text-btn">{t('Add', 'சேர்')}</button>
                  <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
                </div>
              )}
            </label>
            
            <label>
              {t('Other Cost (₹)', 'பிற செலவுகள் (₹)')}: 
              <div className="input-with-voice">
                <input type="number" value={otherCost} onChange={e => setOtherCost(e.target.value)} />
                <button 
                  type="button" 
                  onClick={() => startListening('otherCost')} 
                  className={`voice-btn ${isRecording && listeningField === 'otherCost' ? 'recording' : ''}`}
                  title={t('Speech to text', 'பேச்சு உரையாக')}
                >
                  {isRecording && listeningField === 'otherCost' ? '⏹️' : '🎤'}
                </button>
              </div>
              {listeningField === 'otherCost' && recordedText && (
                <div className="recorded-text-preview">
                  <span>{recordedText}</span>
                  <button type="button" onClick={addRecordedText} className="add-text-btn">{t('Add', 'சேர்')}</button>
                  <button type="button" onClick={cancelRecording} className="cancel-text-btn"></button>
                </div>
              )}
            </label>
          </div>
          
          <p className="kamitty-total">
            {t('Total Mandi Cost', 'மொத்த மண்டி செலவு')}: ₹{kamittyCost.toFixed(2)}
          </p>
        </div>

        <button 
          className="add-btn kamitty-add-btn" 
          onClick={handleAddKamittyEntry}
          disabled={loading}
        >
          {loading ? '⏳' : (editingKamittyId ? '' : '')} {editingKamittyId ? t('Update Entry', 'பதிவை புதுப்பிக்க') : t('Add Mandi Entry', 'மண்டி பதிவை சேர்க்க')}
        </button>
      </div>

      <div className="action-buttons">
        <button className="history-btn" onClick={() => handleViewHistory('tractor')} disabled={loading}>
           {showTractorHistory ? t('Hide Tractor History', 'டிராக்டர் வரலாற்றை மறைக்க') : t('View Tractor History', 'டிராக்டர் வரலாற்றைப் பார்க்க')}
        </button>
        
        <button className="history-btn" onClick={() => handleViewHistory('kamitty')} disabled={loading}>
           {showKamittyHistory ? t('Hide Mandi History', 'மண்டி வரலாற்றை மறைக்க') : t('View Mandi History', 'மண்டி வரலாற்றைப் பார்க்க')}
        </button>
        
        <button className="export-btn" onClick={handleExportCSV} disabled={loading}>
           {t('Export CSV', 'CSV ஏற்றுமதி')}
        </button>
      </div>

      <div className="latest-entries-container">
        <div className="latest-entries-section">
          <h2>{t('Latest Tractor Entry', 'சமீபத்திய டிராக்டர் பதிவு')}</h2>
          {lastTractorEntry ? (
            renderTractorEntry(lastTractorEntry, true)
          ) : (
            <p className="no-entries">{t('No tractor entries yet.', 'ஏதாவது டிராக்டர் பதிவுகள் இல்லை.')}</p>
          )}
        </div>

        <div className="latest-entries-section">
          <h2> {t('Latest Mandi Entry', 'சமீபத்திய மண்டி பதிவு')}</h2>
          {lastKamittyEntry ? (
            renderKamittyEntry(lastKamittyEntry, true)
          ) : (
            <p className="no-entries">{t('No mandi entries yet.', 'ஏதாவது மண்டி பதிவுகள் இல்லை.')}</p>
          )}
        </div>
      </div>

      {showTractorHistory && (
        <div className="history-section">
          <div className="filter-controls">
            <h3>{t('Tractor History Filter', 'டிராக்டர் வரலாற்று வடிப்பு')}</h3>
            
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
                 {t('Search', 'தேடல்')}
              </button>
            </div>
          </div>

          <div className="history-entries">
            <h3>{t('Tractor History Entries', 'டிராக்டர் வரலாற்று பதிவுகள்')}</h3>
            {loading ? (
              <p> {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
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
            <h3> {t('Mandi History Filter', 'மண்டி வரலாற்று வடிப்பு')}</h3>
            
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
                 {t('Search', 'தேடல்')}
              </button>
            </div>
          </div>

          <div className="history-entries">
            <h3>{t('Mandi History Entries', 'மண்டி வரலாற்று பதிவுகள்')}</h3>
            {loading ? (
              <p> {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
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

    </div>
  );
}

export default Tractor;