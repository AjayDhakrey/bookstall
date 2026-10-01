import { getStore, updateStore } from '../repositories/store.js';
import { BusinessProfile } from '../types.js';

export const businessProfileService = {
  getProfile(): BusinessProfile {
    return getStore().businessProfile;
  },

  updateProfile(updates: Partial<BusinessProfile>): BusinessProfile {
    let updatedProfile: BusinessProfile;
    updateStore((prev) => {
      updatedProfile = { ...prev.businessProfile, ...updates };
      return {
        ...prev,
        businessProfile: updatedProfile,
      };
    });
    return getStore().businessProfile;
  },
};
