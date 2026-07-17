export enum UserRole {
  CLIENT = 'Bewoner',
  BID_INTERN = 'BID Intern',
  BACK_OFFICE = 'Back Office',
  INSPECTOR = 'Inspector'
}

export enum Step {
  ROLE_SELECTION = 'Role Selection',
  INFORMATION = 'Information',
  OTP = 'OTP Verification',
  SET_PASSWORD = 'Set Password',
  LOGIN = 'Login',
  FORGOT_PASSWORD = 'Forgot Password',
  USER_PROFILE = 'User Profile',
  HOME = 'Home',
  DASHBOARD = 'Dashboard',
  ALGEMEEN = 'Algemeen',
  UPLOAD = 'Upload Documents',
  INSULATION_DETAILS = 'Insulation Details',
  INSTALLATIE = 'Techniek & Installaties',
  KOZIJN_GLAS = 'Kozijn & Glas',
  PHOTO_CAPTURE = 'Photo',
  PHOTO_INTERIOR = 'Interior Photo',
  FINAL_REVIEW = 'Final Review',
  COMPLETE = 'Complete',
  SETTINGS = 'Settings',
  CLIENTS = 'Clients',
}

export interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  companyName?: string;
  advisorName?: string;
  certificaathouder?: string;
  profilePhoto?: string;
}

// src/types.ts
export interface AddressSuggestion {
  id: string
  fullAddress: string
  street: string
  city: string
  neighborhood: string
  houseNumber: string
  postalCode: string
}