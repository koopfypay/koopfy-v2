import {
    DashboardData,
    Transaction,
    TransactionsParams,
    PaginatedResponse,
    WalletBalance,
    WalletEntry,
    WalletEntriesParams,
    Payout,
    PayoutRequest,
    Dispute,
    DisputeStats,
    DisputesParams,
    DisputeResponse,
    Transfer,
    TransferTotals,
    TransfersParams,
    PaymentMethodConfig,
    PaymentMethodPerformance,
    SellerSettings,
    UpdateSettingsDto,
    PaginationParams,
} from "@/types/api.types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.koopfy.com"

// ─── Classe de erro ───────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public data?: unknown,
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export const saveToken  = (t: string) => localStorage.setItem('access_token', t)
export const getToken   = ()          => localStorage.getItem('access_token')
export const clearToken = ()          => localStorage.removeItem('access_token')
export const isAuthenticated = ()     => !!getToken()

// ─── Request core ─────────────────────────────────────────────────────────────

async function request<T>(
    path: string,
    options: RequestInit & { auth?: boolean; params?: Record<string, unknown> } = {},
): Promise<T> {
    const { auth = true, params, ...fetchOptions } = options

    const qs = params
        ? '?' + new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== null && v !== 'all' && v !== '')
                .map(([k, v]) => [k, String(v)])
        ).toString()
        : ''

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
    }

    if (auth) {
        const token = getToken()
        if (!token) throw new ApiError(401, 'Não autenticado')
        headers['Authorization'] = `Bearer ${token}`
    }

    const res  = await fetch(`${BASE_URL}${path}${qs}`, { ...fetchOptions, headers })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        const message = data?.message ?? 'Erro inesperado'
        throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message, data)
    }

    return data as T
}

// ─── SWR fetcher ──────────────────────────────────────────────────────────────

export function swrFetcher<T>(url: string): Promise<T> {
    return request<T>(url, { auth: true })
}

// ─── Tipos de retorno da Auth API ─────────────────────────────────────────────

interface LoginResponse {
    accessToken: string
    user: {
        id:                      string
        name:                    string
        email:                   string
        avatarUrl:               string | null
        kycCompleted:            boolean
        operationSetupCompleted: boolean  // 🔥 adicionado
        onboardingCompleted:     boolean
    }
    redirectTo: string
}

interface MeResponse {
    id:                        string
    name:                      string
    email:                     string
    avatar_url:                string | null
    instagram:                 string | null
    whatsapp:                  string | null
    kyc_completed:             boolean
    operation_setup_completed: boolean  // 🔥 adicionado
    onboarding_completed:      boolean
    created_at:                string
    last_login_at:             string | null
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
    register: (body: {
        name: string; instagram: string; whatsapp: string
        email: string; password: string
        profileImageBase64?: string; profileImageMime?: string
    }) =>
        request<{ message: string }>('/auth/register', {
            method: 'POST', auth: false, body: JSON.stringify(body),
        }),

    login: (body: { email: string; password: string }) =>
        request<LoginResponse>('/auth/login', {
            method: 'POST', auth: false, body: JSON.stringify(body),
        }),

    forgotPassword: (email: string) =>
        request<{ message: string }>('/auth/forgot-password', {
            method: 'POST', auth: false, body: JSON.stringify({ email }),
        }),

    resetPassword: (token: string, newPassword: string) =>
        request<{ message: string }>('/auth/reset-password', {
            method: 'POST', auth: false, body: JSON.stringify({ token, newPassword }),
        }),

    resendVerification: (email: string) =>
        request<{ message: string }>('/auth/resend-verification', {
            method: 'POST', auth: false, body: JSON.stringify({ email }),
        }),

    verifyEmail: (token: string) =>
        request<{ accessToken: string; redirectTo: string }>('/auth/verify-email', {
            method: 'POST', auth: false, body: JSON.stringify({ token }),
        }),

    // 🔥 Tipo completo com operation_setup_completed
    me: () => request<MeResponse>('/auth/me'),
}

// ─── Onboarding API ───────────────────────────────────────────────────────────

export const onboardingApi = {
    saveKyc: (body: Record<string, unknown>) =>
        request<{ message: string }>('/onboarding/kyc', {
            method: 'POST', body: JSON.stringify(body),
        }),

    saveOperation: (body: Record<string, unknown>) =>
        request<{ message: string; redirectTo: string }>('/onboarding/operation', {
            method: 'POST', body: JSON.stringify(body),
        }),

    saveDocuments: (body: Record<string, unknown>) =>
        request<{ message: string; redirectTo?: string }>('/onboarding/documents', {
            method: 'POST', body: JSON.stringify(body),
        }),
}

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  getData: (period: 'today' | 'yesterday' | '7d' | '30d' | '90d' = '30d') =>
    request<DashboardData>('/dashboard', { params: { period } }),
}
 

// ─── Transactions API ─────────────────────────────────────────────────────────

export const transactionsApi = {
    list: (params: TransactionsParams = {}) =>
        request<PaginatedResponse<Transaction>>('/transactions', {
            params: params as Record<string, unknown>,
        }),

    getById: (id: string) =>
        request<Transaction>(`/transactions/${id}`),

    export: (params: Omit<TransactionsParams, 'page' | 'pageSize'>) =>
        request<Blob>('/transactions/export', {
            params: params as Record<string, unknown>,
        }),
}

// ─── Wallet API ───────────────────────────────────────────────────────────────

export const walletApi = {
    getBalance: () =>
        request<WalletBalance>('/wallet/balance'),

    getEntries: (params: WalletEntriesParams = {}) =>
        request<PaginatedResponse<WalletEntry>>('/wallet/entries', {
            params: params as Record<string, unknown>,
        }),

    getPayouts: (params: PaginationParams = {}) =>
        request<PaginatedResponse<Payout>>('/wallet/payouts', {
            params: params as Record<string, unknown>,
        }),

    requestPayout: (body: PayoutRequest) =>
        request<{ payoutId: string; status: string }>('/wallet/payout', {
            method: 'POST', body: JSON.stringify(body),
        }),
}

// ─── Disputes API ─────────────────────────────────────────────────────────────

export const disputesApi = {
    getStats: () =>
        request<DisputeStats>('/disputes/stats'),

    list: (params: DisputesParams = {}) =>
        request<PaginatedResponse<Dispute>>('/disputes', {
            params: params as Record<string, unknown>,
        }),

    respond: (disputeId: string, body: DisputeResponse) =>
        request<{ message: string }>(`/disputes/${disputeId}/respond`, {
            method: 'POST', body: JSON.stringify(body),
        }),
}

// ─── Transfers API ────────────────────────────────────────────────────────────

export const transfersApi = {
    getTotals: () =>
        request<TransferTotals>('/transfers/totals'),

    list: (params: TransfersParams = {}) =>
        request<PaginatedResponse<Transfer>>('/transfers', {
            params: params as Record<string, unknown>,
        }),

    retry: (transferId: string) =>
        request<{ message: string }>(`/transfers/${transferId}/retry`, {
            method: 'POST',
        }),
}

// ─── Payment Methods API ──────────────────────────────────────────────────────

export const paymentMethodsApi = {
    list: () =>
        request<PaymentMethodConfig[]>('/payment-methods'),

    toggle: (methodId: string, enabled: boolean) =>
        request<{ message: string }>(`/payment-methods/${methodId}/toggle`, {
            method: 'PATCH', body: JSON.stringify({ enabled }),
        }),

    getPerformance: (methodId: string) =>
        request<PaymentMethodPerformance[]>(`/payment-methods/${methodId}/performance`),
}

// ─── Settings API ─────────────────────────────────────────────────────────────

export const settingsApi = {
    get: () =>
        request<SellerSettings>('/settings'),

    update: (body: UpdateSettingsDto) =>
        request<{ message: string }>('/settings', {
            method: 'PATCH', body: JSON.stringify(body),
        }),

    regenerateApiKeys: () =>
        request<{ publishableKey: string; secretKeyMasked: string; keyPrefix: string }>(
            '/settings/api-keys/regenerate', { method: 'POST' }
        ),

    updateWebhookUrl: (url: string) =>
        request<{ message: string; verified: boolean }>('/settings/webhook/verify', {
            method: 'POST', body: JSON.stringify({ url }),
        }),

    getOffers: () =>
        request<Array<{
            id:             string
            name:           string
            sales_page_url: string
            risk_level:     'WHITE' | 'GRAY' | 'BLACK'
            status:         'pending_review' | 'approved' | 'rejected' | 'suspended'
            created_at:     string
        }>>('/settings/offers'),

    addOffer: (body: {
        name:         string
        salesPageUrl: string
        riskLevel:    'WHITE' | 'GRAY' | 'BLACK'
    }) =>
        request<{ message: string }>('/settings/offers', {
            method: 'POST', body: JSON.stringify(body),
        }),

    changePassword: (currentPassword: string, newPassword: string) =>
        request<{ message: string }>('/settings/password', {
            method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
        }),
}