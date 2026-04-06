import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import {
  printCustomerBillAndKitchenTickets,
  customerReceiptDialogLabels,
  type OrderBillsPayload,
} from "@/components/POS/receiptPrint"
import { loadPrintPrinterConfig } from "@/lib/printConfig"

export function SinhalaReceiptDialog({
  open,
  onOpenChange,
  payload,
  /** Fired after user prints a dine-in “Pending payment” bill (Orders flow). */
  onPendingDineInBillPrinted,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  payload: OrderBillsPayload | null
  onPendingDineInBillPrinted?: (orderId: number) => void
}) {
  if (!payload) return null

  const d = new Date()
  const L = customerReceiptDialogLabels
  const printBackend = loadPrintPrinterConfig().printBackend

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {payload.kitchenTickets.length === 0 &&
            payload.customer.paymentLabel.toLowerCase().includes("pending")
              ? "Customer bill"
              : payload.kitchenTickets.length === 0
                ? "Sale complete"
                : "Order complete"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div
            className="space-y-3 text-sm p-2 border rounded-lg bg-card"
            style={{ fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}
          >
            <div className="text-center border-b pb-2">
              <p className="font-semibold text-base">{L.restaurant}</p>
              <p className="text-xs text-muted-foreground">{L.receipt}</p>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span>{L.date}:</span>
              <span className="text-right">{d.toLocaleString()}</span>
              <span>{L.orderNo}:</span>
              <span className="text-right font-mono">#{payload.customer.orderId}</span>
              <span>{L.table}:</span>
              <span className="text-right">{payload.customer.tableLabel}</span>
              <span>{L.orderType}:</span>
              <span className="text-right">{payload.customer.orderTypeLabel}</span>
              {payload.customer.paymentLabel.trim() ? (
                <>
                  <span>{L.payment}:</span>
                  <span className="text-right">{payload.customer.paymentLabel}</span>
                </>
              ) : null}
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">{L.item}</th>
                  <th className="text-center w-10">{L.qty}</th>
                  <th className="text-right">{L.unit}</th>
                  <th className="text-right">{L.amount}</th>
                </tr>
              </thead>
              <tbody>
                {payload.customer.lines.map((line, i) => (
                  <tr key={i} className="border-b border-muted/50">
                    <td className="py-1.5 pr-1">{line.portion ? `${line.name} (${line.portion})` : line.name}</td>
                    <td className="text-center">{line.qty}</td>
                    <td className="text-right whitespace-nowrap">{formatCurrency(line.unitPrice)}</td>
                    <td className="text-right whitespace-nowrap font-medium">{formatCurrency(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-xs border-t pt-2">
              {payload.customer.taxAmount > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span>{L.sub}</span>
                    <span>{formatCurrency(payload.customer.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{L.tax}</span>
                    <span>{formatCurrency(payload.customer.taxAmount)}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between text-base font-bold pt-1">
                <span>{L.grand}</span>
                <span>{formatCurrency(payload.customer.total)}</span>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2">{L.thanks}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              onClick={() => {
                const pending = payload.customer.paymentLabel.toLowerCase().includes("pending")
                printCustomerBillAndKitchenTickets(payload.customer, payload.kitchenTickets, d, () => {
                  if (pending) onPendingDineInBillPrinted?.(payload.customer.orderId)
                  onOpenChange(false)
                })
              }}
            >
              {payload.kitchenTickets.length === 0 ? "Print customer bill" : "Print receipt & kitchen tickets"}
            </Button>
            {payload.kitchenTickets.length > 0 ? (
              <p className="text-[10px] text-muted-foreground text-right leading-snug max-w-md ml-auto">
                {printBackend === "browser" ? (
                  <>
                    Separate print dialogs: <span className="font-medium text-foreground">customer bill</span> first,
                    then <span className="font-medium text-foreground">one per kitchen station</span>. Pick the correct
                    80mm printer each time.
                  </>
                ) : (
                  <>
                    Jobs run in order: <span className="font-medium text-foreground">customer bill</span>, then{" "}
                    <span className="font-medium text-foreground">one ticket per kitchen</span>, using the printer names
                    in Settings (silent — no browser print dialog).
                  </>
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
