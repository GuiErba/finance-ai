"use client";

import { useActionState, useRef, useEffect } from "react";
import { createInvestment, type InvestmentFormState } from "@/app/actions/investments";

const TIPOS_INVESTIMENTO = [
  "Renda Fixa",
  "Ações",
  "FII",
  "Cripto",
  "Tesouro Direto",
  "ETF",
  "Poupança",
  "Outros",
];

interface InvestmentFormProps {
  onSuccess?: () => void;
}

export default function InvestmentForm({ onSuccess }: InvestmentFormProps) {
  const [state, action, pending] = useActionState<InvestmentFormState, FormData>(createInvestment, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />

      <h2 className="text-lg font-semibold text-white mb-6 relative z-10">Registrar Investimento</h2>

      <form ref={formRef} action={action} className="relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1.5">
              Nome do Ativo *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              required
              placeholder="Ex: CDB Banco Inter"
              disabled={pending}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-300 mb-1.5">
              Tipo *
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              disabled={pending}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
            >
              <option value="" className="bg-[#1a1a24]">Selecione...</option>
              {TIPOS_INVESTIMENTO.map((t) => (
                <option key={t} value={t} className="bg-[#1a1a24]">{t}</option>
              ))}
            </select>
          </div>

          {/* Data do Aporte */}
          <div>
            <label htmlFor="data_aporte" className="block text-sm font-medium text-gray-300 mb-1.5">
              Data do Aporte *
            </label>
            <input
              type="date"
              id="data_aporte"
              name="data_aporte"
              required
              disabled={pending}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Valor Aportado */}
          <div>
            <label htmlFor="valor_aportado" className="block text-sm font-medium text-gray-300 mb-1.5">
              Valor Aportado (R$) *
            </label>
            <input
              type="number"
              id="valor_aportado"
              name="valor_aportado"
              required
              min="0"
              step="0.01"
              placeholder="1000.00"
              disabled={pending}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50 tabular-nums"
            />
          </div>

          {/* Valor Atual */}
          <div>
            <label htmlFor="valor_atual" className="block text-sm font-medium text-gray-300 mb-1.5">
              Valor Atual (R$) *
            </label>
            <input
              type="number"
              id="valor_atual"
              name="valor_atual"
              required
              min="0"
              step="0.01"
              placeholder="1050.00"
              disabled={pending}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50 tabular-nums"
            />
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-gray-300 mb-1.5">
              Notas (opcional)
            </label>
            <input
              type="text"
              id="notas"
              name="notas"
              placeholder="Vence em 2028"
              disabled={pending}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Status Message */}
        {state && (
          <div className={`flex gap-2 text-sm rounded-xl px-4 py-3 mb-4 border ${state.success ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {state.success ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              )}
            </svg>
            <span className="flex-1">{state.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {pending ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Salvando...
            </>
          ) : (
            "Salvar Investimento"
          )}
        </button>
      </form>
    </div>
  );
}
