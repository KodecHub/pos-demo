/**
 * Sends full HTML documents to a named printer via QZ Tray (must be installed and running).
 * Printers can be USB, Wi‑Fi, or shared network queues added in Windows — use the exact name from Settings → Printers.
 */
export async function printHtmlViaQz(printerName: string, html: string): Promise<void> {
  const qz = (await import("qz-tray")).default
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect()
  }
  const config = qz.configs.create(printerName)
  const data = [{ type: "pixel", format: "html", flavor: "plain", data: html }]
  await qz.print(config, data)
}
