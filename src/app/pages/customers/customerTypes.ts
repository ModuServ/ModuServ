export type CustomerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  county: string;
  postcode: string;
  createdAt: string;
  updatedAt: string;
};