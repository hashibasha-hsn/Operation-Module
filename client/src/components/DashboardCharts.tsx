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
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function KpiGrid({ kpis }: { kpis: Record<string, number | string> }) {
  const entries = Object.entries(kpis ?? {});
  if (!entries.length) {
    return <p className="text-muted-foreground text-sm">No KPI data available</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {entries.map(([key, value]) => (
        <Card key={key}>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground capitalize mt-1">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows?.length) {
    return <p className="text-muted-foreground text-sm py-8 text-center">No table rows available</p>;
  }
  const HIDDEN_KEYS = new Set(["id", "storeId", "userId", "assetId", "formId", "submissionId"]);
  const columns = Object.keys(rows[0]).filter((col) => !HIDDEN_KEYS.has(col));
  return (
    <div className="rounded-md border overflow-auto max-h-96">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="capitalize whitespace-nowrap">
                {col.replace(/([A-Z])/g, " $1").trim()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col} className="whitespace-nowrap">
                  {String(row[col] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-72 flex items-center justify-center text-muted-foreground">
      No chart data available
    </div>
  );
}

export function DashboardChart({
  chartType,
  dashboardType,
  data,
}: {
  chartType: string;
  dashboardType: string;
  data: any;
}) {
  if (!data) return <EmptyChart />;

  if (chartType === "kpi") {
    return <KpiGrid kpis={data.kpis ?? {}} />;
  }

  if (chartType === "table") {
    return <DataTable rows={data.tableRows ?? []} />;
  }

  if (dashboardType === "process-workflow") {
    if (chartType === "pie" && data.statusWiseData?.length) {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={data.statusWiseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
              {data.statusWiseData.map((_: any, index: number) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line" && (data.timeSeriesData?.length || data.processWiseData?.length)) {
      const chartData = data.timeSeriesData?.length
        ? data.timeSeriesData
        : data.processWiseData.map((row: any) => ({
            date: row.processName?.slice(0, 18) || "Unknown",
            completed: row.completed ?? 0,
            pending: row.pending ?? 0,
            created: row.total ?? 0,
          }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={data.timeSeriesData?.length ? "date" : "date"} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="completed" stroke={CHART_COLORS[1]} strokeWidth={2} />
            <Line type="monotone" dataKey="pending" stroke={CHART_COLORS[3]} strokeWidth={2} />
            {data.timeSeriesData?.length ? (
              <Line type="monotone" dataKey="created" stroke={CHART_COLORS[0]} strokeWidth={2} />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (data.processWiseData?.length) {
      const chartData = data.processWiseData.map((row: any) => ({
        name: row.processName?.slice(0, 18) || "Unknown",
        completed: row.completed ?? 0,
        pending: row.pending ?? 0,
        total: row.total ?? 0,
      }));
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill={CHART_COLORS[1]} />
            <Bar dataKey="pending" fill={CHART_COLORS[3]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }

  if (dashboardType === "ticket") {
    if (chartType === "pie" && data.statusWiseData?.length) {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={data.statusWiseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
              {data.statusWiseData.map((_: any, index: number) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line" && data.timeSeriesData?.length) {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data.timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="created" stroke={CHART_COLORS[0]} strokeWidth={2} />
            <Line type="monotone" dataKey="completed" stroke={CHART_COLORS[1]} strokeWidth={2} />
            <Line type="monotone" dataKey="closed" stroke={CHART_COLORS[4]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    const statusData = data.statusWiseData?.length
      ? data.statusWiseData
      : [
          { name: "Open", value: data.kpis?.open ?? 0 },
          { name: "On Hold", value: data.kpis?.onHold ?? 0 },
          { name: "Completed", value: data.kpis?.completed ?? 0 },
          { name: "Closed", value: data.kpis?.closed ?? 0 },
        ];

    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={statusData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={CHART_COLORS[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (dashboardType === "action-point") {
    if (chartType === "pie") {
      const pieData = data.priorityWiseData?.length
        ? data.priorityWiseData.map((row: any) => ({ name: row.priority, value: row.total }))
        : data.statusWiseData ?? [];
      if (!pieData.length) return <EmptyChart />;
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
              {pieData.map((_: any, index: number) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line" && data.timeSeriesData?.length) {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data.timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="created" stroke={CHART_COLORS[0]} strokeWidth={2} />
            <Line type="monotone" dataKey="completed" stroke={CHART_COLORS[1]} strokeWidth={2} />
            <Line type="monotone" dataKey="closed" stroke={CHART_COLORS[4]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (data.priorityWiseData?.length) {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.priorityWiseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="priority" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="open" fill={CHART_COLORS[3]} />
            <Bar dataKey="inProgress" fill={CHART_COLORS[2]} />
            <Bar dataKey="completed" fill={CHART_COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (data.statusWiseData?.length) {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.statusWiseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill={CHART_COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }

  return <EmptyChart />;
}
