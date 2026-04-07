import { formatCurrency } from "@/lib/utils"
import type { Kitchen } from "@/lib/ordersApi"
import { loadPrintPrinterConfig } from "@/lib/printConfig"
import { printHtmlViaQz } from "@/lib/qzPrintClient"
import { postPrintToAgent } from "@/lib/httpPrintAgent"
import { toast } from "sonner"

export type ReceiptLine = {
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
  portion?: string
}

/** English payment receipt for the customer. */
export type CustomerBillPayload = {
  orderId: number
  lines: ReceiptLine[]
  subtotal: number
  taxAmount: number
  total: number
  tableLabel: string
  paymentLabel: string
  orderTypeLabel: string
}

export type KitchenTicketLine = {
  nameEn: string
  nameSi: string | null
  qty: number
  portionSi?: string
  /** Prints only on this line’s kitchen KOT (not on customer bill). */
  lineNote?: string | null
}

/** One prep ticket per station (Sinhala UI, no prices). */
export type KitchenTicketPayload = {
  kitchen: Kitchen
  kitchenBadgeSi: string
  orderId: number
  tableLabel: string
  orderTypeLabelSi: string
  /** @deprecated Line notes are per-item; footer uses standard prep text only. */
  kitchenNote?: string | null
  lines: KitchenTicketLine[]
}

export type OrderBillsPayload = {
  customer: CustomerBillPayload
  kitchenTickets: KitchenTicketPayload[]
}

const kotLabels = {
  title: "මුළුතැන්ගෙයි ඇණවුම", // Kitchen Order එකට වඩාත් ගැළපෙන වචනය
  subtitle: "(මිල ගණන් ඇතුළත් නොවේ)", // වඩාත් පැහැදිලියි
  orderNo: "ඇණවුම් අංකය",
  table: "මේස අංකය",
  orderType: "ඇණවුම් වර්ගය",
  time: "වේලාව",
  item: "අයිතමය / විස්තරය",
  qty: "ප්‍රමාණය",
  note: "විශේෂ සටහන්", // Note එකට වඩාත් වෘත්තීය පෙනුමක් ලබා දෙයි
  none: "—",
  prepNote: "මෙම පත්‍රිකාව ආහාර පිළියෙළ කිරීම සඳහා පමණි.",
}

/** Labels for customer receipt preview dialog (shared with printed HTML). */
export const customerReceiptDialogLabels = {
  restaurant: "Restaurant",
  receipt: "Customer receipt",
  date: "Date",
  orderNo: "Order #",
  table: "Table",
  orderType: "Order type",
  payment: "Payment",
  item: "Item",
  qty: "Qty",
  unit: "Unit",
  amount: "Amount",
  sub: "Subtotal",
  tax: "Tax (10%)",
  grand: "Total",
  thanks: "Thank you — please visit again.",
}

function kotLineDisplay(line: KitchenTicketLine) {
  const si = line.nameSi?.trim()
  return si && si.length > 0 ? si : line.nameEn
}

function kotLineItemCell(line: KitchenTicketLine): string {
  const base = kotLineDisplay(line)
  const p = line.portionSi?.trim()
  if (p && p.length > 0 && p !== kotLabels.none) {
    return `${base} (${p})`
  }
  return base
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function lineDisplayName(line: ReceiptLine): string {
  return line.portion ? `${line.name} (${line.portion})` : line.name
}

/** Build bill HTML from data so print does not rely on portaled dialog DOM (fixes empty / failed print). */
function buildCustomerBillHtml(customer: CustomerBillPayload, d: Date): string {
  const rows = customer.lines
    .map(
      (line) => `<tr>
      <td class="c-item">${escapeHtml(lineDisplayName(line))}</td>
      <td class="c-qty">${line.qty}</td>
      <td class="c-money">${formatCurrency(line.unitPrice)}</td>
      <td class="c-money c-strong">${formatCurrency(line.lineTotal)}</td>
    </tr>`,
    )
    .join("")
  const paymentRow = customer.paymentLabel.trim()
    ? `<div class="meta-row"><span class="meta-k">${customerReceiptDialogLabels.payment}</span><span class="meta-v">${escapeHtml(customer.paymentLabel)}</span></div>`
    : ""
  return `<div class="customer-print-section">
    <div class="c-header">
      <div class="c-brand">
        <div class="c-brand-name">${customerReceiptDialogLabels.restaurant}</div>
        <div class="c-brand-sub">${customerReceiptDialogLabels.receipt}</div>
      </div>
      <div class="c-rule"></div>
      <div class="meta">
        <div class="meta-row"><span class="meta-k">${customerReceiptDialogLabels.date}</span><span class="meta-v">${escapeHtml(d.toLocaleString())}</span></div>
        <div class="meta-row"><span class="meta-k">${customerReceiptDialogLabels.orderNo}</span><span class="meta-v mono">#${customer.orderId}</span></div>
        <div class="meta-row"><span class="meta-k">${customerReceiptDialogLabels.table}</span><span class="meta-v">${escapeHtml(customer.tableLabel)}</span></div>
        <div class="meta-row"><span class="meta-k">${customerReceiptDialogLabels.orderType}</span><span class="meta-v">${escapeHtml(customer.orderTypeLabel)}</span></div>
        ${paymentRow}
      </div>
    </div>
    <table>
      <thead><tr>
        <th>${customerReceiptDialogLabels.item}</th>
        <th style="width:2.5rem;text-align:center">${customerReceiptDialogLabels.qty}</th>
        <th style="text-align:right">${customerReceiptDialogLabels.unit}</th>
        <th style="text-align:right">${customerReceiptDialogLabels.amount}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      ${
        customer.taxAmount > 0
          ? `<div class="total-row"><span>${customerReceiptDialogLabels.sub}</span><span>${formatCurrency(customer.subtotal)}</span></div>
      <div class="total-row"><span>${customerReceiptDialogLabels.tax}</span><span>${formatCurrency(customer.taxAmount)}</span></div>
      <div class="grand-row"><span>${customerReceiptDialogLabels.grand}</span><span>${formatCurrency(customer.total)}</span></div>`
          : `<div class="grand-row"><span>${customerReceiptDialogLabels.grand}</span><span>${formatCurrency(customer.total)}</span></div>`
      }
    </div>
    <div class="c-rule dotted"></div>
    <p class="c-footer">${customerReceiptDialogLabels.thanks}</p>
  </div>`
}

/** Matches index.css — embedded in print popup so styles apply without Tailwind */
const KOT_PRINT_STYLES = `
  .kot-title {
    font-size: 1.15rem;
    letter-spacing: 0.3px;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
    margin-bottom: 8px;
    text-align: center;
    font-weight: bold;
  }
  .kot-table {
    font-size: 0.95rem;
    line-height: 1.5;
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  .kot-table th, .kot-table td {
    text-align: left;
    padding: 7px 4px;
    border-bottom: 1px solid #eaeaea;
  }
  .kot-table th:nth-child(2), .kot-table td:nth-child(2) { text-align: center; }
  .kot-table th:nth-child(3), .kot-table td:nth-child(3) { text-align: left; word-break: break-word; }
  .kot-table th { font-weight: 600; }
  .prep-note {
    font-style: italic;
    font-size: 0.8rem;
    margin-top: 14px;
    text-align: center;
    border-top: 1px dashed #777;
    padding-top: 8px;
  }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; background: #111; color: #fff; font-size: 0.85rem; margin: 8px 0; }
  .kot-page { page-break-after: always; }
  .kot-page:last-child { page-break-after: auto; }
  .kot-single { page-break-after: auto; }
  .kot-subtitle { font-size: 0.7rem; color: #666; text-align: center; margin: 4px 0 8px; }
  /* Key/value rows: keep labels tight, values aligned nicely */
  .kot-meta { display: grid; grid-template-columns: auto 1fr; column-gap: 8px; row-gap: 4px; font-size: 0.72rem; margin-top: 8px; color: #111; align-items: baseline; }
  .kot-meta > span:nth-child(odd) { color: #555; }
  .kot-meta > span:nth-child(even) { text-align: right; font-weight: 600; }
`

function renderKotInnerHtml(ticket: KitchenTicketPayload, d: Date) {
  const rows = ticket.lines
    .map(
      (line) => `<tr>
      <td>${escapeHtml(kotLineItemCell(line))}</td>
      <td style="font-weight:700">${line.qty}</td>
      <td style="font-size:0.95rem">${escapeHtml(line.lineNote?.trim() ? line.lineNote.trim() : kotLabels.none)}</td>
    </tr>`,
    )
    .join("")
  const noteBlock = `<p class="prep-note">${kotLabels.prepNote}</p>`
  return `
    <div class="kot-title">${kotLabels.title}</div>
    <p class="kot-subtitle">${kotLabels.subtitle}</p>
    <div style="text-align:center"><span class="badge">${ticket.kitchenBadgeSi}</span></div>
    <div class="kot-meta">
      <span>${kotLabels.orderNo}:</span><span style="text-align:right;font-family:monospace;font-weight:700">#${ticket.orderId}</span>
      <span>${kotLabels.table}:</span><span style="text-align:right">${escapeHtml(ticket.tableLabel)}</span>
      <span>${kotLabels.orderType}:</span><span style="text-align:right">${escapeHtml(ticket.orderTypeLabelSi)}</span>
      <span>${kotLabels.time}:</span><span style="text-align:right">${escapeHtml(d.toLocaleString())}</span>
    </div>
    <table class="kot-table">
      <thead><tr>
        <th>${kotLabels.item}</th>
        <th style="width:3rem">${kotLabels.qty}</th>
        <th>${kotLabels.note}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${noteBlock}
  `
}

/** 80mm thermal roll: content width ~72mm inside printable area. */
const THERMAL_BASE_STYLES = `
      @page { size: 80mm auto; margin: 2mm; }
      html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body {
        font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        width: 72mm;
        max-width: 72mm;
        margin: 0 auto;
        padding: 2mm;
        font-size: 11px;
        box-sizing: border-box;
      }
      @media print {
        html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; }
        body { margin: 0 auto; padding: 2mm; }
      }
`

function buildPrintDocumentHtmlCustomerOnly(customerHtml: string): string {
  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8" />
    <title>Customer bill</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      ${THERMAL_BASE_STYLES}
      .customer-print-section { color: #111; }
      .c-brand { text-align: center; }
      .c-brand-name { font-weight: 800; font-size: 14px; letter-spacing: 0.2px; margin: 0; }
      .c-brand-sub { font-size: 10px; color: #666; margin-top: 2px; }
      /* Center the header blocks like the KOT look */
      .c-rule { height: 1px; background: #e9e9e9; margin: 8px auto; max-width: 66mm; }
      .c-rule.dotted { background: none; border-top: 1px dashed #8c8c8c; height: 0; margin: 10px auto 8px; max-width: 66mm; }
      .meta { font-size: 10px; max-width: 66mm; margin: 0 auto; }
      .meta-row { display: flex; justify-content: space-between; gap: 8px; padding: 1px 0; }
      .meta-k { color: #555; }
      .meta-v { text-align: right; font-weight: 600; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; }
      .customer-print-section table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 10px auto 0; }
      .customer-print-section thead th { font-weight: 700; color: #333; padding: 6px 0 5px; border-bottom: 1px solid #dcdcdc; }
      .customer-print-section tbody td { padding: 7px 0; border-bottom: 1px solid #efefef; vertical-align: top; }
      .c-item { padding-right: 6px; }
      .c-qty { width: 2.5rem; text-align: center; font-weight: 700; }
      .c-money { text-align: right; white-space: nowrap; }
      .c-strong { font-weight: 800; }
      .totals { margin: 10px auto 0; padding-top: 8px; border-top: 1px solid #dcdcdc; font-size: 11px; max-width: 66mm; }
      .total-row { display: flex; justify-content: space-between; padding: 2px 0; color: #333; }
      .grand-row { display: flex; justify-content: space-between; padding-top: 6px; font-size: 14px; font-weight: 900; }
      .c-footer { text-align: center; font-size: 10px; color: #666; margin: 0; }
    </style>
  </head><body>${customerHtml}</body></html>`
}

/** One kitchen station per print job (80mm). */
function buildPrintDocumentHtmlKotSingle(kotInnerHtml: string): string {
  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8" />
    <title>Kitchen ticket</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      ${THERMAL_BASE_STYLES}
      ${KOT_PRINT_STYLES}
      body { font-family: 'Noto Sans Sinhala', system-ui, sans-serif; font-size: 12px; }
      .kot-title { font-size: 1.15rem; }
      .kot-table { font-size: 0.95rem; line-height: 1.5; }
      @media print {
        .kot-single { page-break-after: auto; break-after: auto; }
      }
    </style>
  </head><body><div class="kot-single">${kotInnerHtml}</div></body></html>`
}

type RunPrintOptions = {
  /** Use hidden iframe only — avoids popup blocker on jobs after the first (no user gesture). */
  preferIframe?: boolean
  /** Named Windows printer for QZ Tray / HTTP agent (customer or kitchen queue). */
  printerName?: string
}

function kitchenPrinterName(kitchen: Kitchen): string {
  const cfg = loadPrintPrinterConfig()
  return kitchen === "KITCHEN_1" ? cfg.kitchen1PrinterName.trim() : cfg.kitchen2PrinterName.trim()
}

function runPrint(html: string, onComplete?: () => void, options?: RunPrintOptions): void {
  let completeFired = false
  const fireComplete = () => {
    if (completeFired) return
    completeFired = true
    onComplete?.()
  }

  const cfg = loadPrintPrinterConfig()
  const printerName = (options?.printerName ?? "").trim()

  if (cfg.printBackend === "qz") {
    if (!printerName) {
      toast.error("Printer name empty — set it in Settings for this slot (QZ Tray).")
      queueMicrotask(() => fireComplete())
      return
    }
    void printHtmlViaQz(printerName, html)
      .then(() => fireComplete())
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e)
        toast.error(`QZ Tray print failed: ${msg}`)
        fireComplete()
      })
    return
  }

  if (cfg.printBackend === "http") {
    const base = cfg.printAgentUrl.trim()
    if (!base || !printerName) {
      toast.error("Set print agent URL and printer names in Settings.")
      queueMicrotask(() => fireComplete())
      return
    }
    void postPrintToAgent(base, printerName, html)
      .then(() => fireComplete())
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e)
        toast.error(`Print agent failed: ${msg}`)
        fireComplete()
      })
    return
  }

  const schedulePrint = (win: Window, opts: { closeDelayMs: number; printDelayMs: number }, afterIframeRemove?: () => void) => {
    const doc = win.document
    doc.open()
    doc.write(html)
    doc.close()
    win.focus()
    const doPrint = () => {
      win.print()
      const closeLater = () => {
        try {
          win.close()
        } catch {
          /* ignore */
        }
        afterIframeRemove?.()
        fireComplete()
      }
      win.addEventListener("afterprint", closeLater)
      setTimeout(closeLater, opts.closeDelayMs)
    }
    const kick = () => setTimeout(doPrint, opts.printDelayMs)
    if (doc.readyState === "complete") {
      kick()
    } else {
      win.addEventListener("load", kick)
    }
  }

  if (!options?.preferIframe) {
    const w = window.open("", "_blank", "width=320,height=720")
    if (w) {
      schedulePrint(w, { closeDelayMs: 2500, printDelayMs: 150 })
      return
    }
  }

  const iframe = document.createElement("iframe")
  iframe.setAttribute("title", "Print receipt")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;border:0;margin:0;padding:0;opacity:0;z-index:-1;pointer-events:none"
  document.body.appendChild(iframe)
  const iw = iframe.contentWindow
  if (!iw) {
    iframe.remove()
    fireComplete()
    return
  }
  schedulePrint(iw, { closeDelayMs: 8000, printDelayMs: 400 }, () => {
    iframe.remove()
  })
}

const SEQUENTIAL_PRINT_GAP_MS = 500

type PrintJob = { html: string; printerName?: string }

function runPrintJobsSequential(
  jobs: PrintJob[],
  delayBetweenMs = SEQUENTIAL_PRINT_GAP_MS,
  onAllDone?: () => void,
  allJobsPreferIframe?: boolean,
): void {
  if (jobs.length === 0) {
    onAllDone?.()
    return
  }
  let i = 0
  const next = () => {
    if (i >= jobs.length) {
      onAllDone?.()
      return
    }
    const idx = i++
    const preferIframe = allJobsPreferIframe === true || idx > 0
    runPrint(
      jobs[idx]!.html,
      () => {
        setTimeout(next, delayBetweenMs)
      },
      { preferIframe, printerName: jobs[idx]!.printerName },
    )
  }
  next()
}

/** Customer bill only — send to customer / cashier printer (80mm). */
export function printCustomerBillOnly(customer: CustomerBillPayload, d: Date = new Date()): void {
  const cfg = loadPrintPrinterConfig()
  runPrint(buildPrintDocumentHtmlCustomerOnly(buildCustomerBillHtml(customer, d)), undefined, {
    printerName: cfg.customerPrinterName,
  })
}

/** One print job per kitchen station (Kitchen 1 printer, then Kitchen 2 printer, etc.). */
export function printKitchenTicketsForStationsSequentially(
  tickets: KitchenTicketPayload[],
  d: Date = new Date(),
  onAllComplete?: () => void,
): void {
  if (tickets.length === 0) {
    onAllComplete?.()
    return
  }
  const jobs = tickets.map((t) => ({
    html: buildPrintDocumentHtmlKotSingle(renderKotInnerHtml(t, d)),
    printerName: kitchenPrinterName(t.kitchen),
  }))
  runPrintJobsSequential(jobs, SEQUENTIAL_PRINT_GAP_MS, onAllComplete, false)
}

/**
 * Customer bill first (pick customer/cashier printer), then one print per kitchen station (Kitchen 1, then Kitchen 2).
 * Kitchen jobs use iframe printing so the browser does not block popups after the first dialog.
 * @param onAllComplete — run after every job finishes (e.g. close UI).
 */
export function printCustomerBillAndKitchenTickets(
  customer: CustomerBillPayload,
  tickets: KitchenTicketPayload[],
  d: Date,
  onAllComplete?: () => void,
) {
  const cfg = loadPrintPrinterConfig()
  const customerDoc = buildPrintDocumentHtmlCustomerOnly(buildCustomerBillHtml(customer, d))
  const kotJobs = tickets.map((t) => ({
    html: buildPrintDocumentHtmlKotSingle(renderKotInnerHtml(t, d)),
    printerName: kitchenPrinterName(t.kitchen),
  }))
  if (kotJobs.length === 0) {
    runPrint(customerDoc, onAllComplete, { printerName: cfg.customerPrinterName })
    return
  }
  runPrint(customerDoc, () => {
    runPrintJobsSequential(kotJobs, SEQUENTIAL_PRINT_GAP_MS, onAllComplete, true)
  }, { printerName: cfg.customerPrinterName })
}

/** @deprecated Use printKitchenTicketsForStationsSequentially — kept for existing imports. */
export function printKitchenTicketsOnly(tickets: KitchenTicketPayload[], d: Date = new Date()): void {
  printKitchenTicketsForStationsSequentially(tickets, d)
}
