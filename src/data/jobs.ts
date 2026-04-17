export type JobStatus =
  | "New"
  | "In Diagnosis"
  | "Awaiting Repair"
  | "In Progress"
  | "Post Repair Device Check"
  | "Pending Postage"
  | "Ready For Collection"
  | "Ready For Collection Unsuccessful"
  | "Awaiting Customer Reply"
  | "Awaiting Parts";

export type JobPriority = "Low" | "Medium" | "High";
export type JobCategory = "Power" | "Battery" | "Display" | "Charging" | "General";

export type Job = {
  id: string;

  customerId: string;
  appointmentId: string;

  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string;
  county: string;
  postcode: string;

  brand: string;
  deviceType: string;
  deviceModel: string;
  colour: string;
  imei: string;
  serialNumber: string;
  checkInCondition: string;

  partRequired: string;
  partAllocated: string;
  partName: string;
  partType: string;
  partSupplier: string;
  partStatus: string;

  paymentAmount: string;
  paymentType: string;
  paymentStatus: string;

  qcStatus: string;
  backglass: string;
  status: JobStatus;
  priority: JobPriority;
  suggestedPriority: JobPriority;
  category: JobCategory;
  priorityWasOverridden: boolean;
  ber: boolean;

  repairStartTime: string;
  repairEndTime: string;
  repairDurationMinutes: string | number;

  isDeleted: boolean;
  deletedAt: string;
  deletedBy: string;
  restoredAt: string;
  restoredBy: string;
};

export const initialJobs: Job[] = [];
