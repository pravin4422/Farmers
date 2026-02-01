import React, { useState } from 'react';
import { PlusCircle, Search, Calendar, X } from 'lucide-react';
import '../../css/Schemes/Scheme.css';

const initialSchemes = [
  {
    id: 1,
    name: "Sub‑Mission on Agricultural Mechanization",
    category: "Farm Mechanization",
    image: "/assets/schemes/mechanization.jpg",
    startDate: "2014-01-01",
    endDate: null,
    details: {
      launch: "2014",
      objective: "Subsidies and custom hiring for farm machinery",
      eligibility: "All farmers; rural entrepreneurs, FPOs, cooperatives for Custom Hiring Centres (CHCs)",
      benefit: "Subsidy on machinery; field demonstrations; CHC setup",
      apply: "Visit your local Agriculture Engineering Department (AED) or Panchayat. Forms available offline.",
      documents: "Aadhaar, land proof, bank details, credentials for entrepreneurs/FPOs.",
      website: "https://aed.tn.gov.in",
      applicationMode: "Offline"
    }
  },
  {
    id: 2,
    name: "Pradhan Mantri Kisan Samman Nidhi",
    category: "Income Support",
    image: "/assets/schemes/pm-kisan.jpg",
    startDate: "2019-02-01",
    endDate: null,
    details: {
      launch: "2019",
      objective: "Provide direct income support to small and marginal farmers.",
      benefit: "₹6,000 per year in 3 equal installments.",
      eligibility: "All landholding farmer families (except taxpayers and certain professionals).",
      apply: "Online at pmkisan.gov.in or through the local Patwari or CSC.",
      documents: "Aadhaar, bank account, land records.",
      website: "https://pmkisan.gov.in",
      applicationMode: "Online/Offline"
    }
  },
  {
    id: 3,
    name: "Pradhan Mantri Fasal Bima Yojana",
    category: "Insurance",
    image: "/assets/schemes/pmfby.jpg",
    startDate: "2016-01-01",
    endDate: null,
    details: {
      launch: "2016",
      objective: "Insurance against crop failure due to natural calamities.",
      benefit: "Premium: Kharif 2%, Rabi 1.5%, Commercial 5%.",
      eligibility: "All farmers including tenants and sharecroppers.",
      apply: "Via banks, CSCs, or the PMFBY portal.",
      documents: "Aadhaar, bank account, land details, sowing certificate.",
      website: "https://pmfby.gov.in",
      applicationMode: "Online"
    }
  },
  {
    id: 4,
    name: "Old Agricultural Scheme",
    category: "Farm Mechanization",
    image: "/assets/schemes/old.jpg",
    startDate: "2010-01-01",
    endDate: "2020-12-31",
    details: {
      launch: "2010",
      objective: "This was a test scheme that ended in 2020",
      benefit: "Historical scheme for reference",
      eligibility: "Scheme has ended",
      apply: "No longer accepting applications",
      documents: "N/A",
      website: "https://example.com",
      applicationMode: "Offline"
    }
  }
];

function Schemes() {
  const [schemes, setSchemes] = useState(initialSchemes);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [schemeStatus, setSchemeStatus] = useState("ongoing");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newScheme, setNewScheme] = useState({
    name: "",
    category: "",
    startDate: "",
    endDate: "",
    details: {
      launch: "",
      objective: "",
      benefit: "",
      eligibility: "",
      apply: "",
      documents: "",
      website: "",
      applicationMode: "Offline"
    }
  });

  const categories = ["All", ...new Set(schemes.map(s => s.category))];

  const isSchemeActive = (scheme) => {
    if (!scheme.endDate) return true;
    const today = new Date();
    const endDate = new Date(scheme.endDate);
    return endDate >= today;
  };

  const filtered = schemes.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    const matchesStatus = schemeStatus === "ongoing" ? isSchemeActive(s) : !isSchemeActive(s);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const searchGoogle = name => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(name + " farmer scheme India")}`, '_blank');
  };

  const handleAddScheme = () => {
    if (!newScheme.name || !newScheme.startDate || !newScheme.endDate) {
      alert('Please fill in Scheme Name, Start Date, and End Date (required fields)');
      return;
    }

    const newId = Math.max(...schemes.map(s => s.id), 0) + 1;
    setSchemes([...schemes, { 
      ...newScheme, 
      id: newId,
      image: "/assets/schemes/default.jpg",
      details: {
        ...newScheme.details,
        launch: newScheme.startDate ? new Date(newScheme.startDate).getFullYear().toString() : ""
      }
    }]);
    setShowAddModal(false);
    setNewScheme({
      name: "",
      category: "",
      startDate: "",
      endDate: "",
      details: {
        launch: "",
        objective: "",
        benefit: "",
        eligibility: "",
        apply: "",
        documents: "",
        website: "",
        applicationMode: "Offline"
      }
    });
  };

  const handleInputChange = (field, value) => {
    setNewScheme(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailsChange = (field, value) => {
    setNewScheme(prev => ({
      ...prev,
      details: { ...prev.details, [field]: value }
    }));
  };

  return (
    <div className="schemes-wrapper">
      <div className="schemes-header-container">
        <div className="schemes-header">
          <div className="header-icon"></div>
          <h1>Government Schemes for Farmers</h1>
          <p>Explore various government schemes designed to support farmers across India and Tamil Nadu</p>
        </div>
      </div>

      
      <div className="schemes-controls-container">
        <div className="schemes-controls">
          
          <div className="search-add-section">
            <div className="search-wrapper">
              <div className="search-input-container">
                <Search className="search-icon" size={20} />
                <input
                  type="search"
                  placeholder="Search schemes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button onClick={() => setShowAddModal(true)} className="add-scheme-btn">
                <PlusCircle size={20} />
                Add New Scheme
              </button>
            </div>
          </div>

          
          <div className="filters-section">
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="status-toggle">
              <button
                onClick={() => setSchemeStatus("ongoing")}
                className={`status-btn ${schemeStatus === "ongoing" ? "active" : ""}`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setSchemeStatus("old")}
                className={`status-btn ${schemeStatus === "old" ? "active" : ""}`}
              >
                Old Schemes
              </button>
            </div>
          </div>

          
          <div className="schemes-stats">
            Showing {filtered.length} of {schemes.length} schemes
          </div>
        </div>
      </div>

     
      <div className="schemes-grid-container">
        <div className="schemes-grid">
          {filtered.map((scheme) => (
            <div key={scheme.id} className="scheme-card">
              <div className="scheme-image" onClick={() => toggle(scheme.id)}>
                <div className="scheme-category-badge">{scheme.category}</div>
                <div className="expand-indicator">
                  {expandedId === scheme.id ? '−' : '+'}
                </div>
                <div className="scheme-icon">📋</div>
              </div>

              <div className="scheme-content">
                <h3 className="scheme-title" onClick={() => toggle(scheme.id)}>
                  {scheme.name}
                </h3>

                {scheme.startDate && (
                  <div className="scheme-dates">
                    <Calendar size={14} />
                    <span>Start: {new Date(scheme.startDate).toLocaleDateString()}</span>
                    {scheme.endDate && (
                      <span>• End: {new Date(scheme.endDate).toLocaleDateString()}</span>
                    )}
                  </div>
                )}

                {expandedId === scheme.id && (
                  <div className="scheme-details">
                    {Object.entries(scheme.details).map(([key, value]) => value && (
                      <div key={key} className="detail-item">
                        <span className="detail-label">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <p className="detail-value">{value}</p>
                      </div>
                    ))}

                    <div className="scheme-actions">
                      <button onClick={() => searchGoogle(scheme.name)} className="action-btn search-btn">
                        🔍 Search
                      </button>
                      {scheme.details.website && (
                        <a
                          href={scheme.details.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn website-btn"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon"></div>
            <h3>No schemes found</h3>
            <p>Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>

      {/* Add Scheme Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="modal-close">
              <X size={24} />
            </button>

            <h2 className="modal-title">Add New Scheme</h2>

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  Scheme Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newScheme.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input"
                  placeholder="Enter scheme name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category (Optional)</label>
                <input
                  type="text"
                  value={newScheme.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Farm Mechanization"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Start Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={newScheme.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    End Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={newScheme.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objective (Optional)</label>
                <textarea
                  value={newScheme.details.objective}
                  onChange={(e) => handleDetailsChange('objective', e.target.value)}
                  className="form-textarea"
                  placeholder="Enter scheme objective"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Benefit (Optional)</label>
                <textarea
                  value={newScheme.details.benefit}
                  onChange={(e) => handleDetailsChange('benefit', e.target.value)}
                  className="form-textarea"
                  placeholder="Enter benefits"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Eligibility (Optional)</label>
                <textarea
                  value={newScheme.details.eligibility}
                  onChange={(e) => handleDetailsChange('eligibility', e.target.value)}
                  className="form-textarea"
                  placeholder="Who can apply?"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website (Optional)</label>
                <input
                  type="url"
                  value={newScheme.details.website}
                  onChange={(e) => handleDetailsChange('website', e.target.value)}
                  className="form-input"
                  placeholder="https://example.com"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleAddScheme} className="submit-btn">
                  Add Scheme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schemes;