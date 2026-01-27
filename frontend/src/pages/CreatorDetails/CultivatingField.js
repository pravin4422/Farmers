import React, { useState, useEffect } from 'react';
import { useSeason } from '../../context/SeasonContext';
import '../../css/Mainpages/CultivatingField.css';



function CultivatingField() {
  const { season, year } = useSeason();
  const [language, setLanguage] = useState('en');
  const t = (en, ta) => (language === 'ta' ? ta : en);

  const [activities, setActivities] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [driver, setDriver] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerPhone1, setOwnerPhone1] = useState('');
  const [ownerPhone2, setOwnerPhone2] = useState('');
  const [timeSegments, setTimeSegments] = useState([{ period: 'Morning', hours: '' }]);
  const [rate, setRate] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState('');
  const entriesPerPage = 5;

  // Replace with your actual API base URL
  const API_BASE_URL = 'http://localhost:5000/api'; // Update this to your backend URL

  // API Functions
  const saveToDatabase = async (activityData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cultivation-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(activityData),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      const result = await response.json();
      setError('');
      showMessage(t('Data saved successfully!', 'தரவு வெற்றிகரமாக சேமிக்கப்பட்டது!'));
      return result;
    } catch (err) {
      setError(t('Error occurred', 'பிழை ஏற்பட்டது') + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInDatabase = async (id, activityData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cultivation-activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(activityData),
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      const result = await response.json();
      setError('');
      showMessage(t('Record updated successfully!', 'பதிவு வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'));
      return result;
    } catch (err) {
      setError(t('Error occurred', 'பிழை ஏற்பட்டது') + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFromDatabase = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cultivation-activities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setError('');
      showMessage(t('Record deleted successfully!', 'பதிவு வெற்றிகரமாக நீக்கப்பட்டது!'));
    } catch (err) {
      setError(t('Error occurred', 'பிழை ஏற்பட்டது') + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchFromDatabase = async (filters = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.date) params.append('date', filters.date);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_BASE_URL}/cultivation-activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      setError('');
      return result;
    } catch (err) {
      setError(t('Error occurred', 'பிழை ஏற்பட்டது') + ': ' + err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestEntry = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cultivation-activities/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch latest');
      
      const result = await response.json();
      return result;
    } catch (err) {
      return null;
    }
  };

  // Load latest entry on component mount
  useEffect(() => {
    loadLatestEntry();
  }, []);

  const loadLatestEntry = async () => {
    const latest = await fetchLatestEntry();
    setLastEntry(latest);
  };

  const loadHistoryData = async () => {
    const filters = {};
    if (filterMonth) filters.month = filterMonth;
    if (filterYear) filters.year = filterYear;
    if (filterDate) filters.date = filterDate;
    if (search) filters.search = search;
    
    const data = await fetchFromDatabase(filters);
    setActivities(data);
  };

  useEffect(() => {
    if (showHistoryView) {
      loadHistoryData();
    }
  }, [showHistoryView, filterMonth, filterYear, filterDate, search]);

  const showMessage = (message) => {
    // You can implement a toast notification here
    alert(message); // Simple alert for now
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

  const resetForm = () => {
    setTitle('');
    setNote('');
    setDate('');
    setDriver('');
    setOwnerName('');
    setOwnerAddress('');
    setOwnerPhone1('');
    setOwnerPhone2('');
    setTimeSegments([{ period: 'Morning', hours: '' }]);
    setRate('');
    setEditingIndex(null);
    setEditingId(null);
  };

  const handleAddActivity = async () => {
    if (!title || !note || !date || !rate || timeSegments.some(seg => !seg.hours)) {
      alert(t('Please fill in all required fields', 'தயவு செய்து அனைத்து புலங்களையும் நிரப்பவும்'));
      return;
    }

    if (!season || !year) {
      alert(t('Please select Season and Year from Creator Details page', 'உருவாக்குநர் விவரம் பக்கத்தில் பருவம் மற்றும் ஆண்டு தேர்ந்தெடுக்கவும்'));
      return;
    }

    const totalHours = timeSegments.reduce((acc, seg) => acc + parseFloat(seg.hours || 0), 0);
    const total = totalHours * parseFloat(rate);

    const newEntry = {
      title,
      note,
      date,
      driver,
      owner: { name: ownerName, address: ownerAddress, phone1: ownerPhone1, phone2: ownerPhone2 },
      timeSegments,
      rate: parseFloat(rate),
      totalHours: totalHours.toFixed(2),
      total: total.toFixed(2),
      season,
      year: parseInt(year)
    };

    setButtonLoading(true);
    try {
      if (editingId) {
        await updateInDatabase(editingId, newEntry);
      } else {
        await saveToDatabase(newEntry);
      }

      resetForm();
      await loadLatestEntry();
      
      if (showHistoryView) {
        await loadHistoryData();
      }
    } catch (error) {
      // Error already handled in API functions
    } finally {
      setButtonLoading(false);
    }
  };

  const handleEdit = (item) => {
    const entry = showHistoryView ? item : activities[item];
    setTitle(entry.title);
    setNote(entry.note);
    setDate(entry.date);
    setDriver(entry.driver);
    setOwnerName(entry.owner.name);
    setOwnerAddress(entry.owner.address);
    setOwnerPhone1(entry.owner.phone1);
    setOwnerPhone2(entry.owner.phone2);
    setTimeSegments(entry.timeSegments);
    setRate(entry.rate.toString());
    setEditingId(entry.id || entry._id);
    setEditingIndex(entry.id || entry._id);
  };

  const handleDelete = async (item) => {
    if (window.confirm(t('Are you sure you want to delete this record?', 'இந்த பதிவை நீக்க விரும்புகிறீர்களா?'))) {
      try {
        const id = showHistoryView ? (item.id || item._id) : (activities[item].id || activities[item]._id);
        await deleteFromDatabase(id);
        
        // Refresh data
        if (showHistoryView) {
          await loadHistoryData();
        } else {
          await loadLatestEntry();
        }
      } catch (error) {
        // Error already handled in API functions
      }
    }
  };

  const handleExportCSV = () => {
    const dataToExport = showHistoryView ? activities : (lastEntry ? [lastEntry] : []);
    
    const headers = [
      'Date', 'Title', 'Note', 'Driver', 'Owner Name', 'Address', 'Phone 1', 'Phone 2',
      'Time Segments', 'Total Hours', 'Rate/hr', 'Total Cost'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(act => [
        act.date,
        `"${act.title}"`,
        `"${act.note}"`,
        `"${act.driver}"`,
        `"${act.owner.name}"`,
        `"${act.owner.address}"`,
        act.owner.phone1,
        act.owner.phone2,
        `"${act.timeSegments.map(s => `${s.period}: ${s.hours}h`).join(' | ')}"`,
        act.totalHours,
        act.rate,
        act.total,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cultivation_activities_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const dataToExport = showHistoryView ? activities : (lastEntry ? [lastEntry] : []);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('Cultivating Field Activities', 'விவசாய செயல் பதிவேடு')}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #2c3e50; }
          .activity { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
          .activity h3 { margin: 0 0 10px 0; color: #27ae60; }
          .activity p { margin: 5px 0; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <h1>${t('Cultivating Field - Activity Log', 'விவசாய செயல் பதிவேடு')}</h1>
        <p><strong>Report Type:</strong> ${showHistoryView ? t('History View', 'வரலாறு பார்வை') : t('Latest Entry', 'சமீபத்திய பதிவு')}</p>
        ${dataToExport.map(item => `
          <div class="activity">
            <h3>${item.title} (${item.date})</h3>
            <p><strong>${t('Note', 'குறிப்பு')}:</strong> ${item.note}</p>
            <p><strong>${t('Driver', 'டிரைவர்')}:</strong> ${item.driver}</p>
            <p><strong>${t('Owner', 'உரிமையாளர்')}:</strong> ${item.owner.name}</p>
            <p><strong>${t('Address', 'முகவரி')}:</strong> ${item.owner.address}</p>
            <p><strong>${t('Phone', 'தொலைபேசி')}:</strong> ${item.owner.phone1}, ${item.owner.phone2}</p>
            <p><strong>${t('Time Segments', 'நேர பகுதிகள்')}:</strong> ${item.timeSegments.map(s => `${s.period}: ${s.hours}h`).join(', ')}</p>
            <p><strong>${t('Total Hours', 'மொத்த மணிநேரம்')}:</strong> ${item.totalHours} | <strong>${t('Rate', 'விலை')}:</strong> ₹${item.rate} | <strong>${t('Total', 'மொத்தம்')}:</strong> ₹${item.total}</p>
          </div>
        `).join('')}
        <div style="margin-top: 40px;">
          <p><strong>${t('Printed on', 'அச்சிடப்பட்ட தேதி')}:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>${t('Signature', 'கையொப்பம்')}:</strong> ________________________</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleExportExcel = () => {
    // Use CSV format since we removed XLSX dependency
    handleExportCSV();
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-section');
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${t('Cultivating Field Activities', 'விவசாய செயல் பதிவேடு')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin: 0; }
            .activity { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
            .activity h3 { margin: 0 0 10px 0; }
            .activity p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h2>${t('Cultivating Field - Activity Log', 'விவசாய செயல் பதிவேடு')}</h2>
          ${printContent.innerHTML}
          <div style="margin-top: 40px;">
            ${t('Printed on', 'அச்சிடப்பட்ட தேதி')}: ${new Date().toLocaleDateString()}<br/>
            ${t('Signature', 'கையொப்பம்')}: ________________________
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterYear('');
    setFilterDate('');
    setSearch('');
  };

  const currentData = showHistoryView ? activities : (lastEntry ? [lastEntry] : []);
  const paginatedActivities = showHistoryView ? 
    currentData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage) : 
    currentData;
  const totalPages = showHistoryView ? Math.ceil(currentData.length / entriesPerPage) : 1;

  function translatePeriod(period) {
    switch (period) {
      case 'Morning': return 'காலை';
      case 'Afternoon': return 'மதியம்';
      case 'Evening': return 'மாலை';
      case 'Night': return 'இரவு';
      default: return period;
    }
  }

  return (
    <div className="cultivating-container">
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}>
           {language === 'en' ? 'தமிழ்' : 'English'}
        </button>
      </div>

      <h1>{t('Cultivating Field - Activity Log', 'விவசாய செயல் பதிவேடு')}</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          {t('Loading...', 'ஏற்றுகிறது...')}
        </div>
      )}

      <div className="form-section">
        <input type="text" placeholder={t("Activity Title", "செயலின் தலைப்பு")} value={title} onChange={e => setTitle(e.target.value)} />
        <textarea placeholder={t("Activity Notes", "செயலுக்கான குறிப்புகள்")} value={note} onChange={e => setNote(e.target.value)} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input type="text" placeholder={t("Driver Name", "டிரைவர் பெயர்")} value={driver} onChange={e => setDriver(e.target.value)} />
        <input type="text" placeholder={t("Owner Name", "உரிமையாளர் பெயர்")} value={ownerName} onChange={e => setOwnerName(e.target.value)} />
        <input type="text" placeholder={t("Owner Address", "முகவரி")} value={ownerAddress} onChange={e => setOwnerAddress(e.target.value)} />
        <input type="text" placeholder={t("Owner Phone 1", "தொலைபேசி எண் 1")} value={ownerPhone1} onChange={e => setOwnerPhone1(e.target.value)} />
        <input type="text" placeholder={t("Owner Phone 2", "தொலைபேசி எண் 2")} value={ownerPhone2} onChange={e => setOwnerPhone2(e.target.value)} />

        <div className="time-segments-section">
          <label>{t("Time Segments", "நேர பகுதிகள்")}:</label>
          {timeSegments.map((seg, idx) => (
            <div key={idx} className="segment-row">
              <select value={seg.period} onChange={e => handleSegmentChange(idx, 'period', e.target.value)}>
                <option value="Morning">{t("Morning", "காலை")}</option>
                <option value="Afternoon">{t("Afternoon", "மதியம்")}</option>
                <option value="Evening">{t("Evening", "மாலை")}</option>
                <option value="Night">{t("Night", "இரவு")}</option>
              </select>
              <input type="number" placeholder={t("Hours", "மணிநேரம்")} value={seg.hours} onChange={e => handleSegmentChange(idx, 'hours', e.target.value)} />
              {idx > 0 && <button type="button" onClick={() => removeTimeSegment(idx)}></button>}
            </div>
          ))}
          <button type="button" onClick={addTimeSegment}>{t("Add Time Slot", "நேர இடைவெளியை சேர்")}</button>
        </div>

        <input type="number" placeholder={t("Price per hour", "மணிக்கு விலை")} value={rate} onChange={e => setRate(e.target.value)} />
        <button onClick={handleAddActivity} disabled={buttonLoading} className={buttonLoading ? 'loading' : ''}>
          {buttonLoading ? (editingId ? t("Updating...", "புதுப்பிக்கிறது...") : t("Adding...", "சேர்க்கிறது...")) : (editingId ? t("Update Activity", "செயலை புதுப்பி") : t("Add Activity", "செயலை சேர்"))}
        </button>
      </div>

      <div className="actions">
        <button onClick={handlePrint}> {t("Print", "அச்சிடு")}</button>
      </div>

      <div className="section-header">
        <h2>{t('Latest Entry', 'சமீபத்திய பதிவு')}</h2>
      </div>

      <div id="print-section" className="activity-list">
        {lastEntry ? (
          <div className="activity-card">
            <h3>{lastEntry.title} ({lastEntry.date})</h3>
            <p><strong>{t('Note', 'குறிப்பு')}:</strong> {lastEntry.note}</p>
            <p>{t("Driver", "டிரைவர்")}: {lastEntry.driver}</p>
            <p>{t("Owner", "உரிமையாளர்")}: {lastEntry.owner.name} |  {lastEntry.owner.phone1}, {lastEntry.owner.phone2}</p>
            <p>{t("Address", "முகவரி")}: {lastEntry.owner.address}</p>
            <p>{t("Time", "நேரம்")}: {lastEntry.timeSegments.map(s => `${t(s.period, translatePeriod(s.period))}: ${s.hours}h`).join(', ')}</p>
            <p>{t("Hours", "மணிநேரம்")}: {lastEntry.totalHours} | {t("Rate", "விலை")}: ₹{lastEntry.rate} | {t("Total", "மொத்தம்")}: ₹{lastEntry.total}</p>
          </div>
        ) : (
          <div className="no-records">
            {t('No records found', 'பதிவுகள் இல்லை')}
          </div>
        )}
      </div>
    </div>
  );
}

export default CultivatingField;