"use client";

import { useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#C1272D", "#E8A33D", "#3A5A40", "#2B1B12", "#E0454B", "#588157", "#F4C27A"];

interface Props {
  dailySales: { date: string; total: number }[];
  hourlyOrders: { hour: string; orders: number }[];
  revenueByCategory: { name: string; value: number }[];
  bestSelling: { name: string; qty: number }[];
  worstSelling: { name: string; qty: number }[];
  topTables: { label: string; total: number }[];
  avgPrepTime: number;
  avgRating: number;
  totalRevenue: number;
}

export function ReportsDashboard(props: Props) {
  const { dailySales, hourlyOrders, revenueByCategory, bestSelling, worstSelling, topTables, avgPrepTime, avgRating, totalRevenue } = props;

  function exportCSV() {
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue (14 days)", totalRevenue.toFixed(2)],
      ["Average Prep Time (min)", avgPrepTime.toFixed(1)],
      ["Average Rating", avgRating.toFixed(2)],
      [],
      ["Daily Sales"],
      ["Date", "Total"],
      ...dailySales.map((d) => [d.date, d.total.toFixed(2)]),
      [],
      ["Revenue by Category"],
      ["Category", "Revenue"],
      ...revenueByCategory.map((r) => [r.name, r.value.toFixed(2)]),
      [],
      ["Best Selling Items"],
      ["Item", "Quantity"],
      ...bestSelling.map((b) => [b.name, String(b.qty)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rocco-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Rocco's Pizza — Performance Report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Total Revenue (14d): ${formatCurrency(totalRevenue)}`, 14, 28);
    doc.text(`Average Prep Time: ${avgPrepTime.toFixed(1)} min`, 14, 34);
    doc.text(`Average Rating: ${avgRating.toFixed(2)} / 5`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [["Date", "Sales"]],
      body: dailySales.map((d) => [d.date, formatCurrency(d.total)]),
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Category", "Revenue"]],
      body: revenueByCategory.map((r) => [r.name, formatCurrency(r.value)]),
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Best Sellers", "Qty"]],
      body: bestSelling.map((b) => [b.name, String(b.qty)]),
    });
    doc.save("rocco-report.pdf");
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex gap-2">
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        <Button variant="outline" onClick={exportPDF}>
          <FileText className="h-4 w-4" /> Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBox label="Revenue (14 days)" value={formatCurrency(totalRevenue)} />
        <StatBox label="Avg Prep Time" value={`${avgPrepTime.toFixed(1)} min`} />
        <StatBox label="Avg Rating" value={`${avgRating.toFixed(2)} / 5`} />
      </div>

      <ChartCard title="Daily Sales">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2B1B1210" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Line type="monotone" dataKey="total" stroke="#C1272D" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Peak Ordering Hours">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B1B1210" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#E8A33D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={revenueByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                {revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ListCard title="Best Selling Items" rows={bestSelling.map((b) => ({ label: b.name, value: `${b.qty} sold` }))} />
        <ListCard title="Worst Selling Items" rows={worstSelling.map((b) => ({ label: b.name, value: `${b.qty} sold` }))} />
        <ListCard title="Top Tables by Spend" rows={topTables.map((t) => ({ label: t.label, value: formatCurrency(t.total) }))} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-card border border-espresso/5 shadow-ticket p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</p>
      <p className="font-display text-2xl font-semibold mt-2">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card border border-espresso/5 shadow-ticket p-5">
      <p className="text-sm font-semibold mb-3">{title}</p>
      {children}
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div className="bg-white rounded-card border border-espresso/5 shadow-ticket p-5">
      <p className="text-sm font-semibold mb-3">{title}</p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-ink/70 truncate">{r.label}</span>
            <span className="font-mono font-semibold shrink-0">{r.value}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-ink/30">No data yet.</p>}
      </div>
    </div>
  );
}
