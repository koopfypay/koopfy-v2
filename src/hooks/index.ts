
// hooks/index.ts
// Todos os hooks SWR do dashboard

import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback, useState } from 'react'
import {
  dashboardApi,
  transactionsApi,
  walletApi,
  disputesApi,
  transfersApi,
  paymentMethodsApi,
  settingsApi,
  ApiError,
} from '../lib/api'
import {   
  PayoutRequest,
  DisputeResponse,
  UpdateSettingsDto, } from '@/types/api.types'


// ─── SWR Config padrão ────────────────────────────────────────────────────────

const DEFAULTS = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export type Period = 'today' | 'yesterday' | '7d' | '30d' | '90d'

export function useDashboard(period: Period = '30d') {
  return useSWR(
    `/dashboard?period=${period}`,
    () => dashboardApi.getData(period),
    {
      revalidateOnFocus: false,
      dedupingInterval:  5000,
      // hoje e ontem atualizam a cada 60s, períodos maiores a cada 30s
      refreshInterval:   period === 'today' || period === 'yesterday' ? 60_000 : 30_000,
    },
  )
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useTransactions(params: any = {}) {
  const key = buildKey('/transactions', params)
  return useSWR(key, () => transactionsApi.list(params), DEFAULTS)
}

export function useTransaction(id: string | null) {
  return useSWR(
    id ? `/transactions/${id}` : null,
    () => transactionsApi.getById(id!),
    DEFAULTS,
  )
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export function useWalletBalance() {
  return useSWR('/wallet/balance', walletApi.getBalance, {
    ...DEFAULTS,
    refreshInterval: 15_000, // saldo atualiza mais frequente
  })
}

export function useWalletEntries(params: any = {}) {
  const key = buildKey('/wallet/entries', params)
  return useSWR(key, () => walletApi.getEntries(params), DEFAULTS)
}

export function usePayouts(params: { page?: number; pageSize?: number } = {}) {
  const key = buildKey('/wallet/payouts', params)
  return useSWR(key, () => walletApi.getPayouts(params), DEFAULTS)
}

export function useRequestPayout() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestPayout = useCallback(async (body: PayoutRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await walletApi.requestPayout(body)
      // Revalida saldo e histórico após saque
      await globalMutate('/wallet/balance')
      await globalMutate((key: string) => typeof key === 'string' && key.startsWith('/wallet/entries'))
      await globalMutate((key: string) => typeof key === 'string' && key.startsWith('/wallet/payouts'))
      return result
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao solicitar saque'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { requestPayout, isLoading, error }
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export function useDisputeStats() {
  return useSWR('/disputes/stats', disputesApi.getStats, DEFAULTS)
}

export function useDisputes(params: any = {}) {
  const key = buildKey('/disputes', params)
  return useSWR(key, () => disputesApi.list(params), DEFAULTS)
}

export function useRespondDispute() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const respond = useCallback(async (disputeId: string, body: DisputeResponse) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await disputesApi.respond(disputeId, body)
      // Revalida stats e lista
      await globalMutate('/disputes/stats')
      await globalMutate((key: string) => typeof key === 'string' && key.startsWith('/disputes'))
      return result
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao responder disputa'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { respond, isLoading, error }
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export function useTransferTotals() {
  return useSWR('/transfers/totals', transfersApi.getTotals, DEFAULTS)
}

export function useTransfers(params: any = {}) {
  const key = buildKey('/transfers', params)
  return useSWR(key, () => transfersApi.list(params), DEFAULTS)
}

export function useRetryTransfer() {
  const [isLoading, setIsLoading] = useState(false)

  const retry = useCallback(async (transferId: string) => {
    setIsLoading(true)
    try {
      const result = await transfersApi.retry(transferId)
      await globalMutate('/transfers/totals')
      await globalMutate((key: string) => typeof key === 'string' && key.startsWith('/transfers'))
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { retry, isLoading }
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

export function usePaymentMethods() {
  return useSWR('/payment-methods', paymentMethodsApi.list, DEFAULTS)
}

export function usePaymentMethodPerformance(methodId: string | null) {
  return useSWR(
    methodId ? `/payment-methods/${methodId}/performance` : null,
    () => paymentMethodsApi.getPerformance(methodId!),
    DEFAULTS,
  )
}

export function useTogglePaymentMethod() {
  const [isLoading, setIsLoading] = useState(false)

  const toggle = useCallback(async (methodId: string, enabled: boolean) => {
    setIsLoading(true)
    try {
      const result = await paymentMethodsApi.toggle(methodId, enabled)
      // Optimistic update: revalida a lista
      await globalMutate('/payment-methods')
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { toggle, isLoading }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useSettings() {
  return useSWR('/settings', settingsApi.get, DEFAULTS)
}

export function useUpdateSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback(async (body: UpdateSettingsDto) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await settingsApi.update(body)
      await globalMutate('/settings')
      return result
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar configurações'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { update, isLoading, error }
}

export function useRegenerateApiKeys() {
  const [isLoading, setIsLoading] = useState(false)

  const regenerate = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await settingsApi.regenerateApiKeys()
      await globalMutate('/settings')
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { regenerate, isLoading }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildKey(base: string, params: Record<string, unknown>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== 'all' && v !== '')
  if (!filtered.length) return base
  const qs = new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString()
  return `${base}?${qs}`
}