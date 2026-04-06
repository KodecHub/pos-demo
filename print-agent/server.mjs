/**
 * Local silent print bridge for the POS web app (Windows).
 * - Listens on PORT (default 9101), POST /print { printerName, html }
 * - Renders HTML with Puppeteer → PDF → pdf-to-printer (named Windows queue)
 * - Network printers: add them in Windows first; use that exact name in POS Settings.
 */
import cors from "cors"
import express from "express"
import { mkdtemp, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { print } from "pdf-to-printer"
import puppeteer from "puppeteer"

const PORT = Number(process.env.PORT) || 9101

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: "4mb" }))

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.post("/print", async (req, res) => {
  const { printerName, html } = req.body ?? {}
  if (typeof printerName !== "string" || !printerName.trim()) {
    return res.status(400).json({ error: "printerName required" })
  }
  if (typeof html !== "string" || !html.trim()) {
    return res.status(400).json({ error: "html required" })
  }

  const dir = await mkdtemp(join(tmpdir(), "pos-print-"))
  const pdfPath = join(dir, "job.pdf")
  let browser
  try {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 })
    await page.pdf({
      path: pdfPath,
      width: "80mm",
      printBackground: true,
      margin: { top: "2mm", right: "2mm", bottom: "2mm", left: "2mm" },
    })
    await browser.close()
    browser = null

    await print(pdfPath, { printer: printerName.trim() })
    res.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    res.status(500).json({ error: message })
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`POS print agent: http://127.0.0.1:${PORT}  POST /print`)
})
