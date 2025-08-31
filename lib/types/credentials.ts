export interface Credential {
  data_issuer_name: string;
  name: string;
  points: number;
  max_score: number;
  description: string;
  external_url: string | null;
  last_calculated_at: string | null;
  category: string;
  data_issuer_slug: string;
  slug: string;
  uom: string;
  readable_value: string | null;
  points_calculation_logic?: {
    data_points?: Array<{
      is_maximum: boolean;
      readable_value: string | null;
      value: string | null;
      uom: string | null;
    }>;
    max_points: number | null;
  };
}

export interface CredentialsResponse {
  credentials: Credential[];
}

export interface IssuerCredentialGroup {
  issuer: string;
  total: number;
  max_total: number;
  points: Array<{
    label: string;
    slug?: string; // Optional slug for matching with API
    value: number;
    max_score: number | null;
    readable_value: string | null;
    uom: string | null;
    external_url: string | null;
  }>;
}

// Proof of Humanity types
export interface HumanityCredential {
  account_source: string;
  calculating_score: boolean;
  category: string;
  data_issuer_name: string;
  data_issuer_slug: string;
  description: string;
  external_url: string;
  immutable: boolean;
  last_calculated_at: string | null;
  max_score: number;
  name: string;
  points: number;
  points_calculation_logic: Record<string, unknown>;
  slug: string;
  uom: string;
  updated_at: string | null;
}

export interface HumanityCredentialsResponse {
  credentials: HumanityCredential[];
}
