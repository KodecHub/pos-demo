/** POST {baseUrl}/print with JSON { printerName, html } — used by the optional print-agent Node service. */
export async function postPrintToAgent(baseUrl: string, printerName: string, html: string): Promise<void> {
  const base = baseUrl.replace(/\/$/, "")
  const res = await fetch(`${base}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ printerName, html }),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const j = (await res.json()) as { error?: string }
      if (j.error) detail = j.error
    } catch {
      detail = (await res.text()) || detail
    }
    throw new Error(detail || `HTTP ${res.status}`)
  }
}
