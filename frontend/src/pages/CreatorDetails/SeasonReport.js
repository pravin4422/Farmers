import React, { useState, useEffect } from 'react';
import { useSeason } from '../../context/SeasonContext';
import '../../css/Mainpages/SeasonReport.css';

function SeasonReport() {
  const { season, year } = useSeason();
  const [language, setLanguage] = useState('en');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [totalYield, setTotalYield] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [latestReport, setLatestReport] = useState(null);

  const API_BASE_URL = 'http://localhost:5000/api';
  const t = (en, ta) => (language === 'ta' ? ta : en);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  useEffect(() => {
    if (season && year) {
      if (showHistoryView) {
        fetchReports();
      } else {
        fetchLatestReport();
      }
    }
  }, [season, year, showHistoryView]);

  useEffect(() => {
    // Load latest report on initial mount if season and year are available
    if (season && year && !showHistoryView) {
      fetchLatestReport();
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/season-reports?season=${season}&year=${year}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/season-reports?season=${season}&year=${year}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const latest = data.length > 0 ? data[0] : null;
        setLatestReport(latest);
      } else {
        setLatestReport(null);
      }
    } catch (error) {
      console.error('Error fetching latest report:', error);
      setLatestReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!productName || !totalYield || !totalAmount) {
      alert(t('Please fill all fields', 'அனைத்து புலங்களையும் நிரப்பவும்'));
      return;
    }

    if (!season || !year) {
      alert(t('Please select Season and Year', 'பருவம் மற்றும் ஆண்டு தேர்ந்தெடுக்கவும்'));
      return;
    }

    const reportData = {
      season,
      year: parseInt(year),
      productName,
      totalYield: parseFloat(totalYield),
      totalAmount: parseFloat(totalAmount)
    };

    setLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE_URL}/season-reports/${editingId}` : `${API_BASE_URL}/season-reports`;
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        resetForm();
        if (showHistoryView) {
          fetchReports();
        } else {
          fetchLatestReport();
        }
      }
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setProductName(report.productName);
    setTotalYield(report.totalYield);
    setTotalAmount(report.totalAmount);
    setEditingId(report._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('Are you sure?', 'நிச்சயமாக நீக்க வேண்டுமா?'))) {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/season-reports/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (response.ok) {
          if (showHistoryView) {
            fetchReports();
          } else {
            fetchLatestReport();
          }
        }
      } catch (error) {
        console.error('Error deleting report:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setProductName('');
    setTotalYield('');
    setTotalAmount('');
    setEditingId(null);
  };

  const currentData = showHistoryView ? reports : (latestReport ? [latestReport] : []);
  const totalYieldSum = currentData.reduce((sum, r) => sum + r.totalYield, 0);
  const totalAmountSum = currentData.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="season-report-container">
      <div className="top-bar">
        <h1>{t('Season Report', 'பருவ அறிக்கை')}</h1>
        <button className="toggle-btn" onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}>
          {t('தமிழ்', 'English')}
        </button>
      </div>

      {season && year && (
        <div className="season-info">
          <h2>{`${season} ${year}`}</h2>
        </div>
      )}

      <div className="form-section">
        <h3>{editingId ? t('Edit Report', 'அறிக்கையை திருத்து') : t('Add Report', 'அறிக்கை சேர்க்க')}</h3>
        
        <label>{t('Agricultural Product Name', 'விவசாய பொருள் பெயர்')}</label>
        <input 
          type="text" 
          value={productName} 
          onChange={(e) => setProductName(e.target.value)}
          placeholder={t('e.g., Rice, Wheat', 'எ.கா., நெல், கோதுமை')}
        />

        <label>{t('Total Yield (Number of Bags)', 'மொத்த விளைச்சல் (மூட்டைகளின் எண்ணிக்கை)')}</label>
        <input 
          type="number" 
          value={totalYield} 
          onChange={(e) => setTotalYield(e.target.value)}
          placeholder={t('Enter number of bags', 'மூட்டைகளின் எண்ணிக்கையை உள்ளிடவும்')}
        />

        <label>{t('Total Amount Earned (₹)', 'மொத்த வருமானம் (₹)')}</label>
        <input 
          type="number" 
          value={totalAmount} 
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder={t('Enter amount in rupees', 'ரூபாயில் தொகை')}
        />

        <div className="form-actions">
          <button onClick={handleSave} disabled={loading}>
            {loading ? t('Saving...', 'சேமிக்கிறது...') : (editingId ? t('Update', 'புதுப்பி') : t('Save', 'சேமி'))}
          </button>
          {editingId && (
            <button onClick={resetForm} className="cancel-btn">
              {t('Cancel', 'ரத்து')}
            </button>
          )}
        </div>
      </div>

      <div className="view-toggle">
        <button 
          onClick={() => setShowHistoryView(!showHistoryView)}
          className="toggle-view-btn"
        >
          {showHistoryView ? t('Back to Latest', 'சமீபத்தியதற்கு திரும்பு') : t('View History', 'வரலாறு பார்க்க')}
        </button>
      </div>

      <div className="reports-section">
        <h3>{showHistoryView ? t('All Reports', 'அனைத்து அறிக்கைகள்') : t('Latest Report', 'சமீபத்திய அறிக்கை')}</h3>
        
        {loading ? (
          <p>{t('Loading...', 'ஏற்றுகிறது...')}</p>
        ) : currentData.length === 0 ? (
          <p className="no-data">{t('No reports found', 'அறிக்கைகள் இல்லை')}</p>
        ) : (
          <>
            <div className="reports-list">
              {currentData.map((report) => (
                <div key={report._id} className="report-card">
                  <h4>{report.productName}</h4>
                  <p><strong>{t('Yield:', 'விளைச்சல்:')}</strong> {report.totalYield} {t('bags', 'மூட்டை')}</p>
                  <p><strong>{t('Amount:', 'தொகை:')}</strong> ₹ {report.totalAmount}</p>
                  {showHistoryView && (
                    <div className="card-actions">
                      <button onClick={() => handleEdit(report)}>{t('Edit', 'திருத்து')}</button>
                      <button onClick={() => handleDelete(report._id)} className="delete-btn">{t('Delete', 'நீக்கு')}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SeasonReport;
