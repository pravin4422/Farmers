import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AdminDashboard() {
  const [validatorStatus, setValidatorStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await api.get('/validator/check-admin-status');
        setValidatorStatus(response.data);
        
        if (!response.data.isAdmin) {
          alert('Access denied. You do not have admin privileges.');
          navigate('/home');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/login');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (!validatorStatus) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Your Admin Status:</h2>
        <p><strong>Agricultural Officer:</strong> {validatorStatus.isAgriculturalOfficer ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Senior Expert:</strong> {validatorStatus.isSeniorExpert ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Crop Expert:</strong> {validatorStatus.isCropExpert ? '✅ Yes' : '❌ No'}</p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>Admin Functions:</h3>
        <button onClick={() => navigate('/home')} style={{ padding: '10px 20px', margin: '5px' }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
