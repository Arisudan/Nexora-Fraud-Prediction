// FILE: components/FraudReportForm.js
// Form component for submitting fraud reports

import { useState } from 'react';
import { fraudAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiSend, FiLoader } from 'react-icons/fi';

const ENTITY_TYPES = [
  { value: 'phone', label: 'Phone Number' },
  { value: 'email', label: 'Email Address' },
  { value: 'upi', label: 'UPI ID' },
];

const CATEGORIES = [
  'Phishing',
  'Identity Theft',
  'Financial Fraud',
  'Spam',
  'Harassment',
  'Fake Lottery',
  'Investment Scam',
  'Romance Scam',
  'Tech Support Scam',
  'Other',
];

export default function FraudReportForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetEntity: '',
    entityType: 'phone',
    category: 'Phishing',
    description: '',
    evidence: '',
    amountLost: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.targetEntity.trim()) {
      newErrors.targetEntity = 'Target entity is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.amountLost && isNaN(Number(formData.amountLost))) {
      newErrors.amountLost = 'Amount must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const reportData = {
        ...formData,
        amountLost: formData.amountLost ? Number(formData.amountLost) : 0,
      };

      const response = await fraudAPI.submitReport(reportData);
      
      if (response.success) {
        toast.success('Fraud report submitted successfully!');
        // Reset form
        setFormData({
          targetEntity: '',
          entityType: 'phone',
          category: 'Phishing',
          description: '',
          evidence: '',
          amountLost: '',
        });
        if (onSuccess) onSuccess(response.data.report);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <FiAlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Report Fraud</h2>
          <p className="text-gray-500 text-sm">Help protect others by reporting suspicious activity</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Entity Type & Target */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="entityType"
              value={formData.entityType}
              onChange={handleChange}
              className="input-field"
            >
              {ENTITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone/Email/UPI ID/Account Number *
            </label>
            <input
              type="text"
              name="targetEntity"
              value={formData.targetEntity}
              onChange={handleChange}
              placeholder="Enter the fraudulent entity"
              className={`input-field ${errors.targetEntity ? 'input-error' : ''}`}
            />
            {errors.targetEntity && (
              <p className="text-red-500 text-sm mt-1">{errors.targetEntity}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fraud Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Note: Phishing and Identity Theft reports carry higher weight in our scoring system
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe what happened, how you were contacted, what they asked for..."
            className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Evidence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evidence (Optional)
          </label>
          <textarea
            name="evidence"
            value={formData.evidence}
            onChange={handleChange}
            rows={3}
            placeholder="Paste any messages, URLs, or additional evidence..."
            className="input-field resize-none"
          />
        </div>

        {/* Amount Lost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Lost (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="text"
              name="amountLost"
              value={formData.amountLost}
              onChange={handleChange}
              placeholder="0"
              className={`input-field pl-8 ${errors.amountLost ? 'input-error' : ''}`}
            />
          </div>
          {errors.amountLost && (
            <p className="text-red-500 text-sm mt-1">{errors.amountLost}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <FiSend className="w-5 h-5" />
              Submit Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
