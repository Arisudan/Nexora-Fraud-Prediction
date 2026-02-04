// FILE: components/RiskChecker.js
// Component for checking fraud risk of an entity

import { useState } from 'react';
import { riskAPI } from '../lib/api';
import toast from 'react-hot-toast';
import RiskMeter from './RiskMeter';
import { FiSearch, FiLoader, FiShield } from 'react-icons/fi';

const ENTITY_TYPES = [
  { value: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
  { value: 'email', label: 'Email', placeholder: 'Enter email address' },
  { value: 'upi', label: 'UPI ID', placeholder: 'Enter UPI ID' },
];

export default function RiskChecker({ onBlock, onMarkSafe }) {
  const [entity, setEntity] = useState('');
  const [entityType, setEntityType] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [error, setError] = useState('');

  const selectedType = ENTITY_TYPES.find(t => t.value === entityType);

  const handleCheck = async (e) => {
    e.preventDefault();
    
    if (!entity.trim()) {
      setError('Please enter a value to check');
      return;
    }

    setError('');
    setLoading(true);
    setRiskData(null);

    try {
      const response = await riskAPI.checkRisk(entity.trim(), entityType);
      
      if (response.success) {
        setRiskData(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to check risk');
      setError(error.message || 'Failed to check risk');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = (targetEntity) => {
    if (onBlock) {
      onBlock(targetEntity, entityType);
    }
  };

  const handleMarkSafe = (targetEntity) => {
    if (onMarkSafe) {
      onMarkSafe(targetEntity, entityType);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <FiShield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Check Fraud Risk</h2>
            <p className="text-gray-500">Verify if a phone, email, or UPI ID is safe</p>
          </div>
        </div>

        <form onSubmit={handleCheck} className="space-y-4">
          {/* Entity Type Tabs */}
          <div className="flex flex-wrap gap-2">
            {ENTITY_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setEntityType(type.value);
                  setRiskData(null);
                }}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  entityType === type.value
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={entity}
                onChange={(e) => {
                  setEntity(e.target.value);
                  setError('');
                }}
                placeholder={selectedType?.placeholder}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiSearch className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">Check</span>
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </form>

        {/* Quick Stats */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            🛡️ Powered by Crowd Intelligence • Real-time community reports • Updated every minute
          </p>
        </div>
      </div>

      {/* Risk Result */}
      {(loading || riskData) && (
        <div className="animate-fadeIn">
          <RiskMeter 
            riskData={riskData} 
            loading={loading}
            onBlock={handleBlock}
            onMarkSafe={handleMarkSafe}
          />
        </div>
      )}
    </div>
  );
}
