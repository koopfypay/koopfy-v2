// lib/api.types.ts
// Contratos completos da API — compartilhados entre hooks e backend

// ─── Primitivos ────────────────────────────────────────────────────────────────

export type RiskLevel = 'WHITE' | 'GRAY' | 'BLACK'
export type PaymentStatus = 'pending' | 'approved' | 'failed' | 'processing' | 'requires_action' | 'refunded' | 'chargeback' | 'all'
export type TransferStatus = 'pending' | 'scheduled' | 'completed' | 'failed'
export type DisputeStatus = 'pending' | 'evidence_required' | 'won' | 'lost'
export type WalletEntryType = 'credit' | 'debit'
export type PayoutStatus = 'paid' | 'pending' | 'failed'

// ─── Paginação ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

// ─── Dashboard / KPIs ─────────────────────────────────────────────────────────

export interface DashboardKPIs {
  volume: {
    value: number
    change: number
    isPositive: boolean
    period: string
    sparkline: { value: number }[]
  }
  transactions: {
    value: number
    change: number
    isPositive: boolean
    period: string
    sparkline: { value: number }[]
  }
  approvalRate: {
    value: number
    change: number
    isPositive: boolean
    period: string
    sparkline: { value: number }[]
  }
  settled: {
    value: number
    change: number
    isPositive: boolean
    period: string
    progress: number
  }
}

export interface VolumeChartPoint {
  day: string
  volume: number
}

export interface MethodDistribution {
  name: string
  value: number       // percentual
  amount: number      // valor absoluto em centavos USD
  color: string
}

export interface RecentActivity {
  id: string
  company: string
  description: string
  amount: number
  time: string        // HH:mm
  status: 'approved' | 'completed' | 'pending'
  icon: string        // visa | mastercard | pix | exchange | etc.
}

export interface TopPlayer {
  sellerId: string;
  rank: number;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  instagram: string | null;
  volume: number;
  transactions: number;
  growth: number;
  badge:
  | 'diamond'
  | 'gold'
  | 'silver'
  | 'bronze';
  country: string;
}

export interface TopPlayersResponse {
  monthlyTop: TopPlayer[];
  dailyTop: TopPlayer[];
}

export interface DashboardData {
  kpis: DashboardKPIs
  volumeChart: VolumeChartPoint[]
  methodsDistribution: MethodDistribution[]
  recentActivity: RecentActivity[]
  topPlayers: TopPlayersResponse
}

// ─── Transações ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  customer: string
  customerEmail: string
  country: string
  paymentMethod: string
  amount: number
  currency: string
  amountUSD: number
  status: PaymentStatus
  provider: string
  providerTransactionId: string | null
  fee: number
  netAmount: number
  createdAt: string
  approvedAt: string | null
  failedAt: string | null
  riskLevel: RiskLevel | null
  riskScore: number | null
  ip: string | null
  cardLast4: string | null
  cardBrand: string | null
  // Fulfillment — a liberação do saldo só ocorre após o pedido ser enviado (com rastreio)
  orderShipped?: boolean
  trackingCode?: string | null
}

export interface TransactionsParams extends PaginationParams {
  status?: PaymentStatus | 'all'
  method?: string | 'all'
  search?: string
  dateFrom?: string
  dateTo?: string
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletBalance {
  availableBalance: number
  pendingBalance: number
  reservedBalance: number
  inTransit: number
  total: number
  nextPayout: {
    amount: number
    date: string
    method: string
  } | null
}

export interface WalletEntry {
  id: string
  type: WalletEntryType
  description: string
  amount: number
  status: 'completed' | 'pending'
  date: string
  transactionId: string | null
  // Sinalizador de envio do pedido — saldo pendente libera quando o pedido é enviado (com rastreio)
  orderShipped?: boolean
  trackingCode?: string | null
}

export interface WalletEntriesParams extends PaginationParams {
  type?: WalletEntryType | 'all'
  search?: string
}

export interface Payout {
  id: string
  method: 'bank' | 'crypto'
  bankAccount: string | null
  cryptoAddress: string | null
  cryptoNetwork: string | null
  amount: number
  status: PayoutStatus
  date: string
  processedAt: string | null
}

export interface PayoutRequest {
  method: 'pix' | 'crypto'
  amount: number
  bankAccount?: string
  pixKey?: string
  pixKeyType?: string
  pixHolder?: string
  bankHolder?: string
  bankBic?: string
  cryptoAddress?: string
  cryptoNetwork?: 'trc20' | 'erc20' | 'bep20'
  twoFactorCode: string
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export interface Dispute {
  id: string
  transactionId: string
  customer: string
  customerEmail: string
  amount: number
  currency: string
  reason: string
  reasonCode: string
  status: DisputeStatus
  deadline: string | null
  createdAt: string
  seller: string
}

export interface DisputeStats {
  total: number
  pending: number
  won: number
  lost: number
  totalAmount: number
  winRate: number
}

export interface DisputesParams extends PaginationParams {
  status?: DisputeStatus | 'all'
  search?: string
}

export interface DisputeResponse {
  disputeId: string
  message: string
  evidenceUrls?: string[]
}

// ─── Transfers (Repasses) ──────────────────────────────────────────────────────

export interface TransferTransaction {
  id: string
  date: string
  amount: number
  status: 'included' | 'pending' | 'processing' | 'held'
}

export interface Transfer {
  id: string
  seller: string
  sellerId: string
  amount: number
  fee: number
  netAmount: number
  status: TransferStatus
  releaseDate: string
  createdAt: string
  paidAt: string | null
  failReason: string | null
  transactions: TransferTransaction[]
}

export interface TransferTotals {
  pending: number
  scheduled: number
  completed: number
  inTransit: number
}

export interface TransfersParams extends PaginationParams {
  status?: TransferStatus | 'all'
  search?: string
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

export interface PaymentMethodConfig {
  id: string
  name: string
  icon: string
  category: 'card' | 'wallet' | 'bank' | 'instant'
  provider: string
  fees: string
  countries: string[]
  enabled: boolean
  volume: number
  transactions: number
  approvalRate: number
  avgTicket: number
  settlementDays: number
}

export interface PaymentMethodPerformance {
  day: string
  transactions: number
  volume: number
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface SellerSettings {
  company: {
    name: string
    taxId: string
    email: string
    phone: string
    address: string
    country: string
    currency: string
    logoUrl: string | null
    instagram?: string
    whatsapp?: string
  }
  bank: {
    accountHolder: string
    iban: string
    bic: string
    bankName: string
  }

  pix: {
    key: string
    keyType: string
    accountHolder: string
  }

  security: {
    twoFactorEnabled: boolean
    emailAlerts: boolean
    ipRestriction: boolean
    require3DS: boolean
    velocityCheck: boolean
    geoCheck: boolean
    cardTestingBlock: boolean
    maxTransactionAmount: number
    riskScoreLimit: number
  }
  webhooks: {
    url: string
    secret: string
    events: Record<string, boolean>
  }
  apiKeys: {
    publishableKey: string
    secretKeyMasked: string
    keyPrefix: string
  }
  // 🔥 NOVO: dados KYC (read-only no frontend)
  kyc: {
    fullName: string
    cpfMasked: string   // ex: "•••.456.•••-••"
    birthDate: string
    cep: string
    street: string
    number: string
    complement: string | null
    neighborhood: string
    city: string
    state: string
    status: 'pending' | 'approved' | 'rejected'
  } | null
}

export interface UpdateSettingsDto {
  section: 'company' | 'bank' | 'security' | 'webhooks'
  data: Record<string, unknown>
}