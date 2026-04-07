import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileDown } from "lucide-react";
import { generatePDF, generateSalarySlipPdf } from "@/lib/pdfUtils";
import { ReportPdfShell } from "@/components/reports/ReportPdfShell";
import { toast } from "sonner";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { getAllEmployees, PAID_LEAVE_DAYS_PER_MONTH, type Employee } from "@/lib/employeesApi";
import {
  getAllAttendanceRecords,
  upsertAttendanceForDay,
  summarizeMonth,
  netPayrollForMonth,
  type AttendanceStatus,
} from "@/lib/attendanceRecordsApi";

function todayISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  leave: "Leave",
  absent: "Absent",
};

const Attendance = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<Awaited<ReturnType<typeof getAllAttendanceRecords>>>([]);
  const [selectedDate, setSelectedDate] = useState(todayISODate);
  const [payrollMonth, setPayrollMonth] = useState(currentYearMonth);

  const load = async () => {
    const [emps, recs] = await Promise.all([getAllEmployees(), getAllAttendanceRecords()]);
    setEmployees(emps);
    setRecords(recs);
  };

  useEffect(() => {
    void load();
  }, []);

  const statusFor = (employeeId: string, date: string): AttendanceStatus => {
    const r = records.find((x) => x.employeeId === employeeId && x.date === date);
    return r?.status ?? "present";
  };

  const handleStatusChange = async (employeeId: string, date: string, status: AttendanceStatus) => {
    const saved = await upsertAttendanceForDay(employeeId, date, status);
    setRecords((prev) => {
      const others = prev.filter((r) => !(r.employeeId === employeeId && r.date === date));
      return [saved, ...others];
    });
  };

  const presentToday = useMemo(() => {
    return records.filter((r) => r.date === selectedDate && r.status === "present").length;
  }, [records, selectedDate]);

  const leaveToday = useMemo(() => {
    return records.filter((r) => r.date === selectedDate && r.status === "leave").length;
  }, [records, selectedDate]);

  const payrollRows = useMemo(() => {
    return employees.map((emp) => {
      const sum = summarizeMonth(records, emp.employeeId, payrollMonth);
      const pay = netPayrollForMonth(emp.paymentPerDay, emp.monthlyLoanAdvanceDeductionLkr, sum);
      return { emp, sum, ...pay };
    });
  }, [employees, records, payrollMonth]);

  const downloadSlip = (row: (typeof payrollRows)[number]) => {
    try {
      generateSalarySlipPdf({
        employeeName: row.emp.name,
        employeeId: row.emp.employeeId,
        role: row.emp.role,
        periodYm: payrollMonth,
        paymentPerDay: row.emp.paymentPerDay,
        present: row.sum.present,
        leave: row.sum.leave,
        absent: row.sum.absent,
        paidLeaveDays: row.sum.paidLeaveDays,
        unpaidLeaveDays: row.sum.unpaidLeaveDays,
        paidDays: row.sum.paidDays,
        grossLkr: row.grossLkr,
        deductionLkr: row.deductionLkr,
        netLkr: row.netLkr,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportReport = async () => {
    try {
      await generatePDF("attendance-content", "RestaurantOS-attendance-report.pdf", { marginMm: 12 });
      toast.success("PDF downloaded.");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Could not export PDF.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 relative">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground mt-2">
              Employees come from <strong className="text-foreground">Staff &amp; HR</strong>. Mark daily status per employee. Up to{" "}
              {PAID_LEAVE_DAYS_PER_MONTH} leave days per month count as paid; extra leave is unpaid.
            </p>
          </div>
          <Button variant="outline" onClick={() => void handleExportReport()}>
            <Download className="w-4 h-4 mr-2" />
            Export report
          </Button>
        </div>

        <div id="attendance-content" className="max-w-5xl">
          <ReportPdfShell
            title="Attendance & payroll report"
            subtitle={`Selected date: ${selectedDate} · Payroll month: ${payrollMonth} · Paid leave cap: ${PAID_LEAVE_DAYS_PER_MONTH} days/month`}
            footer="Demo data stored locally. Switch tabs before export to include daily marking or payroll table in the capture."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Present (selected day)" value={String(presentToday)} change="—" icon={Calendar} trend="up" />
              <StatCard title="Leave (selected day)" value={String(leaveToday)} change="—" icon={Calendar} trend="down" />
              <StatCard title="Employees" value={String(employees.length)} change="—" icon={Calendar} trend="up" />
            </div>

            <Tabs defaultValue="daily" className="space-y-6">
          <TabsList>
            <TabsTrigger value="daily">Daily marking</TabsTrigger>
            <TabsTrigger value="payroll">Monthly payroll (demo)</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Record attendance</CardTitle>
                <CardDescription>Select the date, then set status for each employee. Data is stored locally for this demo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 max-w-xs">
                  <Label htmlFor="att-date">Date</Label>
                  <Input id="att-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Pay / day</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.employeeId}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>{emp.role}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(emp.paymentPerDay)}</TableCell>
                        <TableCell>
                          <select
                            className="flex h-9 w-full max-w-[220px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={statusFor(emp.employeeId, selectedDate)}
                            onChange={(e) =>
                              void handleStatusChange(emp.employeeId, selectedDate, e.target.value as AttendanceStatus)
                            }
                          >
                            <option value="present">{statusLabels.present}</option>
                            <option value="leave">{statusLabels.leave}</option>
                            <option value="absent">{statusLabels.absent}</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {employees.length === 0 && <p className="text-sm text-muted-foreground">Add employees under Staff &amp; HR first.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <CardTitle>Monthly payroll estimate</CardTitle>
                <CardDescription>
                  Paid days = present + min(leave, {PAID_LEAVE_DAYS_PER_MONTH}) in the month. Gross = paid days × daily rate.
                  Net = gross minus each employee&apos;s monthly loan/advance deduction (set under Staff — click the name).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 max-w-xs">
                  <Label htmlFor="pay-month">Month</Label>
                  <Input id="pay-month" type="month" value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)} />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Leave</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Paid leave days</TableHead>
                      <TableHead className="text-center">Unpaid leave</TableHead>
                      <TableHead className="text-right">Paid days</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Gross (LKR)</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Deduction</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Net (LKR)</TableHead>
                      <TableHead className="text-right w-[1%]">Slip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRows.map((row) => (
                      <TableRow key={row.emp.employeeId}>
                        <TableCell className="font-medium">{row.emp.name}</TableCell>
                        <TableCell className="text-center">{row.sum.present}</TableCell>
                        <TableCell className="text-center">{row.sum.leave}</TableCell>
                        <TableCell className="text-center">{row.sum.absent}</TableCell>
                        <TableCell className="text-center">{row.sum.paidLeaveDays}</TableCell>
                        <TableCell className="text-center">{row.sum.unpaidLeaveDays}</TableCell>
                        <TableCell className="text-right font-semibold">{row.sum.paidDays}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(row.grossLkr)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(row.deductionLkr)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(row.netLkr)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 pdf-hide"
                            onClick={() => downloadSlip(row)}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground">Month filter: {payrollMonth}. Only records with dates in this month are counted.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </ReportPdfShell>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
