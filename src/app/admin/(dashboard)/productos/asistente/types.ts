// Shared serializable types between the assistant Server Actions and the
// client chat component.

export interface AssistantCandidate {
  url: string; // Vercel Blob URL (re-hosted)
  confidence: "alta" | "media" | "baja";
  legalRiskLevel: "ninguno" | "bajo" | "alto";
  legalReasons: string[];
  note: string;
  recommended: boolean;
}

export interface AssistantMarket {
  recommendedPriceEuros: number;
  marketMinEuros: number;
  marketMaxEuros: number;
  demand: "alta" | "media" | "baja";
  estimatedTimeToSell: string;
  rationale: string;
  sources: string[];
}

export interface PrepareResult {
  ok: boolean;
  error?: string;
  query?: { brand: string; model: string; reference: string; costEuros: number };
  listing?: { name: string; category: string; description: string };
  market?: AssistantMarket;
  candidates?: AssistantCandidate[];
  warnings?: string[];
}

export interface CreateInput {
  name: string;
  brand: string;
  category: string;
  description: string;
  priceEuros: number;
  stock: number;
  featured: boolean;
  availableUntil: string; // "YYYY-MM-DD" or ""
  images: string[];
}

export interface CreateResult {
  ok: boolean;
  error?: string;
  productId?: string;
}
