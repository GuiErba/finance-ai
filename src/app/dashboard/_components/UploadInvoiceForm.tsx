"use client";

import { useActionState, useRef, useState } from "react";
import { uploadInvoice, type UploadInvoiceState } from "@/app/actions/invoice";

export default function UploadInvoiceForm() {
  const [state, action, pending] = useActionState<UploadInvoiceState, FormData>(uploadInvoice, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpa o formulário em caso de sucesso
  if (state?.success && formRef.current && fileName) {
    formRef.current.reset();
    setFileName(null);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFileName(null);
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden">
      {/* Background glow para destacar o card */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8" />
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">Conciliar Fatura</h2>
      </div>
      
      <p className="text-sm text-gray-400 mb-6 relative z-10">
        Faça o upload do PDF da fatura do seu cartão. Nossa IA irá processar as transações e <strong className="text-gray-300">ignorar automaticamente</strong> as que você já cadastrou via WhatsApp.
      </p>

      <form ref={formRef} action={action} className="space-y-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-1">
            <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1.5">
              Ano da Fatura
            </label>
            <select
              id="year"
              name="year"
              required
              disabled={pending}
              defaultValue={new Date().getFullYear()}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - 2 + i; // Mostra -2 e +2 anos
                return (
                  <option key={y} value={y} className="bg-[#1a1a24] text-white">
                    {y}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="sm:col-span-2">
            {/* Input Oculto Persistente */}
            <input 
              type="file" 
              id="invoice" 
              name="invoice" 
              accept="application/pdf" 
              className="hidden" 
              onChange={handleFileChange}
              ref={fileInputRef}
            />

            {!fileName ? (
              <label
                htmlFor="invoice"
                className="flex justify-center items-center w-full h-32 px-4 transition bg-white/5 border-2 border-white/10 border-dashed rounded-xl appearance-none cursor-pointer hover:border-emerald-500/50 hover:bg-white/10 focus:outline-none group"
              >
                <span className="flex items-center space-x-2 text-gray-400 group-hover:text-emerald-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium">
                    Clique para selecionar o PDF
                  </span>
                </span>
              </label>
            ) : (
              <div className={`flex items-center justify-between w-full h-32 px-6 transition rounded-xl border-2 border-solid ${pending ? 'bg-emerald-500/10 border-emerald-500/50 animate-pulse' : 'bg-emerald-500/5 border-emerald-500/30'}`}>
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="p-3 bg-emerald-500/20 rounded-lg shrink-0">
                    {pending ? (
                      <svg className="w-6 h-6 text-emerald-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-400 truncate pr-4">
                      {fileName}
                    </p>
                    <p className="text-xs text-emerald-400/70 mt-1">
                      {pending ? "Processando com a Inteligência Artificial..." : "Pronto para envio"}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={clearFile}
                  disabled={pending}
                  className="shrink-0 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover arquivo"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {state && (
          <div className={`flex gap-2 text-sm rounded-xl px-4 py-3 border ${state.success ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
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
          disabled={pending || !fileName}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analisando Fatura com Gemini...
            </span>
          ) : (
            "Processar Fatura"
          )}
        </button>
      </form>
    </div>
  );
}
