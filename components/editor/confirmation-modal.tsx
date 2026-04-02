'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
}: ConfirmationModalProps) {
  const isDanger = variant === 'danger'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[#14181C] p-6 shadow-2xl shadow-black/50"
          >
            {/* Ambient Glow */}
            <div className={cn(
              "absolute -top-24 left-1/2 -z-10 h-48 w-48 -translate-x-1/2 blur-[80px]",
              isDanger ? "bg-red-500/20" : "bg-[#462D6E]/30"
            )} />

            <div className="flex items-start gap-4">
              <div className={cn(
                "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5",
                isDanger ? "text-red-400" : "text-[#E0E5EB]"
              )}>
                <AlertCircle className="h-5 w-5" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-[#E0E5EB]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                  {message}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-1 text-[#4E576A] transition-colors hover:bg-white/5 hover:text-[#E0E5EB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[#8D95A6] transition-colors hover:text-[#E0E5EB]"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]",
                  isDanger 
                    ? "bg-red-500/90 text-white shadow-lg shadow-red-500/20 hover:bg-red-500" 
                    : "bg-[#462D6E] text-[#E0E5EB] shadow-lg shadow-[#462D6E]/20 hover:bg-[#5A3B8C]"
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
