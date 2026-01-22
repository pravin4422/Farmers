import React, { useState } from 'react';
import '../../css/AgroChemicals/Adjuvants.css';

function Adjuvants() {
  const [adjuvants, setAdjuvants] = useState([
    {
      id: 1,
      name: "SurfMax Pro",
      image: "/assets/adjuvants/surfmax.jpg",
      category: "Surfactant",
      content: "Non-ionic surfactant that improves wetting and spreading of spray solutions.",
      activeIngredient: "Polyoxyethylene alkyl ether",
      concentration: "80% EC",
      applicationRate: "0.5-1 ml/L"
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    category: '',
    content: '',
    activeIngredient: '',
    concentration: '',
    applicationRate: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setAdjuvants(adjuvants.map(item => 
        item.id === editingId ? { ...formData, id: editingId } : item
      ));
      setEditingId(null);
    } else {
      setAdjuvants([...adjuvants, { ...formData, id: Date.now() }]);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setAdjuvants(adjuvants.filter(item => item.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      category: '',
      content: '',
      activeIngredient: '',
      concentration: '',
      applicationRate: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const filteredAdjuvants = adjuvants.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="adjuvants-library">
      <div className="library-header">
        <h1>Adjuvants Library</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={() => setShowForm(!showForm)} className="add-button">
            {showForm ? 'Cancel' : '+ Add New'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="library-form">
          <div className="form-grid">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={formData.category}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="image"
              placeholder="Image URL"
              value={formData.image}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="activeIngredient"
              placeholder="Active Ingredient"
              value={formData.activeIngredient}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="concentration"
              placeholder="Concentration"
              value={formData.concentration}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="applicationRate"
              placeholder="Application Rate"
              value={formData.applicationRate}
              onChange={handleInputChange}
            />
          </div>
          <textarea
            name="content"
            placeholder="Description"
            value={formData.content}
            onChange={handleInputChange}
            required
          />
          <div className="form-actions">
            <button type="submit" className="submit-button">
              {editingId ? 'Update' : 'Add'} Product
            </button>
            <button type="button" onClick={resetForm} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="library-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Active Ingredient</th>
              <th>Concentration</th>
              <th>Application Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdjuvants.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td><span className="category-badge">{item.category}</span></td>
                <td>{item.activeIngredient}</td>
                <td>{item.concentration}</td>
                <td>{item.applicationRate}</td>
                <td className="action-buttons">
                  <button onClick={() => handleEdit(item)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAdjuvants.length === 0 && (
          <div className="no-results">No items found</div>
        )}
      </div>
    </div>
  );
}

export default Adjuvants;
