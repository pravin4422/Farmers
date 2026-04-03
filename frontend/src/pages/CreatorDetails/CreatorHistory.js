import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Mainpages/CreatorHistory.css';
import '../../css/Mainpages/SeasonTotals.css';
import '../../css/Mainpages/graph-modal.css';

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
  const [seasonReportEntries, setSeasonReportEntries] = useState([]);
  const [showSeasonTotals, setShowSeasonTotals] = useState(false);
  const [selectedSeasonDetail, setSelectedSeasonDetail] = useState(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [selectedSeasonForGraph, setSelectedSeasonForGraph] = useState(null);
  const [graphFilterSeason, setGraphFilterSeason] = useState('');
  const [graphFilterProduct, setGraphFilterProduct] = useState('');

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

  useEffect(() => {
    // Re-fetch when filters change (but not on initial mount)
    const token = getAuthToken();
    if (token && (filterSeason || filterYear || filterDay)) {
      fetchHistoryEntries();
    }
  }, [filterSeason, filterYear, filterDay]);

  const fetchHistoryEntries = async () => {
    setLoading(true);
    try {
      const params = [];
      if (filterSeason) params.push(`season=${encodeURIComponent(filterSeason)}`);
      if (filterYear) params.push(`year=${encodeURIComponent(filterYear)}`);
      if (filterDay) params.push(`day=${encodeURIComponent(filterDay)}`);
      
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      
      console.log('Fetching history with query:', queryString);
      
      // Fetch all module data
      const [creatorRes, tractorRes, productRes, cultivationRes, kamittyRes, expiriesRes, problemsRes, seasonReportRes] = await Promise.all([
        fetch(`${API_BASE_URL}/creator-details/history${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/tractor${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/products${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/cultivation-activities${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/kamitty${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/expiries${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/problems${queryString}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/season-reports${queryString}`, { headers: getAuthHeaders() })
      ]);
      
      console.log('Creator response status:', creatorRes.status);
      console.log('Tractor response status:', tractorRes.status);
      console.log('Product response status:', productRes.status);
      
      if (creatorRes.ok) {
        const data = await creatorRes.json();
        console.log('Creator data received:', data.length, 'entries');
        setHistoryEntries(data);
      } else {
        console.error('Creator fetch failed:', creatorRes.status);
      }
      
      if (tractorRes.ok) setTractorEntries(await tractorRes.json());
      if (productRes.ok) setProductEntries(await productRes.json());
      if (cultivationRes.ok) setCultivationEntries(await cultivationRes.json());
      if (kamittyRes.ok) setKamittyEntries(await kamittyRes.json());
      if (seasonReportRes.ok) setSeasonReportEntries(await seasonReportRes.json());
      
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
          <span className="entry-season">{entry.season} {entry.year}</span>
          {entry.seedDate && <span className="entry-date"> {formatDate(entry.seedDate)}</span>}
        </div>
        
        <div className="entry-sections-container">
          {(entry.seedWeight || entry.seedCost || entry.seedingCount || entry.peopleCount) && (
            <div className="entry-section">
              <h4>{t('Seed Sowing Details', 'விதை விதைக்கும் விவரம்')}</h4>
              <div className="entry-details">
                {entry.seedWeight && <p><strong>{t('Seed Weight:', 'விதை எடை:')}</strong> {entry.seedWeight} kg</p>}
                {entry.seedCost && <p><strong>{t('Seed Cost:', 'விதை செலவு:')}</strong> ₹{entry.seedCost}</p>}
                {entry.seedingCount && <p><strong>{t('Seedings:', 'விதைப்புகள்:')}</strong> {entry.seedingCount}</p>}
                {entry.peopleCount && <p><strong>{t('People:', 'மக்கள்:')}</strong> {entry.peopleCount}</p>}
                {entry.moneyPerPerson && <p><strong>{t('Money per Person:', 'ஒருவருக்கு செலவு:')}</strong> ₹{entry.moneyPerPerson}</p>}
                {entry.totalSeedingCost && <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹{entry.totalSeedingCost}</p>}
              </div>
            </div>
          )}

          {entry.seedingTakers && entry.seedingTakers.length > 0 && (
            <div className="entry-section">
              <h4>{t('Taking Seeding', 'விதைப்புகளை எடுத்தல்')}</h4>
              <div className="entry-details">
                {entry.seedingTakers.map((taker, i) => (
                  <div key={i} className="taker-info">
                    <p><strong>{taker.name}</strong></p>
                    <p>{t('Seedings Taken:', 'விதைப்புகள்:')} {taker.taken}</p>
                    <p>{t('Money:', 'தொகை:')} ₹{taker.money}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entry.workers && entry.workers.length > 0 && (
            <div className="entry-section">
              <h4>{t('Planted Cost (Natta Kooli)', 'நட்ட கூலி')}</h4>
              <div className="entry-details">
                {entry.plantingDate && <p><strong>{t('Planting Date:', 'நட்ட தேதி:')}</strong> {formatDate(entry.plantingDate)}</p>}
                {entry.workers.map((worker, i) => (
                  <div key={i} className="taker-info">
                    <p> <strong>{worker.name}</strong></p>
                    <p>{t('Money Given:', 'கூலி வழங்கப்பட்டது:')} {worker.moneyGiven === 'yes' ? t('Yes', 'ஆம்') : t('No', 'இல்லை')}</p>
                    <p>{t('Cost:', 'செலவு:')} ₹{worker.cost}</p>
                  </div>
                ))}
                <p><strong>{t('Total Workers:', 'மொத்த நபர்கள்:')}</strong> {entry.workers.length}</p>
                <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹{entry.workers.reduce((sum, w) => sum + parseInt(w.cost || 0), 0)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="entry-actions">
          <button onClick={() => handleEdit(entry)}> {t('Edit', 'திருத்த')}</button>
          <button onClick={() => handleDelete(entry._id || entry.id)}> {t('Delete', 'அழிக்க')}</button>
        </div>
      </div>
    ))
  );

  const renderTractorEntries = () => (
    tractorEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season"> {entry.season} {entry.year}</span>
          <span className="entry-date"> {formatDate(entry.date)}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Work:', 'வேலை:')}</strong> {entry.work}</p>
          <p><strong>{t('Tractor:', 'டிராக்டர்:')}</strong> {entry.tractorName}</p>
          <p><strong>{t('Total Hours:', 'மொத்த மணி:')}</strong> {entry.totalHours} {t('hours', 'மணி')}</p>
          <p><strong>{t('Rate per Hour:', 'ஒரு மணிக்கு:')}</strong> ₹{entry.rate ? entry.rate.toLocaleString() : 0}</p>
          <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹{entry.total ? entry.total.toLocaleString() : 0}</p>
        </div>
      </div>
    ))
  );

  const renderProductEntries = () => (
    productEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season"> {entry.season} {entry.year}</span>
          <span className="entry-date">{entry.date}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Product Name:', 'பொருள் பெயர்:')}</strong> {entry.name}</p>
          <p><strong>{t('Day:', 'நாள்:')}</strong> {entry.day}</p>
          <p><strong>{t('Quantity:', 'அளவு:')}</strong> {entry.quantity}</p>
          <p><strong>{t('Cost per Unit:', 'ஒரு அளவுக்கு:')}</strong> ₹{entry.cost ? entry.cost.toLocaleString() : 0}</p>
          <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹{entry.total ? entry.total.toLocaleString() : 0}</p>
        </div>
      </div>
    ))
  );

  const renderCultivationEntries = () => (
    cultivationEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season"> {entry.season} {entry.year}</span>
          <span className="entry-date"> {entry.date}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Activity:', 'செயல்:')}</strong> {entry.title}</p>
          <p><strong>{t('Day:', 'நாள்:')}</strong> {entry.day}</p>
          {entry.note && <p><strong>{t('Note:', 'குறிப்பு:')}</strong> {entry.note}</p>}
          {entry.driver && <p><strong>{t('Driver:', 'ஓட்டுநர்:')}</strong> {entry.driver}</p>}
          {entry.totalHours && <p><strong>{t('Hours:', 'மணி:')}</strong> {entry.totalHours} {t('hours', 'மணி')}</p>}
          {entry.total && <p><strong>{t('Total Cost:', 'மொத்த செலவு:')}</strong> ₹{entry.total.toLocaleString()}</p>}
        </div>
      </div>
    ))
  );

  const renderKamittyEntries = () => (
    kamittyEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season"> {entry.season} {entry.year}</span>
          <span className="entry-date"> {entry.date}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Date:', 'தேதி:')}</strong> {entry.date}</p>
          <p><strong>{t('Day:', 'நாள்:')}</strong> {entry.day}</p>
          {entry.numBags && <p><strong>{t('Number of Bags:', 'மூட்டைகள்:')}</strong> {entry.numBags}</p>}
          {entry.totalKamitty && <p><strong>{t('Total Mandi Cost:', 'மொத்த மண்டி செலவு:')}</strong> ₹{parseFloat(entry.totalKamitty).toLocaleString()}</p>}
          {entry.numBags && entry.totalKamitty && (
            <p><strong>{t('Per Bag Cost:', 'ஒரு மூட்டைக்கு:')}</strong> ₹{(parseFloat(entry.totalKamitty) / entry.numBags).toFixed(2)}</p>
          )}
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
              {entry.season} {entry.year}
            </span>
            <span className="entry-date"> {formatDate(entry.createdAt)}</span>
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
                {entry.notes && <p><strong>{t('Notes:', 'குறிப்புகள்:')}</strong> {entry.notes}</p>}
              </>
            )}
          </div>
        </div>
      );
    })
  );

  const renderSeasonReportEntries = () => (
    seasonReportEntries.map(entry => (
      <div key={entry._id || entry.id} className="entry-card">
        <div className="entry-header">
          <span className="entry-season"> {entry.season} {entry.year}</span>
          <span className="entry-date"> {formatDate(entry.createdAt)}</span>
        </div>
        
        <div className="entry-details">
          <p><strong>{t('Product Name:', 'பொருள் பெயர்:')}</strong> {entry.productName}</p>
          <p><strong>{t('Total Yield:', 'மொத்த விளைச்சல்:')}</strong> {entry.totalYield} {t('bags', 'மூட்டை')}</p>
          <p><strong>{t('Total Amount Earned:', 'மொத்த வருமானம்:')}</strong> ₹{entry.totalAmount.toLocaleString()}</p>
          <p><strong>{t('Per Bag Rate:', 'ஒரு மூட்டைக்கு:')}</strong> ₹{(entry.totalAmount / entry.totalYield).toFixed(2)}</p>
        </div>
      </div>
    ))
  );

  const calculateSeasonTotal = (season, year) => {
    let totalExpenses = 0;
    let totalIncome = 0;

    // Seed Sowing costs
    historyEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        totalExpenses += e.seedCost || 0;
        totalExpenses += e.totalSeedingCost || 0;
        if (e.workers) {
          e.workers.forEach(w => totalExpenses += parseInt(w.cost || 0));
        }
      });

    // Tractor costs
    tractorEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => totalExpenses += e.total || 0);

    // Product costs
    productEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => totalExpenses += e.total || 0);

    // Cultivation costs
    cultivationEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => totalExpenses += e.total || 0);

    // Mandi costs
    kamittyEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => totalExpenses += parseFloat(e.totalKamitty || 0));

    // Season Report income
    seasonReportEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => totalIncome += parseFloat(e.totalAmount || 0));

    return { totalExpenses, totalIncome, netProfit: totalIncome - totalExpenses };
  };

  const getSeasonBreakdown = (season, year) => {
    const breakdown = {
      seedSowing: 0,
      tractor: 0,
      products: 0,
      cultivation: 0,
      mandi: 0,
      seasonReport: 0
    };

    historyEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        breakdown.seedSowing += (e.seedCost || 0) + (e.totalSeedingCost || 0);
        if (e.workers) {
          e.workers.forEach(w => breakdown.seedSowing += parseInt(w.cost || 0));
        }
      });

    tractorEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => breakdown.tractor += e.total || 0);

    productEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => breakdown.products += e.total || 0);

    cultivationEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => breakdown.cultivation += e.total || 0);

    kamittyEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => breakdown.mandi += parseFloat(e.totalKamitty || 0));

    seasonReportEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => breakdown.seasonReport += parseFloat(e.totalAmount || 0));

    return breakdown;
  };

  const getSeasonDetails = (season, year) => {
    const details = {
      seedSowing: [],
      tractor: [],
      products: [],
      cultivation: [],
      mandi: [],
      seasonReport: []
    };

    historyEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        if (e.seedCost) {
          details.seedSowing.push({ name: t('Seed Cost', 'விதை செலவு'), amount: e.seedCost, date: e.seedDate });
        }
        if (e.totalSeedingCost) {
          details.seedSowing.push({ name: t('Total Seeding Cost', 'மொத்த விதைப்பு செலவு'), amount: e.totalSeedingCost, date: e.seedDate });
        }
        if (e.workers && e.workers.length > 0) {
          e.workers.forEach(w => {
            details.seedSowing.push({ name: `${t('Worker', 'தொழிலாளி')}: ${w.name}`, amount: parseInt(w.cost || 0), date: e.plantingDate });
          });
        }
      });

    tractorEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        details.tractor.push({ name: `${e.work} - ${e.tractorName}`, amount: e.total, date: e.date, hours: e.totalHours });
      });

    productEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        details.products.push({ name: e.name, amount: e.total, date: e.date, quantity: e.quantity });
      });

    cultivationEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        details.cultivation.push({ name: e.title, amount: e.total, date: e.date, note: e.note });
      });

    kamittyEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        details.mandi.push({ name: t('Mandi Cost', 'மண்டி செலவு'), amount: parseFloat(e.totalKamitty || 0), date: e.date, bags: e.numBags });
      });

    seasonReportEntries
      .filter(e => e.season === season && e.year === year)
      .forEach(e => {
        details.seasonReport.push({ name: e.productName, amount: parseFloat(e.totalAmount || 0), date: e.createdAt, yield: e.totalYield });
      });

    return details;
  };

  const handleSeasonClick = (season, year) => {
    setSelectedSeasonDetail({ season, year });
  };

  const closeSeasonDetail = () => {
    setSelectedSeasonDetail(null);
  };

  const handleGraphClick = (season) => {
    setSelectedSeasonForGraph(season);
    setGraphFilterSeason(season);
    setGraphFilterProduct('');
    setShowGraphModal(true);
  };

  const closeGraphModal = () => {
    setShowGraphModal(false);
    setSelectedSeasonForGraph(null);
    setGraphFilterSeason('');
    setGraphFilterProduct('');
  };

  const viewDetailedRecords = (specificSeason = null, specificYear = null) => {
    // Apply filters from graph to main filter
    const seasonToApply = specificSeason || graphFilterSeason;
    const yearToApply = specificYear;
    
    if (seasonToApply) {
      setFilterSeason(seasonToApply);
    }
    if (yearToApply) {
      setFilterYear(yearToApply.toString());
    }
    
    // Close the graph modal
    setShowGraphModal(false);
    setSelectedSeasonForGraph(null);
    setGraphFilterSeason('');
    setGraphFilterProduct('');
  };

  const getSeasonHistoricalData = (season, product) => {
    const uniqueYears = getUniqueSeasons()
      .filter(s => !season || s.season === season)
      .map(s => ({ season: s.season, year: s.year }))
      .sort((a, b) => a.year - b.year);

    const yearMap = new Map();

    uniqueYears.forEach(({ season: s, year }) => {
      const key = `${s}-${year}`;
      if (!yearMap.has(key)) {
        let totalExpenses = 0;
        let totalIncome = 0;

        // Calculate expenses
        historyEntries
          .filter(e => e.season === s && e.year === year)
          .forEach(e => {
            totalExpenses += e.seedCost || 0;
            totalExpenses += e.totalSeedingCost || 0;
            if (e.workers) {
              e.workers.forEach(w => totalExpenses += parseInt(w.cost || 0));
            }
          });

        tractorEntries
          .filter(e => e.season === s && e.year === year)
          .forEach(e => totalExpenses += e.total || 0);

        productEntries
          .filter(e => e.season === s && e.year === year)
          .forEach(e => totalExpenses += e.total || 0);

        cultivationEntries
          .filter(e => e.season === s && e.year === year)
          .forEach(e => totalExpenses += e.total || 0);

        kamittyEntries
          .filter(e => e.season === s && e.year === year)
          .forEach(e => totalExpenses += parseFloat(e.totalKamitty || 0));

        // Calculate income - filter by product if specified
        const incomeEntries = seasonReportEntries
          .filter(e => e.season === s && e.year === year)
          .filter(e => !product || e.productName === product);

        incomeEntries.forEach(e => totalIncome += parseFloat(e.totalAmount || 0));

        yearMap.set(key, {
          season: s,
          year,
          expenses: totalExpenses,
          income: totalIncome,
          profit: totalIncome - totalExpenses
        });
      }
    });

    return Array.from(yearMap.values());
  };

  const getAllProducts = () => {
    const products = new Set();
    seasonReportEntries.forEach(e => {
      if (e.productName) {
        products.add(e.productName);
      }
    });
    return Array.from(products).sort();
  };

  const getAllSeasons = () => {
    const seasons = new Set();
    [...historyEntries, ...tractorEntries, ...productEntries, ...cultivationEntries, ...kamittyEntries, ...seasonReportEntries]
      .forEach(e => {
        if (e.season) {
          seasons.add(e.season);
        }
      });
    return Array.from(seasons).sort();
  };

  const openGraphModalFromMenu = () => {
    setSelectedSeasonForGraph('menu');
    setGraphFilterSeason('');
    setGraphFilterProduct('');
    setShowGraphModal(true);
  };

  const getUniqueSeasons = () => {
    const seasons = new Set();
    [...historyEntries, ...tractorEntries, ...productEntries, ...cultivationEntries, ...kamittyEntries, ...seasonReportEntries]
      .forEach(e => {
        if (e.season && e.year) {
          seasons.add(`${e.season}-${e.year}`);
        }
      });
    return Array.from(seasons).map(s => {
      const [season, year] = s.split('-');
      return { season, year: parseInt(year) };
    });
  };

  const getCurrentEntries = () => {
    switch(activeTab) {
      case 'creator': return historyEntries;
      case 'tractor': return tractorEntries;
      case 'products': return productEntries;
      case 'cultivation': return cultivationEntries;
      case 'kamitty': return kamittyEntries;
      case 'review': return reviewEntries;
      case 'seasonReport': return seasonReportEntries;
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
      case 'seasonReport': return renderSeasonReportEntries();
      default: return null;
    }
  };

  return (
    <div className="creator-history-container">
      <div className="history-header">
        <button className="back-btn" onClick={() => navigate('/creator')}>
          ← {t('Back', 'பின்செல்')}
        </button>
        <h1>{t('Creator History', 'உருவாக்குநர் வரலாறு')}</h1>
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
            {getAllSeasons().map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
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
             {t('Search', 'தேடல்')}
          </button>
          
          <button onClick={openGraphModalFromMenu} className="graph-analysis-btn">
            📊 {t('Graph Analysis', 'வரைபட பகுப்பாய்வு')}
          </button>
        </div>
      </div>

      {!loading && getUniqueSeasons().length > 0 && (
        <div className="season-totals-section">
          <div className="season-totals-header">
            <h3>{t('Season Totals', 'பருவ மொத்தம்')}</h3>
            <button 
              className="toggle-totals-btn" 
              onClick={() => setShowSeasonTotals(!showSeasonTotals)}
            >
              {showSeasonTotals ? '▼' : '▶'} {t('View Totals', 'மொத்தங்களைக் காண்க')}
            </button>
          </div>
          
          {showSeasonTotals && (
            <div className="season-totals-grid">
              {getUniqueSeasons().map(({ season, year }) => {
                const totals = calculateSeasonTotal(season, year);
                return (
                  <button 
                    key={`${season}-${year}`} 
                    className="season-total-card"
                    onClick={() => handleSeasonClick(season, year)}
                  >
                    <div className="season-total-header">
                      <span>{season} {year}</span>
                      <button 
                        className="graph-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGraphClick(season);
                        }}
                        title={t('View Graph Analysis', 'வரைபட பகுப்பாய்வு காண்க')}
                      >
                        📊
                      </button>
                    </div>
                    <div className="season-total-breakdown">
                      <div className="total-line">
                        <span>{t('Total Expenses:', 'மொத்த செலவுகள்:')}</span>
                        <span className="expense-value">₹{totals.totalExpenses.toLocaleString()}</span>
                      </div>
                      <div className="total-line">
                        <span>{t('Total Income:', 'மொத்த வருமானம்:')}</span>
                        <span className="income-value">₹{totals.totalIncome.toLocaleString()}</span>
                      </div>
                      <div className="total-line net-line">
                        <strong>{t('Net Profit/Loss:', 'நிகர லாபம்/நஷ்டம்:')}</strong>
                        <strong className={totals.netProfit >= 0 ? 'profit-value' : 'loss-value'}>
                          ₹{totals.netProfit.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                    <div className="click-hint">{t('Click for details', 'விவரங்களுக்கு கிளிக் செய்க')}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedSeasonDetail && (
        <div className="modal-overlay" onClick={closeSeasonDetail}>
          <div className="season-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSeasonDetail.season} {selectedSeasonDetail.year}</h2>
              <button className="close-btn" onClick={closeSeasonDetail}>✕</button>
            </div>
            
            <div className="breakdown-section">
                <h3>{t('Cost Breakdown', 'செலவு விவரம்')}</h3>
                
                {(() => {
                  const breakdown = getSeasonBreakdown(selectedSeasonDetail.season, selectedSeasonDetail.year);
                  const totals = calculateSeasonTotal(selectedSeasonDetail.season, selectedSeasonDetail.year);
                  return (
                    <div className="breakdown-list">
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t('Seed Sowing Tracker', 'விதை விதைப்பு')}</span>
                        <span className="breakdown-value">₹{breakdown.seedSowing.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t('Tracker', 'டிராக்டர்')}</span>
                        <span className="breakdown-value">₹{breakdown.tractor.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t('Agromedical Products', 'வேளாண் மருத்துவ பொருட்கள்')}</span>
                        <span className="breakdown-value">₹{breakdown.products.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t('Cultivating Field', 'வயல் உழுது')}</span>
                        <span className="breakdown-value">₹{breakdown.cultivation.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">{t('Mandi', 'மண்டி')}</span>
                        <span className="breakdown-value">₹{breakdown.mandi.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item subtotal-row">
                        <span className="breakdown-label"><strong>{t('Total Expenses', 'மொத்த செலவுகள்')}</strong></span>
                        <span className="breakdown-value"><strong>₹{totals.totalExpenses.toLocaleString()}</strong></span>
                      </div>
                      <div className="breakdown-item income-row">
                        <span className="breakdown-label">{t('Season Report (Income)', 'பருவ அறிக்கை (வருமானம்)')}</span>
                        <span className="breakdown-value income">₹{breakdown.seasonReport.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item total-row">
                        <span className="breakdown-label"><strong>{t('Net Profit/Loss', 'நிகர லாபம்/நஷ்டம்')}</strong></span>
                        <span className={`breakdown-value total ${totals.netProfit >= 0 ? 'profit' : 'loss'}`}>
                          <strong>₹{totals.netProfit.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="detailed-breakdown-section">
                <h3>{t('Detailed Expenses', 'விரிவான செலவுகள்')}</h3>
                
                {(() => {
                  const details = getSeasonDetails(selectedSeasonDetail.season, selectedSeasonDetail.year);
                  
                  return (
                    <div className="details-container">
                      {details.seedSowing.length > 0 && (
                        <div className="detail-category">
                          <h4>{t('Seed Sowing Tracker', 'விதை விதைப்பு')}</h4>
                          <div className="detail-items">
                            {details.seedSowing.map((item, idx) => (
                              <div key={idx} className="detail-item">
                                <div className="detail-item-header">
                                  <span className="detail-name">{item.name}</span>
                                  <span className="detail-amount">₹{item.amount.toLocaleString()}</span>
                                </div>
                                {item.date && <div className="detail-date">{formatDate(item.date)}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {details.tractor.length > 0 && (
                        <div className="detail-category">
                          <h4>{t('Tracker', 'டிராக்டர்')}</h4>
                          <div className="detail-items">
                            {details.tractor.map((item, idx) => (
                              <div key={idx} className="detail-item">
                                <div className="detail-item-header">
                                  <span className="detail-name">{item.name}</span>
                                  <span className="detail-amount">₹{item.amount.toLocaleString()}</span>
                                </div>
                                <div className="detail-meta">
                                  {item.date && <span>{formatDate(item.date)}</span>}
                                  {item.hours && <span>{item.hours} {t('hours', 'மணி')}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {details.products.length > 0 && (
                        <div className="detail-category">
                          <h4>{t('Agromedical Products', 'வேளாண் மருத்துவ பொருட்கள்')}</h4>
                          <div className="detail-items">
                            {details.products.map((item, idx) => (
                              <div key={idx} className="detail-item">
                                <div className="detail-item-header">
                                  <span className="detail-name">{item.name}</span>
                                  <span className="detail-amount">₹{item.amount.toLocaleString()}</span>
                                </div>
                                <div className="detail-meta">
                                  {item.date && <span>{item.date}</span>}
                                  {item.quantity && <span>{t('Qty', 'அளவு')}: {item.quantity}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {details.cultivation.length > 0 && (
                        <div className="detail-category">
                          <h4>{t('Cultivating Field', 'வயல் உழுது')}</h4>
                          <div className="detail-items">
                            {details.cultivation.map((item, idx) => (
                              <div key={idx} className="detail-item">
                                <div className="detail-item-header">
                                  <span className="detail-name">{item.name}</span>
                                  <span className="detail-amount">₹{item.amount.toLocaleString()}</span>
                                </div>
                                <div className="detail-meta">
                                  {item.date && <span>{item.date}</span>}
                                </div>
                                {item.note && <div className="detail-note">{item.note}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {details.mandi.length > 0 && (
                        <div className="detail-category">
                          <h4>{t('Mandi', 'மண்டி')}</h4>
                          <div className="detail-items">
                            {details.mandi.map((item, idx) => (
                              <div key={idx} className="detail-item">
                                <div className="detail-item-header">
                                  <span className="detail-name">{item.name}</span>
                                  <span className="detail-amount">₹{item.amount.toLocaleString()}</span>
                                </div>
                                <div className="detail-meta">
                                  {item.date && <span>{item.date}</span>}
                                  {item.bags && <span>{item.bags} {t('bags', 'பைகள்')}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {details.seasonReport.length > 0 && (
                        <div className="detail-category income-category">
                          <h4>{t('Season Report (Income)', 'பருவ அறிக்கை (வருமானம்)')}</h4>
                          <div className="detail-items">
                            {details.seasonReport.map((item, idx) => (
                              <div key={idx} className="detail-item income-item">
                                <div className="detail-item-header">
                                  <span className="detail-name">{item.name}</span>
                                  <span className="detail-amount income">₹{item.amount.toLocaleString()}</span>
                                </div>
                                <div className="detail-meta">
                                  {item.date && <span>{formatDate(item.date)}</span>}
                                  {item.yield && <span>{item.yield} {t('bags', 'மூட்டை')}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
          </div>
        </div>
      )}

      {showGraphModal && selectedSeasonForGraph && (
        <div className="modal-overlay" onClick={closeGraphModal}>
          <div className="graph-content" onClick={(e) => e.stopPropagation()}>
            <div className="graph-filters">
                <div className="filter-header">
                  <h2>{t('Season Analysis', 'பருவ பகுப்பாய்வு')}</h2>
                  <button className="close-btn" onClick={closeGraphModal}>✕</button>
                </div>
                <h3>{t('Filter Analysis', 'பகுப்பாய்வு வடிகட்டி')}</h3>
                <div className="filter-row">
                  <div className="filter-group">
                    <label>{t('Season:', 'பருவம்:')}</label>
                    <select 
                      value={graphFilterSeason} 
                      onChange={(e) => setGraphFilterSeason(e.target.value)}
                    >
                      <option value="">{t('All Seasons', 'அனைத்து பருவங்கள்')}</option>
                      {getAllSeasons().map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>{t('Agricultural Product:', 'விவசாய பொருள்:')}</label>
                    <select 
                      value={graphFilterProduct} 
                      onChange={(e) => setGraphFilterProduct(e.target.value)}
                    >
                      <option value="">{t('All Products', 'அனைத்து பொருட்கள்')}</option>
                      {getAllProducts().map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="filter-info">
                  {graphFilterSeason && graphFilterProduct && (
                    <p>{t('Showing:', 'காட்டுகிறது:')} <strong>{graphFilterSeason}</strong> {t('season with', 'பருவம்')} <strong>{graphFilterProduct}</strong></p>
                  )}
                  {graphFilterSeason && !graphFilterProduct && (
                    <p>{t('Showing:', 'காட்டுகிறது:')} <strong>{graphFilterSeason}</strong> {t('season - all products', 'பருவம் - அனைத்து பொருட்கள்')}</p>
                  )}
                  {!graphFilterSeason && graphFilterProduct && (
                    <p>{t('Showing:', 'காட்டுகிறது:')} <strong>{graphFilterProduct}</strong> {t('across all seasons', 'அனைத்து பருவங்களிலும்')}</p>
                  )}
                  {!graphFilterSeason && !graphFilterProduct && (
                    <p>{t('Showing: All seasons and all products', 'காட்டுகிறது: அனைத்து பருவங்கள் மற்றும் அனைத்து பொருட்கள்')}</p>
                  )}
                </div>
              </div>

              {(() => {
                const data = getSeasonHistoricalData(graphFilterSeason, graphFilterProduct);
                
                if (data.length === 0) {
                  return <p className="no-data">{t('No data available for selected filters', 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு தரவு இல்லை')}</p>;
                }

                const maxValue = Math.max(
                  ...data.map(d => Math.max(d.expenses, d.income, Math.abs(d.profit)))
                );

                const bestYear = data.reduce((best, curr) => curr.profit > best.profit ? curr : best);
                const highestProfit = Math.max(...data.map(d => d.profit));

                return (
                  <>
                    <div className="graph-stats">
                      <div className="stat-card">
                        <h4>{t('Years Tracked', 'கண்காணிக்கப்பட்ட ஆண்டுகள்')}</h4>
                        <p className="stat-value">{data.length}</p>
                      </div>
                      <div className="stat-card">
                        <h4>{t('Best Year', 'சிறந்த ஆண்டு')}</h4>
                        <p className="stat-value">{bestYear.season} {bestYear.year}</p>
                      </div>
                      <div className="stat-card">
                        <h4>{t('Highest Profit', 'அதிக லாபம்')}</h4>
                        <p className="stat-value profit">₹{highestProfit.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="graph-section">
                      <h3>{t('Financial Trends', 'நிதி போக்குகள்')}</h3>
                      <div className="bar-chart">
                        {data.map((item, idx) => (
                          <div key={idx} className="bar-group">
                            <div className="bar-label">{item.season} {item.year}</div>
                            <div className="bars-container">
                              <div className="bar-wrapper">
                                <div 
                                  className="bar expenses-bar"
                                  style={{ height: `${(item.expenses / maxValue) * 200}px` }}
                                  title={`${t('Expenses', 'செலவுகள்')}: ₹${item.expenses.toLocaleString()}`}
                                >
                                  <span className="bar-value">₹{(item.expenses / 1000).toFixed(1)}k</span>
                                </div>
                              </div>
                              <div className="bar-wrapper">
                                <div 
                                  className="bar income-bar"
                                  style={{ height: `${(item.income / maxValue) * 200}px` }}
                                  title={`${t('Income', 'வருமானம்')}: ₹${item.income.toLocaleString()}`}
                                >
                                  <span className="bar-value">₹{(item.income / 1000).toFixed(1)}k</span>
                                </div>
                              </div>
                              <div className="bar-wrapper">
                                <div 
                                  className={`bar profit-bar ${item.profit < 0 ? 'loss' : ''}`}
                                  style={{ height: `${(Math.abs(item.profit) / maxValue) * 200}px` }}
                                  title={`${t('Profit/Loss', 'லாபம்/நஷ்டம்')}: ₹${item.profit.toLocaleString()}`}
                                >
                                  <span className="bar-value">₹{(item.profit / 1000).toFixed(1)}k</span>
                                </div>
                              </div>
                            </div>
                            <div className="bar-legend">
                              <span className="legend-item expenses">{t('Exp', 'செலவு')}</span>
                              <span className="legend-item income">{t('Inc', 'வருமானம்')}</span>
                              <span className="legend-item profit">{t('P/L', 'லா/ந')}</span>
                            </div>
                            <button 
                              className="bar-detail-btn"
                              onClick={() => viewDetailedRecords(item.season, item.year)}
                              title={t('View records for this season', 'இந்த பருவத்தின் பதிவுகளைக் காண்க')}
                            >
                              📋 {t('Details', 'விவரம்')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="data-table">
                      <h3>{t('Detailed Data', 'விரிவான தரவு')}</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>{t('Season', 'பருவம்')}</th>
                            <th>{t('Year', 'ஆண்டு')}</th>
                            <th>{t('Expenses', 'செலவுகள்')}</th>
                            <th>{t('Income', 'வருமானம்')}</th>
                            <th>{t('Profit/Loss', 'லாபம்/நஷ்டம்')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong>{item.season}</strong></td>
                              <td><strong>{item.year}</strong></td>
                              <td className="expense-cell">₹{item.expenses.toLocaleString()}</td>
                              <td className="income-cell">₹{item.income.toLocaleString()}</td>
                              <td className={item.profit >= 0 ? 'profit-cell' : 'loss-cell'}>
                                ₹{item.profit.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      )}

      <div className="results-section">
        <div className="tabs-section">
          <div className="tabs">
            <button 
              className={activeTab === 'creator' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('creator')}
            >
               {t('Seed Sowing', 'விதை விதைப்பு')}
            </button>
            <button 
              className={activeTab === 'tractor' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('tractor')}
            >
               {t('Tracker', 'டிராக்டர்')}
            </button>
            <button 
              className={activeTab === 'products' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('products')}
            >
               {t('Agromedical Products', 'வேளாண் மருத்துவ பொருட்கள்')}
            </button>
            <button 
              className={activeTab === 'cultivation' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('cultivation')}
            >
               {t('Cultivating Field', 'வயல் உழுது')}
            </button>
            <button 
              className={activeTab === 'kamitty' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('kamitty')}
            >
               {t('Mandi', 'மண்டி')}
            </button>
            <button 
              className={activeTab === 'review' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('review')}
            >
               {t('Review History', 'மதிப்பாய்வு வரலாறு')}
            </button>
            <button 
              className={activeTab === 'seasonReport' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('seasonReport')}
            >
               {t('Season Report', 'பருவ அறிக்கை')}
            </button>
          </div>
        </div>
        
        <h3>{t('Results', 'முடிவுகள்')} ({getCurrentEntries().length})</h3>
        
        {loading ? (
          <p className="loading"> {t('Loading...', 'ஏற்றப்படுகிறது...')}</p>
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
