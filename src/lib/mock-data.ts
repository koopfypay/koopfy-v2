// KPI Data
export const kpiData = {
  totalRevenue: {
    value: 2847395.50,
    change: 12.5,
    sparkline: [65, 72, 78, 85, 82, 90, 95, 88, 92, 98, 105, 112],
  },
  netRevenue: {
    value: 2562655.95,
    change: 11.2,
    sparkline: [60, 68, 72, 78, 75, 82, 88, 80, 85, 90, 95, 102],
  },
  approvalRate: {
    value: 94.7,
    change: 2.3,
    sparkline: [91, 92, 93, 92, 94, 93, 95, 94, 95, 94, 95, 94.7],
  },
  failedPayments: {
    value: 5.3,
    change: -1.8,
    sparkline: [8, 7.5, 7, 6.8, 6.5, 6.2, 5.8, 6, 5.5, 5.4, 5.3, 5.3],
  },
  chargebacks: {
    value: 127,
    change: -5.2,
    sparkline: [150, 145, 142, 138, 135, 132, 130, 128, 127, 127, 127, 127],
  },
  availableBalance: {
    value: 458920.00,
    change: 8.7,
    sparkline: [380, 395, 410, 425, 435, 440, 445, 450, 455, 458, 458, 459],
  },
}

// Cash Flow Data
export const cashFlowData = [
  { month: "Jan", incoming: 185000, outgoing: 145000 },
  { month: "Fev", incoming: 210000, outgoing: 168000 },
  { month: "Mar", incoming: 245000, outgoing: 195000 },
  { month: "Abr", incoming: 278000, outgoing: 220000 },
  { month: "Mai", incoming: 295000, outgoing: 235000 },
  { month: "Jun", incoming: 320000, outgoing: 255000 },
  { month: "Jul", incoming: 342000, outgoing: 272000 },
  { month: "Ago", incoming: 358000, outgoing: 285000 },
  { month: "Set", incoming: 375000, outgoing: 298000 },
  { month: "Out", incoming: 398000, outgoing: 318000 },
  { month: "Nov", incoming: 425000, outgoing: 340000 },
  { month: "Dez", incoming: 458000, outgoing: 365000 },
]

// Payment Methods Performance
export const paymentMethodsData = [
  { method: "Cartão Visa", approvalRate: 96.2, volume: 1250000, failureRate: 3.8 },
  { method: "Cartão Mastercard", approvalRate: 95.8, volume: 980000, failureRate: 4.2 },
  { method: "MB Way", approvalRate: 98.5, volume: 420000, failureRate: 1.5 },
  { method: "Multibanco", approvalRate: 99.1, volume: 380000, failureRate: 0.9 },
  { method: "Pix", approvalRate: 97.8, volume: 290000, failureRate: 2.2 },
  { method: "PayPal", approvalRate: 94.5, volume: 185000, failureRate: 5.5 },
  { method: "Apple Pay", approvalRate: 97.2, volume: 145000, failureRate: 2.8 },
  { method: "Google Pay", approvalRate: 96.8, volume: 120000, failureRate: 3.2 },
]

// Recent Transactions
export const recentTransactions = [
  {
    id: "TXN-2847",
    customer: "Maria Santos",
    country: "PT",
    paymentMethod: "MB Way",
    amount: 125.50,
    status: "success",
    date: "2024-01-15T14:32:00",
  },
  {
    id: "TXN-2846",
    customer: "John Smith",
    country: "US",
    paymentMethod: "Visa",
    amount: 89.99,
    status: "success",
    date: "2024-01-15T14:28:00",
  },
  {
    id: "TXN-2845",
    customer: "Hans Mueller",
    country: "DE",
    paymentMethod: "Mastercard",
    amount: 245.00,
    status: "pending",
    date: "2024-01-15T14:25:00",
  },
  {
    id: "TXN-2844",
    customer: "Sophie Dubois",
    country: "FR",
    paymentMethod: "PayPal",
    amount: 67.80,
    status: "failed",
    date: "2024-01-15T14:20:00",
  },
  {
    id: "TXN-2843",
    customer: "Carlos Silva",
    country: "BR",
    paymentMethod: "Pix",
    amount: 312.45,
    status: "success",
    date: "2024-01-15T14:15:00",
  },
  {
    id: "TXN-2842",
    customer: "Ana Oliveira",
    country: "PT",
    paymentMethod: "Multibanco",
    amount: 89.00,
    status: "success",
    date: "2024-01-15T14:10:00",
  },
  {
    id: "TXN-2841",
    customer: "James Wilson",
    country: "UK",
    paymentMethod: "Apple Pay",
    amount: 156.20,
    status: "success",
    date: "2024-01-15T14:05:00",
  },
  {
    id: "TXN-2840",
    customer: "Emma Johnson",
    country: "US",
    paymentMethod: "Google Pay",
    amount: 234.99,
    status: "pending",
    date: "2024-01-15T14:00:00",
  },
]

// Analytics - Approval by Payment Method
export const approvalByMethodData = [
  { method: "Multibanco", rate: 99.1 },
  { method: "MB Way", rate: 98.5 },
  { method: "Pix", rate: 97.8 },
  { method: "Apple Pay", rate: 97.2 },
  { method: "Google Pay", rate: 96.8 },
  { method: "Visa", rate: 96.2 },
  { method: "Mastercard", rate: 95.8 },
  { method: "PayPal", rate: 94.5 },
]

// Analytics - Revenue by Country
export const revenueByCountryData = [
  { country: "Portugal", revenue: 985000, code: "PT" },
  { country: "Brasil", revenue: 620000, code: "BR" },
  { country: "Espanha", revenue: 445000, code: "ES" },
  { country: "França", revenue: 312000, code: "FR" },
  { country: "Alemanha", revenue: 285000, code: "DE" },
  { country: "Reino Unido", revenue: 198000, code: "UK" },
]

// Analytics - Provider Performance
export const providerPerformanceData = [
  { provider: "Stripe", transactions: 45000, approvalRate: 96.5, latency: 245 },
  { provider: "Adyen", transactions: 32000, approvalRate: 97.2, latency: 198 },
  { provider: "SIBS", transactions: 28000, approvalRate: 98.8, latency: 156 },
  { provider: "PayPal", transactions: 18000, approvalRate: 94.5, latency: 312 },
]

// Wallet Data
export const walletData = {
  availableBalance: 458920.00,
  pendingBalance: 125840.50,
  onHold: 34500.00,
}

export const walletTransactions = [
  { id: "WLT-001", type: "credit", amount: 15000, description: "Settlements - Janeiro", date: "2024-01-15", status: "completed" },
  { id: "WLT-002", type: "debit", amount: 8500, description: "Payout - IBAN ***4521", date: "2024-01-14", status: "completed" },
  { id: "WLT-003", type: "credit", amount: 22000, description: "Settlements - Janeiro", date: "2024-01-13", status: "completed" },
  { id: "WLT-004", type: "debit", amount: 5000, description: "Payout - IBAN ***7834", date: "2024-01-12", status: "pending" },
  { id: "WLT-005", type: "credit", amount: 18500, description: "Settlements - Janeiro", date: "2024-01-11", status: "completed" },
]

// Payouts Data
export const payoutsData = [
  { id: "PAY-001", amount: 25000, method: "SEPA", bankAccount: "***4521", status: "paid", date: "2024-01-15" },
  { id: "PAY-002", amount: 15000, method: "SEPA", bankAccount: "***7834", status: "pending", date: "2024-01-14" },
  { id: "PAY-003", amount: 32000, method: "SWIFT", bankAccount: "***2198", status: "paid", date: "2024-01-13" },
  { id: "PAY-004", amount: 8500, method: "SEPA", bankAccount: "***4521", status: "failed", date: "2024-01-12" },
  { id: "PAY-005", amount: 45000, method: "SEPA", bankAccount: "***9012", status: "paid", date: "2024-01-11" },
  { id: "PAY-006", amount: 12000, method: "SWIFT", bankAccount: "***3456", status: "paid", date: "2024-01-10" },
]

// Risk & Fraud Data
export const riskMetrics = {
  chargebackRate: 0.12,
  fraudAlerts: 23,
  blockedTransactions: 156,
  riskScore: 72,
}

export const fraudAlerts = [
  { id: "FRD-001", type: "high_amount", transaction: "TXN-2844", amount: 5000, riskScore: 92, date: "2024-01-15T14:20:00", status: "review" },
  { id: "FRD-002", type: "velocity", transaction: "TXN-2830", amount: 150, riskScore: 78, date: "2024-01-15T12:45:00", status: "review" },
  { id: "FRD-003", type: "geo_mismatch", transaction: "TXN-2825", amount: 890, riskScore: 85, date: "2024-01-15T11:30:00", status: "blocked" },
  { id: "FRD-004", type: "card_testing", transaction: "TXN-2820", amount: 1, riskScore: 95, date: "2024-01-15T10:15:00", status: "blocked" },
  { id: "FRD-005", type: "suspicious_ip", transaction: "TXN-2815", amount: 320, riskScore: 68, date: "2024-01-15T09:00:00", status: "approved" },
]

// Sellers Data
export const sellersData = [
  { id: "SEL-001", name: "TechStore Lda.", volume: 450000, approvalRate: 97.2, balance: 45000, status: "active" },
  { id: "SEL-002", name: "ModaOnline SA", volume: 320000, approvalRate: 95.8, balance: 32500, status: "active" },
  { id: "SEL-003", name: "GadgetWorld", volume: 280000, approvalRate: 96.5, balance: 28000, status: "active" },
  { id: "SEL-004", name: "BookShop PT", volume: 185000, approvalRate: 98.1, balance: 18200, status: "active" },
  { id: "SEL-005", name: "SportZone", volume: 420000, approvalRate: 94.2, balance: 41500, status: "review" },
  { id: "SEL-006", name: "HomeDecor", volume: 156000, approvalRate: 97.8, balance: 15400, status: "active" },
]

// Settings - Payment Methods Config
export const paymentMethodsConfig = [
  { id: "visa", name: "Visa", icon: "visa", enabled: true, provider: "Stripe", category: "card", countries: ["Global"], fees: "2.9% + €0.30", approvalRate: 96.2, volume: 1250000, transactions: 15420, avgTicket: 81.05 },
  { id: "mastercard", name: "Mastercard", icon: "mastercard", enabled: true, provider: "Stripe", category: "card", countries: ["Global"], fees: "2.9% + €0.30", approvalRate: 95.8, volume: 980000, transactions: 12350, avgTicket: 79.35 },
  { id: "mbway", name: "MB Way", icon: "mbway", enabled: true, provider: "SIBS", category: "wallet", countries: ["PT"], fees: "1.5%", approvalRate: 98.5, volume: 420000, transactions: 8500, avgTicket: 49.41 },
  { id: "multibanco", name: "Multibanco", icon: "multibanco", enabled: true, provider: "SIBS", category: "bank", countries: ["PT"], fees: "€0.75", approvalRate: 99.1, volume: 380000, transactions: 6200, avgTicket: 61.29 },
  { id: "pix", name: "Pix", icon: "pix", enabled: true, provider: "Adyen", category: "instant", countries: ["BR"], fees: "0.99%", approvalRate: 97.8, volume: 290000, transactions: 4800, avgTicket: 60.42 },
  { id: "paypal", name: "PayPal", icon: "paypal", enabled: true, provider: "PayPal", category: "wallet", countries: ["Global"], fees: "3.4% + €0.35", approvalRate: 94.5, volume: 185000, transactions: 2950, avgTicket: 62.71 },
  { id: "applepay", name: "Apple Pay", icon: "applepay", enabled: true, provider: "Stripe", category: "wallet", countries: ["Global"], fees: "2.9% + €0.30", approvalRate: 97.2, volume: 145000, transactions: 2200, avgTicket: 65.91 },
  { id: "googlepay", name: "Google Pay", icon: "googlepay", enabled: false, provider: "Stripe", category: "wallet", countries: ["Global"], fees: "2.9% + €0.30", approvalRate: 96.8, volume: 120000, transactions: 1850, avgTicket: 64.86 },
  { id: "boleto", name: "Boleto Bancario", icon: "boleto", enabled: false, provider: "Adyen", category: "bank", countries: ["BR"], fees: "€1.50", approvalRate: 92.0, volume: 0, transactions: 0, avgTicket: 0 },
  { id: "sepa", name: "SEPA Direct Debit", icon: "sepa", enabled: false, provider: "Stripe", category: "bank", countries: ["EU"], fees: "0.8%", approvalRate: 98.0, volume: 0, transactions: 0, avgTicket: 0 },
]

// Transfers/Repasses Data with transactions detail
export const transfersData = [
  {
    id: "TRF-2024-001",
    seller: "Loja ABC",
    sellerId: "SELLER-001",
    amount: 12500.0,
    fee: 125.0,
    netAmount: 12375.0,
    status: "completed",
    createdAt: "08 Abr 2024",
    releaseDate: "10 Abr 2024",
    paidAt: "10 Abr 2024",
    transactions: [
      { id: "TXN-001", amount: 250.00, fee: 2.50, date: "05 Abr", status: "included" },
      { id: "TXN-002", amount: 180.00, fee: 1.80, date: "05 Abr", status: "included" },
      { id: "TXN-003", amount: 420.00, fee: 4.20, date: "06 Abr", status: "included" },
      { id: "TXN-004", amount: 95.00, fee: 0.95, date: "06 Abr", status: "included" },
      { id: "TXN-005", amount: 310.00, fee: 3.10, date: "07 Abr", status: "included" },
    ]
  },
  {
    id: "TRF-2024-002",
    seller: "Empresa XYZ",
    sellerId: "SELLER-002",
    amount: 8750.0,
    fee: 87.5,
    netAmount: 8662.5,
    status: "completed",
    createdAt: "08 Abr 2024",
    releaseDate: "10 Abr 2024",
    paidAt: "10 Abr 2024",
    transactions: [
      { id: "TXN-010", amount: 520.00, fee: 5.20, date: "06 Abr", status: "included" },
      { id: "TXN-011", amount: 890.00, fee: 8.90, date: "06 Abr", status: "included" },
      { id: "TXN-012", amount: 150.00, fee: 1.50, date: "07 Abr", status: "included" },
    ]
  },
  {
    id: "TRF-2024-003",
    seller: "Comercio 123",
    sellerId: "SELLER-003",
    amount: 4200.0,
    fee: 42.0,
    netAmount: 4158.0,
    status: "pending",
    createdAt: "10 Abr 2024",
    releaseDate: "12 Abr 2024",
    paidAt: null,
    transactions: [
      { id: "TXN-020", amount: 750.00, fee: 7.50, date: "08 Abr", status: "pending" },
      { id: "TXN-021", amount: 320.00, fee: 3.20, date: "09 Abr", status: "pending" },
      { id: "TXN-022", amount: 480.00, fee: 4.80, date: "09 Abr", status: "pending" },
    ]
  },
  {
    id: "TRF-2024-004",
    seller: "Tech Solutions",
    sellerId: "SELLER-004",
    amount: 18900.0,
    fee: 189.0,
    netAmount: 18711.0,
    status: "scheduled",
    createdAt: "11 Abr 2024",
    releaseDate: "15 Abr 2024",
    paidAt: null,
    transactions: [
      { id: "TXN-030", amount: 2500.00, fee: 25.00, date: "09 Abr", status: "processing" },
      { id: "TXN-031", amount: 1800.00, fee: 18.00, date: "10 Abr", status: "processing" },
      { id: "TXN-032", amount: 950.00, fee: 9.50, date: "10 Abr", status: "processing" },
      { id: "TXN-033", amount: 3200.00, fee: 32.00, date: "11 Abr", status: "processing" },
    ]
  },
  {
    id: "TRF-2024-005",
    seller: "Digital Store",
    sellerId: "SELLER-005",
    amount: 6800.0,
    fee: 68.0,
    netAmount: 6732.0,
    status: "failed",
    createdAt: "07 Abr 2024",
    releaseDate: "09 Abr 2024",
    paidAt: null,
    failReason: "Dados bancarios invalidos",
    transactions: [
      { id: "TXN-040", amount: 1200.00, fee: 12.00, date: "05 Abr", status: "held" },
      { id: "TXN-041", amount: 850.00, fee: 8.50, date: "06 Abr", status: "held" },
    ]
  },
]

// Enhanced Wallet Data
export const enhancedWalletData = {
  availableBalance: 4589.00,
  pendingBalance: 1258.50,
  reserveBalance: 3450.00,
  inTransit: 856.00,
  nextPayout: {
    amount: 4500.00,
    date: "15 Abr 2026",
    method: "CRIPTO"
  }
}

// Utility functions
export function formatCurrency(value: number, currency = "EUR"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-PT").format(value)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    PT: "🇵🇹",
    BR: "🇧🇷",
    US: "🇺🇸",
    UK: "🇬🇧",
    DE: "🇩🇪",
    FR: "🇫🇷",
    ES: "🇪🇸",
  }
  return flags[code] || "🌍"
}
