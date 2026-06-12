// app/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3007';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // Validação do token na montagem
  useEffect(() => {
    if (!token) {
      setError('Link inválido. Solicite uma nova redefinição de senha.');
    }
  }, [token]);

  // Validações de senha em tempo real
  const validations = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password.length > 0 && password === confirmPassword,
  };

  const isValid =
    validations.minLength &&
    validations.hasUpperCase &&
    validations.hasLowerCase &&
    validations.hasNumber &&
    validations.matches;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Token ausente.');
      return;
    }

    if (!isValid) {
      setError('Verifique os requisitos da senha.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao redefinir senha');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-black/50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Senha redefinida!
          </h1>
          <p className="text-slate-600 mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para o
            login em instantes.
          </p>
          <Link
            href="/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  // Erro de token ausente
  if (!token) {
    return (
      <div className="min-h-screen bg-black/50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Link inválido
          </h1>
          <p className="text-slate-600 mb-6">
            Este link de redefinição é inválido ou está incompleto.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  // Formulário principal
  return (
    <div className="min-h-screen bg-black/50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Crie uma nova senha
          </h1>
          <p className="text-slate-600 text-sm">
            Escolha uma senha forte para proteger sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Nova senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="text-black w-full px-4 py-2.5 pr-11 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Campo confirmação */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Confirme a nova senha
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="text-black w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          {/* Requisitos da senha */}
          {password.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
              <p className="text-xs font-medium text-slate-700 mb-2">
                Sua senha deve ter:
              </p>
              <Requirement met={validations.minLength} label="Pelo menos 8 caracteres" />
              <Requirement met={validations.hasUpperCase} label="Uma letra maiúscula" />
              <Requirement met={validations.hasLowerCase} label="Uma letra minúscula" />
              <Requirement met={validations.hasNumber} label="Um número" />
              {confirmPassword.length > 0 && (
                <Requirement met={validations.matches} label="As senhas coincidem" />
              )}
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Botão submit */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Redefinindo...
              </>
            ) : (
              'Redefinir senha'
            )}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
          met ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        {met ? (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-1 h-1 bg-white rounded-full" />
        )}
      </div>
      <span className={met ? 'text-slate-700' : 'text-slate-500'}>{label}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black/50" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}