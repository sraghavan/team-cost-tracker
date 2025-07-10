import React, { useState } from 'react';
import './PaymentForm.css';

const PaymentForm = ({ players, onAddPayment }) => {
  const [formData, setFormData] = useState({
    playerId: '',
    amount: '',
    type: 'payment',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.playerId || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const payment = {
      id: Date.now().toString() + Math.random(),
      playerId: formData.playerId,
      amount: parseFloat(formData.amount),
      type: formData.type,
      description: formData.description,
      date: new Date().toISOString()
    };

    onAddPayment(payment);
    setFormData({
      playerId: '',
      amount: '',
      type: 'payment',
      description: ''
    });
  };

  return (
    <div className="payment-form">
      <h3>Record Payment</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Player:</label>
          <select
            value={formData.playerId}
            onChange={(e) => setFormData({...formData, playerId: e.target.value})}
            required
          >
            <option value="">Select player</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label>Type:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="payment">Payment</option>
              <option value="advance">Advance</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description (optional):</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Payment description"
          />
        </div>

        <button type="submit" className="submit-btn">Record Payment</button>
      </form>
    </div>
  );
};

export default PaymentForm;