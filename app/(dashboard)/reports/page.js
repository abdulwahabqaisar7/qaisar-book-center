"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./page.module.css";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];

export default function Reports() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [period, setPeriod] = useState("month");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [useCustomRange, setUseCustomRange] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period, useCustomRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      let url = `/api/analytics?period=${period}`;
      if (useCustomRange && customRange.from && customRange.to) {
        url = `/api/analytics?from=${customRange.from}&to=${customRange.to}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch analytics report.");
    } finally {
      setLoading(false);
    }
  }

  const handleCustomRangeSubmit = (e) => {
    e.preventDefault();
    if (customRange.from && customRange.to) {
      setUseCustomRange(true);
    }
  };

  const handlePeriodChange = (val) => {
    setUseCustomRange(false);
    setPeriod(val);
  };

  const getExportLink = () => {
    if (useCustomRange && customRange.from && customRange.to) {
      return `/api/export/invoices?from=${customRange.from}&to=${customRange.to}`;
    }
    const now = new Date();
    let fromDate;
    if (period === "today") {
      fromDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    } else if (period === "week") {
      fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
    } else if (period === "month") {
      fromDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
    } else if (period === "year") {
      fromDate = new Date(now.setDate(now.getDate() - 365)).toISOString();
    }

    if (fromDate) {
      const toDate = new Date().toISOString();
      return `/api/export/invoices?from=${fromDate}&to=${toDate}`;
    }
    return "/api/export/invoices";
  };

  if (loading && !analyticsData) {
    return <div className={styles.loading}>Generating Analytics Report...</div>;
  }

  const { summary = {}, salesByDay = [], topProducts = [], categoryBreakdown = [], paymentMethodBreakdown = [] } =
    analyticsData || {};

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Reports & Business Analytics</h1>
          <p className={styles.subtitle}>Monitor profit margins, sales trends, and product performance.</p>
        </div>
        <div className={styles.headerActions}>
          <a href={getExportLink()} download>
            <button className={styles.exportButton}>📥 Export CSV Report</button>
          </a>
        </div>
      </div>

        {/* Filters */}
        <div className={styles.filtersGroup}>
          <div className={styles.periodTabs}>
            {["today", "week", "month", "year", "all"].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`${styles.tabBtn} ${period === p && !useCustomRange ? styles.tabBtnActive : ""}`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomRangeSubmit} className={styles.customDateForm}>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) => setCustomRange((prev) => ({ ...prev, from: e.target.value }))}
              className={styles.dateInput}
              required
            />
            <span>to</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) => setCustomRange((prev) => ({ ...prev, to: e.target.value }))}
              className={styles.dateInput}
              required
            />
            <button type="submit" className={styles.dateSubmitBtn}>
              Go
            </button>
          </form>
        </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Summary Matrix Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <span className={styles.cardIcon}>💰</span>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Gross Sales Revenue</span>
            <span className={styles.cardVal}>Rs. {summary.totalRevenue?.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.cardIcon}>📈</span>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Gross Profit Margin</span>
            <span className={styles.cardVal} style={{ color: "var(--success)" }}>
              Rs. {summary.grossProfit?.toLocaleString()}
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.cardIcon}>🧾</span>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Total Bills Generated</span>
            <span className={styles.cardVal}>{summary.totalInvoices} bills</span>
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.cardIcon}>⚖️</span>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>Average Bill Value</span>
            <span className={styles.cardVal}>Rs. {summary.avgInvoiceValue?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Sales trend chart */}
        <div className={`${styles.chartPanel} ${styles.fullWidth}`}>
          <h2 className={styles.chartTitle}>Daily Sales Trend (PKR)</h2>
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={salesByDay} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <Area type="monotone" dataKey="totalSales" stroke="var(--accent)" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products bar chart */}
        <div className={styles.chartPanel}>
          <h2 className={styles.chartTitle}>Top 10 Stationery Products (Units Sold)</h2>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <Bar dataKey="quantity" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown pie chart */}
        <div className={styles.chartPanel}>
          <h2 className={styles.chartTitle}>Revenue Share by Category</h2>
          <div style={{ width: "100%", height: 320, display: "flex", justifyContent: "center", alignItems: "center" }}>
            {categoryBreakdown.length === 0 ? (
              <p className={styles.noChartData}>No category sales records.</p>
            ) : (
              <ResponsiveContainer width="99%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment method pie chart */}
        <div className={styles.chartPanel}>
          <h2 className={styles.chartTitle}>Payment Method Breakdown</h2>
          <div style={{ width: "100%", height: 320, display: "flex", justifyContent: "center", alignItems: "center" }}>
            {paymentMethodBreakdown.length === 0 ? (
              <p className={styles.noChartData}>No payment method records.</p>
            ) : (
              <ResponsiveContainer width="99%">
                <PieChart>
                  <Pie
                    data={paymentMethodBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentMethodBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
