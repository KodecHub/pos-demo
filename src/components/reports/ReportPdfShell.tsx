import type { ReactNode } from "react"

type ReportPdfShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: string
}

/** Wrapper for html2canvas PDF exports — clean header/footer + white card. */
export function ReportPdfShell({ title, subtitle, children, footer }: ReportPdfShellProps) {
  const generated = new Date().toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-500" />
      <div className="px-8 pt-8 pb-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-800">RestaurantOS</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-600 mt-2 leading-relaxed">{subtitle}</p> : null}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span>
            <span className="font-medium text-slate-700">Generated:</span> {generated}
          </span>
          <span className="text-slate-400">|</span>
          <span>LKR · Internal use</span>
        </div>
      </div>
      <div className="px-8 py-6 space-y-6">{children}</div>
      {footer ? (
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 leading-relaxed">
          {footer}
        </div>
      ) : (
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
          This document was generated from RestaurantOS. Figures are for reference; verify against your ledger.
        </div>
      )}
    </div>
  )
}
