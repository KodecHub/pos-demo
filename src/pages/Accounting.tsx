import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  getAllInvoices,
  createInvoice,
  markInvoicePaid,
  deleteInvoice,
  type CustomerInvoice,
} from "@/lib/invoicesApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generatePDF, generateCustomerInvoicePdf } from "@/lib/pdfUtils";
import { StatCard } from "@/components/Dashboard/StatCard";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { toast } from "sonner";

type InvLineDraft = { description: string; qty: string; unitPrice: string };

const DEFAULT_NEW_LINE: InvLineDraft = { description: "", qty: "1", unitPrice: "" };

function linesSummary(inv: CustomerInvoice, maxLabels = 2): string {
  const parts = inv.lines.map((l) => l.description).slice(0, maxLabels);
  const more = inv.lines.length > maxLabels ? ` +${inv.lines.length - maxLabels} more` : "";
  return (parts.join(" · ") || "—") + more;
}

const Accounting = () => {
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([]);
  const [invCustomer, setInvCustomer] = useState("");
  const [invLines, setInvLines] = useState<InvLineDraft[]>([{ ...DEFAULT_NEW_LINE, unitPrice: "650" }]);

  useEffect(() => {
    void getAllInvoices().then(setCustomerInvoices);
  }, []);

  const handleCreateCustomerInvoice = async () => {
    if (!invCustomer.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    const parsedLines = invLines.map((row) => ({
      description: row.description.trim(),
      qty: Number.parseFloat(row.qty),
      unitPrice: Number.parseFloat(row.unitPrice),
    }));
    for (const l of parsedLines) {
      if (!l.description) {
        toast.error("Each line needs a description (e.g. Lunch, Sudhu rice, Ala curry).");
        return;
      }
      if (!Number.isFinite(l.qty) || l.qty <= 0) {
        toast.error("Each line needs quantity greater than zero.");
        return;
      }
      if (!Number.isFinite(l.unitPrice) || l.unitPrice < 0) {
        toast.error("Unit price must be zero or more (LKR).");
        return;
      }
    }
    try {
      const created = await createInvoice({ customerName: invCustomer, lines: parsedLines });
      setCustomerInvoices((prev) => [created, ...prev]);
      setInvCustomer("");
      setInvLines([{ ...DEFAULT_NEW_LINE, unitPrice: "650" }]);
      toast.success("Invoice created.");
      try {
        generateCustomerInvoicePdf(created);
      } catch (e) {
        console.error(e);
        toast.error("Invoice saved but PDF failed to download.");
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not create invoice.");
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const updated = await markInvoicePaid(invoiceId);
      setCustomerInvoices((prev) => prev.map((i) => (i.invoiceId === invoiceId ? updated : i)));
      setRecentTransactions((prev) => {
        const dup = prev.some((t) => t.id === `INV-${updated.invoiceId}`);
        if (dup) return prev;
        return [
          {
            id: `INV-${updated.invoiceId}`,
            date: new Date().toISOString().split("T")[0],
            type: "income" as const,
            category: "Sales",
            amount: updated.total,
            description: `Customer invoice ${updated.invoiceId} — ${updated.customerName}`,
          },
          ...prev,
        ];
      });
      toast.success("Marked paid — recorded as sales in Recent transactions.");
    } catch (e) {
      console.error(e);
      toast.error("Could not update invoice.");
    }
  };

  const handleDeleteInvoice = async (inv: CustomerInvoice) => {
    if (!window.confirm(`Delete invoice ${inv.invoiceId} for ${inv.customerName}?`)) return;
    try {
      await deleteInvoice(inv.invoiceId);
      setCustomerInvoices((prev) => prev.filter((i) => i.invoiceId !== inv.invoiceId));
      toast.success("Invoice deleted.");
    } catch (e) {
      console.error(e);
      toast.error("Could not delete invoice.");
    }
  };

  const handleDownloadInvoice = (inv: CustomerInvoice) => {
    try {
      generateCustomerInvoicePdf(inv);
    } catch (e) {
      console.error(e);
      toast.error("Could not download PDF.");
    }
  };

  const [recentTransactions, setRecentTransactions] = useState([
    { id: "TRX001", date: "2025-10-15", type: "income" as const, category: "Sales", amount: 125750.0, description: "Table 5 - Dinner Service" },
    { id: "TRX002", date: "2025-10-15", type: "expense" as const, category: "Inventory", amount: -45000.0, description: "Fresh Produce Delivery" },
    { id: "TRX003", date: "2025-10-14", type: "income" as const, category: "Sales", amount: 98500.0, description: "Online Orders" },
    { id: "TRX004", date: "2025-10-14", type: "expense" as const, category: "Utilities", amount: -32000.0, description: "Electricity Bill" },
    { id: "TRX005", date: "2025-10-14", type: "expense" as const, category: "Payroll", amount: -280000.0, description: "Staff Salaries - Week 41" },
    { id: "TRX006", date: "2025-10-13", type: "income" as const, category: "Sales", amount: 156250.0, description: "Weekend Rush" },
  ]);

  const ledgerIncome = useMemo(
    () => recentTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [recentTransactions],
  );
  const ledgerExpenseAbs = useMemo(
    () => recentTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0),
    [recentTransactions],
  );
  const ledgerNet = ledgerIncome - ledgerExpenseAbs;
  const profitMarginPct =
    ledgerIncome > 0 ? Math.min(99.9, Math.max(0, (ledgerNet / ledgerIncome) * 100)) : 0;

  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: ''
  });

  const handleAddTransaction = () => {
    const t = newTransaction.type === "income" ? ("income" as const) : ("expense" as const);
    const transaction = {
      id: `TRX${String(recentTransactions.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      type: t,
      category: newTransaction.category,
      amount: t === "income" ? parseFloat(newTransaction.amount) : -parseFloat(newTransaction.amount),
      description: newTransaction.description,
    };
    setRecentTransactions([transaction, ...recentTransactions]);
    setNewTransaction({ type: 'income', category: '', amount: '', description: '' });
  };

  const handleExportReport = async () => {
    try {
      await generatePDF('accounting-content', 'accounting-report.pdf')
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  };

  const expenses = [
    { category: "Inventory", amount: 1245000.00, percentage: 45, change: "+5%" },
    { category: "Payroll", amount: 890000.00, percentage: 32, change: "+2%" },
    { category: "Utilities", amount: 320000.00, percentage: 12, change: "-3%" },
    { category: "Rent", amount: 250000.00, percentage: 9, change: "0%" },
    { category: "Other", amount: 55000.00, percentage: 2, change: "+1%" },
  ];

  const invoices = [
    { id: "INV-001", vendor: "Fresh Farm Supplies", amount: 125000.00, dueDate: "2025-10-20", status: "pending" },
    { id: "INV-002", vendor: "City Water & Power", amount: 32000.00, dueDate: "2025-10-25", status: "pending" },
    { id: "INV-003", vendor: "Restaurant Equipment Co.", amount: 450000.00, dueDate: "2025-10-18", status: "overdue" },
    { id: "INV-004", vendor: "Cleaning Services Ltd", amount: 28000.00, dueDate: "2025-11-01", status: "pending" },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Accounting</h1>
            <p className="text-muted-foreground mt-2">Financial management and reporting</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="transaction-type">Transaction Type</Label>
                    <select
                      id="transaction-type"
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="transaction-category">Category</Label>
                    <select
                      id="transaction-category"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Select category</option>
                      {newTransaction.type === 'income' ? (
                        <>
                          <option value="Sales">Sales</option>
                          <option value="Online Orders">Online Orders</option>
                          <option value="Catering">Catering</option>
                          <option value="Other Income">Other Income</option>
                        </>
                      ) : (
                        <>
                          <option value="Inventory">Inventory</option>
                          <option value="Payroll">Payroll</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Rent">Rent</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Other Expense">Other Expense</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="transaction-amount">Amount (LKR)</Label>
                    <Input
                      id="transaction-amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="transaction-description">Description</Label>
                    <Input
                      id="transaction-description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      placeholder="Enter transaction description"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleAddTransaction}>Add Transaction</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div id="accounting-content" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatCurrencyCompact(ledgerIncome)}
            change="From ledger"
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrencyCompact(ledgerExpenseAbs)}
            change="From ledger"
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            title="Net Profit"
            value={formatCurrencyCompact(ledgerNet)}
            change="Income − expenses"
            icon={TrendingUp}
            trend={ledgerNet >= 0 ? "up" : "down"}
          />
          <StatCard
            title="Profit Margin"
            value={`${profitMarginPct.toFixed(1)}%`}
            change="On ledger income"
            icon={ArrowUpRight}
            trend={profitMarginPct >= 0 ? "up" : "down"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.type === "income" ? "text-success" : "text-destructive"}`}>
                        {transaction.type === "income" ? <ArrowUpRight className="inline w-4 h-4 mr-1" /> : <ArrowDownRight className="inline w-4 h-4 mr-1" />}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Monthly spending by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{expense.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatCurrency(expense.amount)}</span>
                      <Badge variant="outline" className="text-xs">{expense.change}</Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${expense.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer invoices</CardTitle>
            <CardDescription>
              Add any lines you need — meals (breakfast, lunch, dinner), catering items (e.g. sudu rice, ala curry), or
              custom descriptions with qty and unit price. Total must be greater than zero. Mark paid to record sales in{" "}
              <strong>Recent transactions</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 max-w-3xl">
              <div className="grid gap-2">
                <Label htmlFor="ci-name">Customer name</Label>
                <Input
                  id="ci-name"
                  value={invCustomer}
                  onChange={(e) => setInvCustomer(e.target.value)}
                  placeholder="Company or person"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Line items</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setInvLines((rows) => [...rows, { ...DEFAULT_NEW_LINE }])}
                  >
                    Add line
                  </Button>
                </div>
                {invLines.map((row, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="grid gap-1 flex-1 min-w-[160px]">
                      <span className="text-xs text-muted-foreground">Description</span>
                      <Input
                        value={row.description}
                        onChange={(e) =>
                          setInvLines((prev) => prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r)))
                        }
                        placeholder="e.g. Lunch, Dinner, Sudhu rice"
                      />
                    </div>
                    <div className="grid gap-1 w-24">
                      <span className="text-xs text-muted-foreground">Qty</span>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={row.qty}
                        onChange={(e) =>
                          setInvLines((prev) => prev.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))
                        }
                      />
                    </div>
                    <div className="grid gap-1 w-32">
                      <span className="text-xs text-muted-foreground">Unit (LKR)</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={row.unitPrice}
                        onChange={(e) =>
                          setInvLines((prev) => prev.map((r, i) => (i === idx ? { ...r, unitPrice: e.target.value } : r)))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={invLines.length <= 1}
                      onClick={() => setInvLines((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="button" className="w-fit" onClick={() => void handleCreateCustomerInvoice()}>
                Save invoice &amp; download PDF
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-center">Lines</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground text-center py-6">
                      No customer invoices yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  customerInvoices.map((inv) => (
                    <TableRow key={inv.invoiceId}>
                      <TableCell className="font-mono text-xs">{inv.invoiceId}</TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell className="max-w-[220px] text-sm text-muted-foreground">{linesSummary(inv)}</TableCell>
                      <TableCell className="text-center">{inv.lines.length}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(inv.total)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "paid" ? "default" : "secondary"}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(inv.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button type="button" size="sm" variant="outline" onClick={() => handleDownloadInvoice(inv)}>
                            PDF
                          </Button>
                          {inv.status === "pending" && (
                            <Button type="button" size="sm" onClick={() => void handleMarkPaid(inv.invoiceId)}>
                              Mark paid
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => void handleDeleteInvoice(inv)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invoices</CardTitle>
            <CardDescription>Vendor payables (demo)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.vendor}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "overdue" ? "destructive" : "secondary"}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">Pay Now</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Accounting;
