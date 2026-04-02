"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  Lock,
  Redo2,
  Trash2,
  Undo2,
  Unlock,
} from "lucide-react";
import type { FabricObject } from "fabric";

import { cn } from "@/lib/utils";

export type CanvasToolbarProps = {
  activeObject: FabricObject | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
  onPreview: () => void;
  onExport?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function Divider() {
  return <div className="mx-1 h-6 w-px bg-neutral-700" aria-hidden="true" />;
}

function IconButton({
  icon: Icon,
  isDestructive = false,
  label,
  onClick,
  disabled = false,
}: {
  icon: typeof Undo2;
  isDestructive?: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors",
        isDestructive
          ? "hover:bg-red-500/10 hover:text-red-300"
          : "hover:bg-neutral-700 hover:text-white",
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function CanvasToolbar({
  activeObject,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onToggleLock,
  isLocked,
  onPreview,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-6 left-1/2 z-30 flex -translate-x-1/2 items-center rounded-full border border-neutral-700 bg-black/80 px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center">
        <IconButton
          icon={Undo2}
          label="Deshacer"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <IconButton
          icon={Redo2}
          label="Rehacer"
          onClick={onRedo}
          disabled={!canRedo}
        />
      </div>

      <Divider />

      <AnimatePresence initial={false} mode="popLayout">
        {activeObject ? (
          <motion.div
            key="selection-actions"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flex items-center"
          >
            <IconButton
              icon={Trash2}
              label="Eliminar"
              onClick={onDelete}
              isDestructive
            />
            <IconButton
              icon={Copy}
              label="Duplicar"
              onClick={onDuplicate}
            />
            <IconButton
              icon={ChevronUp}
              label="Traer adelante"
              onClick={onBringForward}
            />
            <IconButton
              icon={ChevronDown}
              label="Enviar atrás"
              onClick={onSendBackward}
            />
            <IconButton
              icon={isLocked ? Unlock : Lock}
              label={isLocked ? "Desbloquear" : "Bloquear"}
              onClick={onToggleLock}
            />
            <Divider />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
          title="Vista previa"
        >
          <Eye className="h-4 w-4" />
          <span className="whitespace-nowrap">Vista previa</span>
        </button>

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90"
            title="Exportar"
          >
            <Download className="h-4 w-4" />
            <span className="whitespace-nowrap">Exportar</span>
          </button>
        )}
      </div>
    </div>
  );
}
