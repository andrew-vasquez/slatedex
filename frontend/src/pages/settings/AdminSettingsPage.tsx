import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiBarChart2,
  FiCpu,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLink from "~/components/ui/AppLink";
import UserMenu from "@/components/auth/UserMenu";
import Breadcrumb from "@/components/ui/Breadcrumb";
import MobileSiteMenu from "@/components/ui/MobileSiteMenu";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  ApiError,
  fetchAdminOverview,
  fetchAdminUsers,
  fetchMyProfile,
  updateAdminUserEntitlements,
  updateAdminUserRole,
  type AdminOverview,
  type AdminUserRow,
  type MyProfile,
  type UserPlanValue,
  type UserRoleValue,
} from "@/lib/api";

type RangeKey = "30d" | "90d" | "12m";
type UserDraft = {
  plan: UserPlanValue;
  monthlyChatLimit: number;
  monthlyAnalyzeLimit: number;
  unlimitedAiChat: boolean;
  unlimitedAiAnalyze: boolean;
  role: UserRoleValue;
};

const PIE_COLORS = ["#da2c43", "#1d87e4", "#ef9f2f", "#43b97a", "#9668ff"];

function toDayLabel(day: string): string {
  return new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toInputLimit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100000, Math.floor(value)));
}

function badgeStyles(badge: "Owner" | "Admin" | "Pro" | null) {
  if (badge === "Owner") {
    return {
      borderColor: "rgba(218,44,67,0.5)",
      background: "rgba(218,44,67,0.18)",
      color: "#fda4af",
    };
  }
  if (badge === "Admin") {
    return {
      borderColor: "rgba(59,130,246,0.5)",
      background: "rgba(59,130,246,0.18)",
      color: "#93c5fd",
    };
  }
  if (badge === "Pro") {
    return {
      borderColor: "rgba(52,211,153,0.5)",
      background: "rgba(16,185,129,0.18)",
      color: "#6ee7b7",
    };
  }
  return {
    borderColor: "var(--border)",
    background: "var(--surface-2)",
    color: "var(--text-muted)",
  };
}

/* ── Custom chart tooltip (matches dark theme) ── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text-primary)" }}
    >
      <p className="mb-1 font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{entry.name}:</span>
          <span className="font-semibold">{fmtNum(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Number formatter ── */
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ── KPI card config ── */
const KPI_META: { key: string; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "totalUsers", label: "Total Users", icon: <FiUsers size={14} />, color: "#da2c43" },
  { key: "newUsersInRange", label: "New Users", icon: <FiTrendingUp size={14} />, color: "#22c55e" },
  { key: "totalTeams", label: "Teams Built", icon: <FiBarChart2 size={14} />, color: "#f97316" },
  { key: "totalChats", label: "AI Chats", icon: <FiZap size={14} />, color: "#38bdf8" },
  { key: "totalAnalyzes", label: "Analyzes", icon: <FiCpu size={14} />, color: "#a78bfa" },
  { key: "activeUsersLast30d", label: "Active (30d)", icon: <FiActivity size={14} />, color: "#34d399" },
  { key: "usersAtQuotaCurrentMonth", label: "At Quota", icon: <FiAlertCircle size={14} />, color: "#fbbf24" },
];

/* ── Skeleton block ── */
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg ${className ?? ""}`} style={{ background: "var(--skeleton-b)" }} />;
}

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [viewer, setViewer] = useState<MyProfile | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [adminAccessDenied, setAdminAccessDenied] = useState(false);
  const [range, setRange] = useState<RangeKey>("30d");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const canAccessAdmin = !adminAccessDenied;

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setViewerLoading(true);
    setViewerError(null);

    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setViewer(profile);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setViewerError(error instanceof Error ? error.message : "Failed to load account role.");
      })
      .finally(() => {
        if (!cancelled) setViewerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const syncDrafts = (rows: AdminUserRow[]) => {
    setDrafts((current) => {
      const next = { ...current };
      for (const row of rows) {
        if (next[row.id]) continue;
        next[row.id] = {
          plan: row.plan,
          monthlyChatLimit: row.entitlements.monthlyChatLimit,
          monthlyAnalyzeLimit: row.entitlements.monthlyAnalyzeLimit,
          unlimitedAiChat: row.entitlements.unlimitedAiChat,
          unlimitedAiAnalyze: row.entitlements.unlimitedAiAnalyze,
          role: row.role,
        };
      }
      return next;
    });
  };

  const loadOverview = async (nextRange: RangeKey) => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const result = await fetchAdminOverview(nextRange);
      setAdminAccessDenied(false);
      setOverview(result);
    } catch (error: unknown) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setAdminAccessDenied(true);
        return;
      }
      setOverviewError(error instanceof Error ? error.message : "Failed to load overview.");
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadUsers = async (params?: { append?: boolean; cursor?: string | null; search?: string }) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const result = await fetchAdminUsers({
        query: params?.search ?? query,
        cursor: params?.cursor ?? undefined,
        limit: 25,
      });
      setAdminAccessDenied(false);
      setUsers((current) => (params?.append ? [...current, ...result.items] : result.items));
      syncDrafts(result.items);
      setNextCursor(result.nextCursor);
    } catch (error: unknown) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setAdminAccessDenied(true);
        return;
      }
      setUsersError(error instanceof Error ? error.message : "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || adminAccessDenied) return;
    void loadOverview(range);
  }, [adminAccessDenied, isAuthenticated, range]);

  useEffect(() => {
    if (!isAuthenticated || adminAccessDenied) return;
    void loadUsers({ append: false, search: query, cursor: null });
  }, [adminAccessDenied, isAuthenticated, query]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (!adminAccessDenied) return;
    void navigate({ to: "/settings", replace: true });
  }, [adminAccessDenied, isAuthenticated, isLoading, navigate]);

  const topUsersChartData = useMemo(
    () =>
      (overview?.topUsersThisMonth ?? []).map((entry) => ({
        name: entry.username ? `@${entry.username}` : entry.name,
        chat: entry.chatCount,
        analyze: entry.analyzeCount,
      })),
    [overview]
  );

  const onSearch = () => setQuery(searchInput.trim());

  const onDraftChange = (userId: string, patch: Partial<UserDraft>) => {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch,
      },
    }));
  };

  const saveEntitlements = async (row: AdminUserRow) => {
    const draft = drafts[row.id];
    if (!draft) return;
    setSavingUserId(row.id);
    try {
      await updateAdminUserEntitlements(row.id, {
        plan: draft.plan,
        monthlyChatLimit: toInputLimit(draft.monthlyChatLimit),
        monthlyAnalyzeLimit: toInputLimit(draft.monthlyAnalyzeLimit),
        unlimitedAiChat: draft.unlimitedAiChat,
        unlimitedAiAnalyze: draft.unlimitedAiAnalyze,
      });

      setUsers((current) =>
        current.map((entry) =>
          entry.id === row.id
            ? {
                ...entry,
                plan: draft.plan,
                entitlements: {
                  monthlyChatLimit: toInputLimit(draft.monthlyChatLimit),
                  monthlyAnalyzeLimit: toInputLimit(draft.monthlyAnalyzeLimit),
                  unlimitedAiChat: draft.unlimitedAiChat,
                  unlimitedAiAnalyze: draft.unlimitedAiAnalyze,
                },
                badge:
                  draft.role === "OWNER"
                    ? "Owner"
                    : draft.role === "ADMIN"
                      ? "Admin"
                      : draft.plan === "PRO"
                        ? "Pro"
                        : null,
              }
            : entry
        )
      );
      await loadOverview(range);
    } catch (error: unknown) {
      setUsersError(error instanceof Error ? error.message : "Failed to save entitlements.");
    } finally {
      setSavingUserId(null);
    }
  };

  const saveRole = async (row: AdminUserRow) => {
    const draft = drafts[row.id];
    if (!draft || draft.role === row.role) return;
    setSavingUserId(row.id);
    try {
      await updateAdminUserRole(row.id, draft.role);
      setUsers((current) =>
        current.map((entry) =>
          entry.id === row.id
            ? {
                ...entry,
                role: draft.role,
                badge:
                  draft.role === "OWNER"
                    ? "Owner"
                    : draft.role === "ADMIN"
                      ? "Admin"
                      : entry.plan === "PRO"
                        ? "Pro"
                        : null,
              }
            : entry
        )
      );
      await loadOverview(range);
    } catch (error: unknown) {
      setUsersError(error instanceof Error ? error.message : "Failed to save role.");
    } finally {
      setSavingUserId(null);
    }
  };

  if (isLoading || (viewerLoading && !overview && !users.length && !adminAccessDenied)) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
        <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-8 w-8" />
              <SkeletonBlock className="h-5 w-40" />
            </div>
            <SkeletonBlock className="h-8 w-8 rounded-full" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <SkeletonBlock className="mb-5 h-4 w-48" />
          <div className="panel p-4 sm:p-5">
            <SkeletonBlock className="mb-4 h-5 w-32" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-20" />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SkeletonBlock className="h-72" />
              <SkeletonBlock className="h-72" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (viewerError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="panel p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          {viewerError}
        </div>
      </main>
    );
  }

  if (adminAccessDenied) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="panel p-6">
          <h1 className="font-display text-xl" style={{ color: "var(--text-primary)" }}>
            Admin access required
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Your account does not have admin privileges.
          </p>
          <AppLink href="/settings" className="btn-secondary mt-4 inline-flex items-center gap-2">
            <FiArrowLeft size={14} />
            Back to settings
          </AppLink>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <AppLink
              href="/settings"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              aria-label="Back to settings"
            >
              <FiArrowLeft size={14} />
            </AppLink>
            <h1 className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              Admin Dashboard
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <MobileSiteMenu
              items={[
                { href: "/play", label: "Launch Builder", description: "Choose a game and build" },
                { href: "/weaknesses", label: "Weakness Tool", description: "Check Pokemon weaknesses fast" },
                { href: "/type-chart", label: "Type Chart", description: "See type strengths and weaknesses" },
                { href: "/teams", label: "My Teams", description: "Open your saved teams" },
                { href: "/settings", label: "Settings", description: "Manage your account" },
                { href: "/settings/admin", label: "Admin", description: "You are here" },
              ]}
            />
            <div className="hidden min-[820px]:flex min-[820px]:items-center min-[820px]:gap-3">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Breadcrumb items={[{ label: "Slatedex", href: "/play" }, { label: "Settings", href: "/settings" }, { label: "Admin" }]} className="mb-5" />

        <section className="panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Overview
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Track user growth, AI load, and quota pressure.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as RangeKey)}
                className="rounded-lg border px-2 py-1 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="12m">Last 12 months</option>
              </select>
              <button type="button" className="btn-secondary inline-flex items-center gap-1.5" onClick={() => void loadOverview(range)} disabled={overviewLoading}>
                <FiRefreshCw size={13} className={overviewLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {overviewError && <p className="mt-3 text-sm text-red-300">{overviewError}</p>}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {KPI_META.map((kpi) => {
              const value = (overview?.kpis as Record<string, number> | undefined)?.[kpi.key] ?? 0;
              return (
                <div
                  key={kpi.key}
                  className="group relative overflow-hidden rounded-xl border p-3 transition-colors hover:border-opacity-60"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <div className="absolute -right-2 -top-2 opacity-[0.06] transition-opacity group-hover:opacity-[0.12]">
                    <span style={{ color: kpi.color, fontSize: 48 }}>{kpi.icon}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: kpi.color }}>{kpi.icon}</span>
                    <p className="text-[0.68rem] font-medium" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
                  </div>
                  <span className="mt-1 block font-display text-xl tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {overviewLoading ? <SkeletonBlock className="mt-1 h-6 w-12" /> : fmtNum(value)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>AI Usage by Day</h3>
              <div className="h-64">
                {(overview?.charts.aiUsageByDay ?? []).length === 0 && !overviewLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No usage data for this period</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(overview?.charts.aiUsageByDay ?? []).map((entry) => ({ ...entry, label: toDayLabel(entry.day) }))}>
                      <defs>
                        <linearGradient id="gradChat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#da2c43" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#da2c43" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradAnalyze" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fill: "#7f8cb0", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#7f8cb0", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                      <Area type="monotone" dataKey="chat" stroke="#da2c43" strokeWidth={2} fill="url(#gradChat)" dot={false} activeDot={{ r: 4, fill: "#da2c43", stroke: "var(--surface-2)", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="analyze" stroke="#38bdf8" strokeWidth={2} fill="url(#gradAnalyze)" dot={false} activeDot={{ r: 4, fill: "#38bdf8", stroke: "var(--surface-2)", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>User & Team Growth</h3>
              <div className="h-64">
                {(overview?.charts.newUsersByDay ?? []).length === 0 && !overviewLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No growth data for this period</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(overview?.charts.newUsersByDay ?? []).map((entry) => ({
                        label: toDayLabel(entry.day),
                        users: entry.value,
                        teams:
                          overview?.charts.newTeamsByDay.find((teamEntry) => teamEntry.day === entry.day)?.value ?? 0,
                      }))}
                    >
                      <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fill: "#7f8cb0", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#7f8cb0", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                      <Bar dataKey="users" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="teams" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Users by Plan</h3>
              <div className="h-56">
                {(overview?.charts.usersByPlan ?? []).length === 0 && !overviewLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No plan data</p>
                  </div>
                ) : (
                  <div className="flex h-full items-center gap-2">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={overview?.charts.usersByPlan ?? []} dataKey="value" nameKey="key" outerRadius={72} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                            {(overview?.charts.usersByPlan ?? []).map((entry, index) => (
                              <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 pr-1">
                      {(overview?.charts.usersByPlan ?? []).map((entry, index) => (
                        <div key={entry.key} className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{entry.key}</span>
                          <span className="ml-auto font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Users by Role</h3>
              <div className="h-56">
                {(overview?.charts.usersByRole ?? []).length === 0 && !overviewLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No role data</p>
                  </div>
                ) : (
                  <div className="flex h-full items-center gap-2">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={overview?.charts.usersByRole ?? []} dataKey="value" nameKey="key" outerRadius={72} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                            {(overview?.charts.usersByRole ?? []).map((entry, index) => (
                              <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 pr-1">
                      {(overview?.charts.usersByRole ?? []).map((entry, index) => (
                        <div key={entry.key} className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{entry.key}</span>
                          <span className="ml-auto font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Top AI Users (Month)</h3>
              <div className="h-56">
                {topUsersChartData.length === 0 && !overviewLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No usage this month</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topUsersChartData} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#7f8cb0", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#7f8cb0", fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                      <Bar dataKey="chat" fill="#da2c43" radius={[0, 4, 4, 0]} barSize={12} />
                      <Bar dataKey="analyze" fill="#1d87e4" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>
          </div>
        </section>

        <section className="panel mt-5 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                User Management
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Change plan, monthly limits, unlimited AI access, and roles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border px-3 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <FiSearch size={13} style={{ color: "var(--text-muted)" }} />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSearch();
                  }}
                  placeholder="Search users..."
                  className="w-44 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(""); setQuery(""); }}
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="button" className="btn-secondary" onClick={onSearch}>
                Search
              </button>
            </div>
          </div>

          {usersError && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border p-2.5 text-sm" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}>
              <FiAlertCircle size={14} />
              {usersError}
            </div>
          )}

          <div className="space-y-3">
            {users.map((row) => {
              const draft = drafts[row.id] ?? {
                plan: row.plan,
                monthlyChatLimit: row.entitlements.monthlyChatLimit,
                monthlyAnalyzeLimit: row.entitlements.monthlyAnalyzeLimit,
                unlimitedAiChat: row.entitlements.unlimitedAiChat,
                unlimitedAiAnalyze: row.entitlements.unlimitedAiAnalyze,
                role: row.role,
              };
              const isSaving = savingUserId === row.id;
              const badgeStyle = badgeStyles(row.badge);
              const chatPct = row.usage.chat.limit ? Math.min(100, Math.round((row.usage.chat.used / row.usage.chat.limit) * 100)) : 0;
              const analyzePct = row.usage.analyze.limit ? Math.min(100, Math.round((row.usage.analyze.used / row.usage.analyze.limit) * 100)) : 0;

              return (
                <article
                  key={row.id}
                  className="rounded-2xl border p-4 transition-colors"
                  style={{
                    borderColor: isSaving ? "var(--border-active)" : "var(--border)",
                    background: "var(--surface-2)",
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {/* Row 1: Identity + badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      {(row.name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{row.name}</p>
                        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[0.64rem] font-semibold" style={badgeStyle}>
                          {row.badge ?? "Member"}
                        </span>
                      </div>
                      <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                        {row.email}{row.username ? ` · @${row.username}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Usage bars */}
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>Teams: <strong style={{ color: "var(--text-primary)" }}>{row.teamCount}</strong></span>
                    </div>
                    <div className="text-xs">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span style={{ color: "var(--text-muted)" }}>Chat</span>
                        <span style={{ color: chatPct >= 90 ? "#fbbf24" : "var(--text-secondary)" }}>
                          {row.usage.chat.used}/{row.usage.chat.limit ?? "Unlimited"}
                        </span>
                      </div>
                      {row.usage.chat.limit != null && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--stat-track)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${chatPct}%`, background: chatPct >= 90 ? "#fbbf24" : "#da2c43" }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span style={{ color: "var(--text-muted)" }}>Analyze</span>
                        <span style={{ color: analyzePct >= 90 ? "#fbbf24" : "var(--text-secondary)" }}>
                          {row.usage.analyze.used}/{row.usage.analyze.limit ?? "Unlimited"}
                        </span>
                      </div>
                      {row.usage.analyze.limit != null && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--stat-track)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${analyzePct}%`, background: analyzePct >= 90 ? "#fbbf24" : "#38bdf8" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Controls */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <select
                      value={draft.plan}
                      onChange={(event) => onDraftChange(row.id, { plan: event.target.value as UserPlanValue })}
                      className="rounded-lg border px-2 py-1 text-xs"
                      style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                    </select>

                    <label className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <FiZap size={11} />
                      Chat
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        value={draft.monthlyChatLimit}
                        onChange={(event) => onDraftChange(row.id, { monthlyChatLimit: toInputLimit(Number(event.target.value)) })}
                        className="w-16 rounded-lg border px-1.5 py-1 text-xs tabular-nums"
                        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
                      />
                    </label>

                    <label className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <FiShield size={11} />
                      Analyze
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        value={draft.monthlyAnalyzeLimit}
                        onChange={(event) => onDraftChange(row.id, { monthlyAnalyzeLimit: toInputLimit(Number(event.target.value)) })}
                        className="w-16 rounded-lg border px-1.5 py-1 text-xs tabular-nums"
                        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
                      />
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span
                        role="switch"
                        aria-checked={draft.unlimitedAiChat}
                        tabIndex={0}
                        className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                        style={{ background: draft.unlimitedAiChat ? "#da2c43" : "var(--surface-4)" }}
                        onClick={() => onDraftChange(row.id, { unlimitedAiChat: !draft.unlimitedAiChat })}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDraftChange(row.id, { unlimitedAiChat: !draft.unlimitedAiChat }); } }}
                      >
                        <span
                          className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                          style={{ transform: draft.unlimitedAiChat ? "translateX(13px)" : "translateX(2px)" }}
                        />
                      </span>
                      Unlimited Chat
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span
                        role="switch"
                        aria-checked={draft.unlimitedAiAnalyze}
                        tabIndex={0}
                        className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                        style={{ background: draft.unlimitedAiAnalyze ? "#38bdf8" : "var(--surface-4)" }}
                        onClick={() => onDraftChange(row.id, { unlimitedAiAnalyze: !draft.unlimitedAiAnalyze })}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDraftChange(row.id, { unlimitedAiAnalyze: !draft.unlimitedAiAnalyze }); } }}
                      >
                        <span
                          className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                          style={{ transform: draft.unlimitedAiAnalyze ? "translateX(13px)" : "translateX(2px)" }}
                        />
                      </span>
                      Unlimited Analyze
                    </label>

                    <button type="button" className="btn-secondary ml-auto inline-flex items-center gap-1.5 text-xs" onClick={() => void saveEntitlements(row)} disabled={isSaving}>
                      <FiSave size={12} />
                      Save
                    </button>
                  </div>

                  {/* Row 4: Role */}
                  <div className="mt-2 flex items-center gap-2">
                    <FiUsers size={12} style={{ color: "var(--text-muted)" }} />
                    <select
                      value={draft.role}
                      onChange={(event) => onDraftChange(row.id, { role: event.target.value as UserRoleValue })}
                      className="rounded-lg border px-2 py-1 text-xs"
                      style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      {viewer?.role === "OWNER" && <option value="OWNER">OWNER</option>}
                    </select>
                    <button
                      type="button"
                      className="btn-secondary inline-flex items-center gap-1.5 text-xs"
                      onClick={() => void saveRole(row)}
                      disabled={isSaving || viewer?.role !== "OWNER"}
                      title={viewer?.role === "OWNER" ? "Save role" : "Only owners can change roles"}
                    >
                      <FiUser size={12} />
                      Save Role
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {usersLoading && (
            <div className="mt-3 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          )}

          {nextCursor && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void loadUsers({ append: true, cursor: nextCursor, search: query })}
                disabled={usersLoading}
              >
                Load More
              </button>
            </div>
          )}

          {!usersLoading && users.length === 0 && (
            <div className="mt-6 flex flex-col items-center gap-2 py-8">
              <FiUsers size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {query ? `No users found for "${query}"` : "No users loaded"}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
