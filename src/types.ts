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
  DASHBOARD = 'Algemeen',
  UPLOAD = 'Upload Documents',
  INSULATION_DETAILS = 'Insulation Details',
  INSTALLATIE = 'Techniek & Installaties',
  KOZIJN_GLAS = 'Kozijn & Glas',
  COMPLETE = 'Complete'
}

export interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  companyName?: string;
  advisorName?: string;
  certificaathouder?: string;
}