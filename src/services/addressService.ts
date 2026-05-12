// src/services/addressService.ts
import { SAMPLE_ADDRESSES } from '../constants';
import { AddressSuggestion } from '../types';

export const searchAddresses = (query: string): Promise<AddressSuggestion[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query || query.length < 2) {
        resolve([]);
        return;
      }
      
      const lowerQuery = query.toLowerCase();
      const results = SAMPLE_ADDRESSES.filter((address: AddressSuggestion) => 
        address.fullAddress.toLowerCase().includes(lowerQuery) ||
        address.street.toLowerCase().includes(lowerQuery) ||
        address.city.toLowerCase().includes(lowerQuery) ||
        address.postalCode.toLowerCase().includes(lowerQuery)
      );
      resolve(results);
    }, 300);
  });
};