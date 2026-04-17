export type AppointmentStatus =
  | "Awaiting Diagnosis"
  | "Awaiting Repair"
  | "In Progress"
  | "Post Repair Check"
  | "Ready For Collection"
  | "Ready For Collection (Unsuccessful)"
  | "Awaiting Parts"
  | "Awaiting Customer Reply"
  | "Completed"
  | "Cancelled"
  | "Closed";

export type AppointmentActivityEntry = {
  type: "EMAIL" | "SMS" | "STATUS" | "CALL" | "SYSTEM" | "NOTE";
  message: string;
  user: string;
  role: string;
  timestamp: string;
};

export type CustomerInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  county: string;
  postcode: string;
};

export type DeviceInfo = {
  brand: string;
  deviceType: string;
  deviceModel: string;
  colour: string;
  imei?: string;
  serialNumber?: string;
  checkInCondition: string;
  waterDamage: "Yes" | "No";
  backGlassCracked: "Yes" | "No";
};

export type PaymentInfo = {
  amount: string;
  paymentType: string;
  paymentStatus: string;
};

export type AppointmentRecord = {
  id: string;
  customer: string;
  customerId?: string;
  brand?: string;
  deviceType?: string;
  deviceModel?: string;
  device: string;
  repairType?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  additionalInformation: string;
  checkInCondition: string;
  waterDamage?: "Yes" | "No";
  backGlassCracked?: "Yes" | "No";
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
  lockReason?: string;
  technicianNotes: string;
  postRepairCheckNotes: string;
  technician?: string;
  draftEmail: string;
  selectedTemplate: string;
  selectedSmsTemplate: string;
  draftSms: string;
  callAttempts: string[];
  siteId?: string;
  archived?: boolean;
  escalatedToJobId?: string;
  activityLog: AppointmentActivityEntry[];
  createdAt?: string;
  updatedAt?: string;

  customerInfo?: CustomerInfo;
  deviceInfo?: DeviceInfo;
  paymentInfo?: PaymentInfo;
};

