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
  { value: 'bank', label: 'Bank Account', placeholder: 'Enter account number' },
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
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <FiShield className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Check Fraud Risk</h2>
            <p className="text-gray-500 text-sm">Verify if a phone, email, or UPI ID is safe</p>
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
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  entityType === type.value
                    ? 'bg-primary-600 text-white shadow-md'
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
                className="input-field pl-12 py-3.5 text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 flex items-center gap-2"
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
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
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
