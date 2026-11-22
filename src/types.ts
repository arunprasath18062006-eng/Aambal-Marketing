export type PropertyType = 'Plot' | 'Villa' | 'Commercial';

export interface Property {
  id: number;
  slug: string;
  title: string;
  type: PropertyType;
  location: string;
  district: string;
  surveyNo: string;
  approvalLabel: string;
  pricePerSqft: number;
  priceTamil: string;
  priceDisplay: string;
  totalUnits: number;
  availableUnits: number;
  minAreaSqft: number;
  maxAreaSqft: number;
  roadAccess: string[];
  facilities: string[];
  images: string[];
  layoutPlanImage: string | null;
  lat: number;
  lng: number;
  mapsUrl: string;
  description: string;
  featured: boolean;
}

export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Site Visit'
  | 'Negotiation'
  | 'Closed';

export interface Lead {
  id: number;
  name: string;
  mobile: string;
  interestedIn: string;
  propertyId: number | null;
  propertyTitle: string | null;
  plotNumber: string | null;
  location: string;
  status: LeadStatus;
  message: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlotScheduleRow {
  plotNo: number;
  plotAreaSqft: number;
  roadAreaSqft: number;
  totalAreaSqft: number;
  cent: number;
  sqftRemainder: number;
  facingRoad: string;
  status: 'Available' | 'Reserved' | 'Sold';
}
