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
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
          <FiAlertTriangle className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Fraud</h2>
          <p className="text-gray-500">Help protect others by reporting suspicious activity</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Entity Type & Target */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type
            </label>
            <select
              name="entityType"
              value={formData.entityType}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none bg-white"
            >
              {ENTITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone/Email/UPI ID *
            </label>
            <input
              type="text"
              name="targetEntity"
              value={formData.targetEntity}
              onChange={handleChange}
              placeholder="Enter the fraudulent entity"
              className={`w-full px-4 py-3 border-2 rounded-xl transition-all outline-none focus:ring-4 ${
                errors.targetEntity 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
              }`}
            />
            {errors.targetEntity && (
              <p className="text-red-500 text-sm mt-1">{errors.targetEntity}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fraud Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none bg-white"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ Phishing and Identity Theft reports carry higher weight in our scoring system
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe what happened, how you were contacted, what they asked for..."
            className={`w-full px-4 py-3 border-2 rounded-xl resize-none transition-all outline-none focus:ring-4 ${
              errors.description 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Evidence */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Evidence <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            name="evidence"
            value={formData.evidence}
            onChange={handleChange}
            rows={3}
            placeholder="Paste any messages, URLs, or additional evidence..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
          />
        </div>

        {/* Amount Lost */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Amount Lost <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input
              type="text"
              name="amountLost"
              value={formData.amountLost}
              onChange={handleChange}
              placeholder="0"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all outline-none focus:ring-4 ${
                errors.amountLost 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
              }`}
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
          className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
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
