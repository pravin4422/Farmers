import React, { useState, useEffect } from 'react';
import '../../css/Mainpages/AgromedicalProducts.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function AgromedicalProducts() {
  const [products, setProducts] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);
  const [date, setDate] = useState('');
  const [day, setDay] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Replace with your actual API base URL
  const API_BASE_URL = 'http://localhost:5000/api'; // Update this to your backend URL

  const translations = {
    en: {
      title: ' Agromedical Products',
      date: 'Date',
      day: 'Day',
      name: 'Product Name',
      quantity: 'Quantity',
      cost: 'Cost per Unit',
      total: 'Total',
      addProduct: 'Add Product',
      updateProduct: 'Update',
      filterMonth: 'Filter by Month',
      filterYear: 'Filter by Year',
      filterDate: 'Filter by Date',
      exportExcel: ' Excel',
      exportPDF: ' PDF',
      print: ' Print',
      totalCost: 'Total Cost',
      edit: ' Edit',
      delete: ' Delete',
      printedOn: 'Printed on',
      signature: 'Signature',
      lastEntry: 'Latest Entry',
      viewHistory: ' View History',
      backToLatest: ' Back to Latest',
      clearFilters: ' Clear Filters',
      noRecords: 'No records found',
      loading: 'Loading...',
      error: 'Error occurred',
      saveSuccess: 'Data saved successfully!',
      deleteSuccess: 'Record deleted successfully!',
      updateSuccess: 'Record updated successfully!'
    },
    ta: {
      title: ' வேளாண் மருத்துவ பொருட்கள்',
      date: 'தேதி',
      day: 'நாள்',
      name: 'பொருளின் பெயர்',
      quantity: 'அளவு',
      cost: 'ஒரு பொருளுக்கான செலவு',
      total: 'மொத்தம்',
      addProduct: 'பொருள் சேர்க்க',
      updateProduct: 'புதுப்பி',
      filterMonth: 'மாதம் மூலம் வடிகட்டு',
      filterYear: 'வருடம் மூலம் வடிகட்டு',
      filterDate: 'தேதி மூலம் வடிகட்டு',
      exportExcel: ' எக்செல்',
      exportPDF: ' PDF',
      print: ' அச்சிடு',
      totalCost: 'மொத்த செலவு',
      edit: ' திருத்து',
      delete: ' நீக்கு',
      printedOn: 'அச்சிடப்பட்ட தேதி',
      signature: 'கையொப்பம்',
      lastEntry: 'சமீபத்திய பதிவு',
      viewHistory: ' வரலாறு பார்க்க',
      backToLatest: ' சமீபத்தியதற்கு திரும்பு',
      clearFilters: ' வடிகட்டிகளை அழி',
      noRecords: 'பதிவுகள் இல்லை',
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை ஏற்பட்டது',
      saveSuccess: 'தரவு வெற்றிகரமாக சேமிக்கப்பட்டது!',
      deleteSuccess: 'பதிவு வெற்றிகரமாக நீக்கப்பட்டது!',
      updateSuccess: 'பதிவு வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'
    },
  };

  const t = translations[language];

  // API Functions
  const saveToDatabase = async (productData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      const result = await response.json();
      setError('');
      showMessage(t.saveSuccess);
      return result;
    } catch (err) {
      setError(t.error + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInDatabase = async (id, productData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      const result = await response.json();
      setError('');
      showMessage(t.updateSuccess);
      return result;
    } catch (err) {
      setError(t.error + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFromDatabase = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setError('');
      showMessage(t.deleteSuccess);
    } catch (err) {
      setError(t.error + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchFromDatabase = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.date) params.append('date', filters.date);
      
      const response = await fetch(`${API_BASE_URL}/products?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      setError('');
      return result;
    } catch (err) {
      setError(t.error + ': ' + err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestEntry = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/latest`);
      
      if (!response.ok) throw new Error('Failed to fetch latest');
      
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error fetching latest entry:', err);
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
    
    const data = await fetchFromDatabase(filters);
    setProducts(data);
  };

  useEffect(() => {
    if (showHistoryView) {
      loadHistoryData();
    }
  }, [showHistoryView, filterMonth, filterYear, filterDate]);

  const showMessage = (message) => {
    // You can implement a toast notification here
    alert(message); // Simple alert for now
  };

  const resetForm = () => {
    setDate('');
    setDay('');
    setName('');
    setQuantity('');
    setCost('');
    setEditingIndex(null);
    setEditingId(null);
  };

  const addProduct = async () => {
    if (!date || !day || !name || !quantity || !cost) return;

    const newEntry = {
      date,
      day,
      name,
      quantity: parseFloat(quantity),
      cost: parseFloat(cost),
      total: parseFloat(quantity) * parseFloat(cost),
    };

    try {
      if (editingId) {
        // Update existing record
        await updateInDatabase(editingId, newEntry);
      } else {
        // Add new record
        await saveToDatabase(newEntry);
      }

      resetForm();
      
      // Refresh the latest entry
      await loadLatestEntry();
      
      // If in history view, refresh the history data
      if (showHistoryView) {
        await loadHistoryData();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const editProduct = (item) => {
    setDate(item.date);
    setDay(item.day);
    setName(item.name);
    setQuantity(item.quantity.toString());
    setCost(item.cost.toString());
    setEditingId(item.id || item._id); // Handle both SQL and MongoDB IDs
    setEditingIndex(item.id || item._id);
  };

  const deleteProduct = async (item) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteFromDatabase(item.id || item._id);
        
        // Refresh data
        if (showHistoryView) {
          await loadHistoryData();
        } else {
          await loadLatestEntry();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const exportToExcel = () => {
    const dataToExport = showHistoryView ? products : (lastEntry ? [lastEntry] : []);
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AgroProducts');
    XLSX.writeFile(wb, `AgromedicalProducts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dataToExport = showHistoryView ? products : (lastEntry ? [lastEntry] : []);
    
    doc.text(`${t.title} - ${showHistoryView ? 'History' : 'Latest Entry'}`, 14, 15);
    
    const tableData = dataToExport.map((p) => [
      p.date,
      p.day,
      p.name,
      p.quantity,
      p.cost,
      p.total,
    ]);
    
    doc.autoTable({
      head: [[t.date, t.day, t.name, t.quantity, t.cost, t.total]],
      body: tableData,
      startY: 20,
    });
    
    doc.text(`${t.printedOn}: ${new Date().toLocaleDateString()}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(`${t.signature}: __________________`, 14, doc.lastAutoTable.finalY + 20);
    doc.save(`AgromedicalProducts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-section');
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${t.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin: 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 40px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>${t.title} - ${showHistoryView ? 'History' : 'Latest Entry'}</h2>
          ${printContent.innerHTML}
          <div class="footer">
            ${t.printedOn}: ${new Date().toLocaleDateString()}<br/>
            ${t.signature}: ________________________
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
  };

  const currentData = showHistoryView ? products : (lastEntry ? [lastEntry] : []);
  const totalCost = currentData.reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div className="agromedical-container">
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}>
           {language === 'en' ? 'தமிழ்' : 'English'}
        </button>
      </div>

      <h1>{t.title}</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          {t.loading}
        </div>
      )}

      <div className="form-section">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            const d = new Date(e.target.value);
            const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
            setDay(dayName);
          }}
        />
        <input type="text" placeholder={t.day} value={day} readOnly />
        <input type="text" placeholder={t.name} value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" placeholder={t.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <input type="number" placeholder={t.cost} value={cost} onChange={(e) => setCost(e.target.value)} />
        <button onClick={addProduct} disabled={loading}>
          {editingId ? t.updateProduct : t.addProduct}
        </button>
      </div>

      <div className="view-toggle">
        <button 
          onClick={() => setShowHistoryView(!showHistoryView)}
          className="toggle-btn"
        >
          {showHistoryView ? t.backToLatest : t.viewHistory}
        </button>
      </div>

      {showHistoryView && (
        <div className="filter-bar">
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            placeholder={t.filterDate}
          />
          <input 
            type="month" 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            placeholder={t.filterMonth}
          />
          <input 
            type="number" 
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
            placeholder={t.filterYear}
            min="2000" 
            max="2100"
          />
          <button onClick={clearFilters}>{t.clearFilters}</button>
          <button onClick={exportToExcel}>{t.exportExcel}</button>
          <button onClick={exportToPDF}>{t.exportPDF}</button>
          <button onClick={handlePrint}>{t.print}</button>
        </div>
      )}

      {!showHistoryView && (
        <div className="export-bar">
          <button onClick={exportToExcel}>{t.exportExcel}</button>
          <button onClick={exportToPDF}>{t.exportPDF}</button>
          <button onClick={handlePrint}>{t.print}</button>
        </div>
      )}

      <div className="section-header">
        <h2>{showHistoryView ? t.viewHistory : t.lastEntry}</h2>
      </div>

      <div id="print-section">
        <table>
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.day}</th>
              <th>{t.name}</th>
              <th>{t.quantity}</th>
              <th>{t.cost}</th>
              <th>{t.total}</th>
              {showHistoryView && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={showHistoryView ? 7 : 6} style={{ textAlign: 'center' }}>
                  {t.noRecords}
                </td>
              </tr>
            ) : (
              currentData.map((item, index) => (
                <tr key={item.id || item._id || index}>
                  <td>{item.date}</td>
                  <td>{item.day}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.cost}</td>
                  <td>₹{item.total}</td>
                  {showHistoryView && (
                    <td>
                      <button onClick={() => editProduct(item)}>{t.edit}</button>
                      <button onClick={() => deleteProduct(item)}>{t.delete}</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="agromedical-grid">
        {currentData.map((item, index) => (
          <div key={item.id || item._id || index} className="product-card">
            <p><strong>{t.date}:</strong> {item.date}</p>
            <p><strong>{t.day}:</strong> {item.day}</p>
            <p><strong>{t.name}:</strong> {item.name}</p>
            <p><strong>{t.quantity}:</strong> {item.quantity}</p>
            <p><strong>{t.cost}:</strong> ₹{item.cost}</p>
            <p><strong>{t.total}:</strong> ₹{item.total}</p>
            {showHistoryView && (
              <div className="actions">
                <button onClick={() => editProduct(item)}>{t.edit}</button>
                <button onClick={() => deleteProduct(item)}>{t.delete}</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="total-section">
        <h2>{t.totalCost}: ₹{totalCost.toFixed(2)}</h2>
      </div>
    </div>
  );
}

export default AgromedicalProducts;