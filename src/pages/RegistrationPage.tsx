// src/pages/RegistrationPage.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ArrowRight, Check } from 'lucide-react';
import { searchAddresses } from '../services/addressService';
import { AddressSuggestion } from '../types';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface RegistrationPageProps {
  onRegister: () => void;
  onLoginClick: () => void;
}

export const RegistrationPage = ({ onRegister, onLoginClick }: RegistrationPageProps) => {
  const [formData, setFormData] = useLocalStorage('buildingID_formData', {
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast, showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddressChange = async (value: string) => {
    setAddressQuery(value);
    if (value.length >= 2) {
      const results = await searchAddresses(value);
      setAddressSuggestions(results);
      setShowSuggestions(true);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectAddress = (address: AddressSuggestion) => {
    setAddressQuery(address.fullAddress);
    setFormData({ ...formData, address: address.fullAddress });
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.email?.includes('@')) newErrors.email = 'Valid email is required';
    if (!addressQuery.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors above', 'error');
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    onRegister();
    showToast('Registration successful!', 'success');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface px-6 py-4 flex justify-between items-center">
        <img src="/logo.png" alt="BuildingID" className="h-10 w-auto" onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=B';
        }} />
        <button 
          onClick={onLoginClick}
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/80 transition-all"
        >
          Login
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 pb-32">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <input 
              placeholder="Full Name *" 
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className={`w-full bg-gray-100 p-3 rounded-xl ${errors.fullName ? 'border-2 border-red-500' : ''}`}
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>
          
          <div>
            <input 
              placeholder="Phone Number *" 
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              className={`w-full bg-gray-100 p-3 rounded-xl ${errors.phoneNumber ? 'border-2 border-red-500' : ''}`}
            />
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>
          
          <div>
            <input 
              placeholder="Email *" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={`w-full bg-gray-100 p-3 rounded-xl ${errors.email ? 'border-2 border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          
          <div className="relative">
            <input 
              placeholder="Address * (start typing to search)" 
              value={addressQuery}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={`w-full bg-gray-100 p-3 rounded-xl ${errors.address ? 'border-2 border-red-500' : ''}`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-xl mt-1 shadow-lg max-h-60 overflow-auto">
                {addressSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => selectAddress(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                  >
                    <div className="font-medium">{suggestion.street} {suggestion.houseNumber}</div>
                    <div className="text-xs text-gray-500">{suggestion.postalCode} {suggestion.city}</div>
                    <div className="text-xs text-gray-400">{suggestion.neighborhood}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? 'Processing...' : 'Register'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => {}}} /></AnimatePresence>
    </div>
  );
};