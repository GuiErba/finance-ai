"use client";

import { useState, useActionState } from "react";
import { updateInvestment, deleteInvestment, type InvestmentFormState } from "@/app/actions/investments";
import type { Investment } from "@/lib/types/database";

interface InvestmentCardProps {
  investment: Investment;
}

export default function InvestmentCard({ investment }: InvestmentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState<InvestmentFormState, FormData>(updateInvestment, undefined);
  const [, deleteAction, deletePending] = useActionState<InvestmentFormState, FormData>(deleteInvestment, undefined);

  const rendimento = Number(investment.valor_atual) - Number(investment.valor_aportado);
  const rendimentoPct =
    Number(investment.valor_aportado) > 0
      ? (rendimento / Number(investment.valor_aportado)) * 100
      : 0;

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const isPositive = rendimento >= 0;

  // Fechar edição após sucesso
  if (updateState?.success && isEditing) {
    setIsEditing(false);
  }

  return (
    <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-200">
      <div className="flex items-center justify-between">
        {/* Info Principal */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Indicador de rendimento */}
          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {isPositive ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 5.834 5.537l2.74 1.22m0 0-5.94 2.281m5.94-2.28-2.28-5.941" />
              )}
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{investment.nome}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                {investment.tipo}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(investment.data_aporte + "T12:00:00").toLocaleDateString("pt-BR")}
              </span>
              {investment.notas && (
                <span className="text-xs text-gray-500 truncate hidden sm:inline">
                  · {investment.notas}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Aportado</p>
            <p className="text-sm text-gray-300 tabular-nums">{formatCurrency(Number(investment.valor_aportado))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Atual</p>
            <p className="text-sm text-white font-semibold tabular-nums">{formatCurrency(Number(investment.valor_atual))}</p>
          </div>
          <div className="text-right w-20">
            <p className="text-xs text-gray-500">Rend.</p>
            <p className={`text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}{rendimentoPct.toFixed(2)}%
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
              title="Atualizar valor"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={investment.id} />
              <button
                type="submit"
                disabled={deletePending}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Excluir"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Inline Edit */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <form action={updateAction} className="flex items-end gap-3">
            <input type="hidden" name="id" value={investment.id} />
            <div className="flex-1">
              <label htmlFor={`valor_atual_${investment.id}`} className="block text-xs font-medium text-gray-400 mb-1">
                Novo valor atual (R$)
              </label>
              <input
                type="number"
                id={`valor_atual_${investment.id}`}
                name="valor_atual"
                step="0.01"
                min="0"
                defaultValue={Number(investment.valor_atual)}
                disabled={updatePending}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 tabular-nums"
              />
            </div>
            <button
              type="submit"
              disabled={updatePending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatePending ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
