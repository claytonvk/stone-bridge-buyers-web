import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { supabase } from "../../lib/supabaseClient.js";

const PRESETS = [
  { key: "7d", label: "7d", days: 7, unit: "day" },
  { key: "30d", label: "30d", days: 30, unit: "day" },
  { key: "90d", label: "90d", days: 90, unit: "day" },
];

export default function Analytics() {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID

  const [timezone, setTimezone] = useState("Pacific/Honolulu");
  const [preset, setPreset] = useState("30d");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  const range = useMemo(() => {
    const p = PRESETS.find((x) => x.key === preset) || PRESETS[1];
    const endAt = Date.now();
    const startAt = endAt - p.days * 24 * 60 * 60 * 1000;
    return { startAt, endAt, unit: p.unit, days: p.days };
  }, [preset]);

  async function load() {
    setErr("");
    if (!websiteId) {
      setErr("Missing websiteId. Set VITE_UMAMI_WEBSITE_ID or paste it here.");
      return;
    }

    setLoading(true);
    try {
      const adminSecret = import.meta.env.VITE_ADMIN_SECRET || "";
      const headers = adminSecret ? { "x-admin-secret": adminSecret } : undefined;

      const res = await supabase.functions.invoke("site-analytics", {
        body: {
          websiteId,
          startAt: range.startAt,
          endAt: range.endAt,
          unit: range.unit,
          timezone,
        },
        headers,
      });

      // Supabase returns: { data, error }
      const { data: raw, error } = res || {};
      if (error) throw error;
      if (raw?.error) throw new Error(raw.error);

      // Normalize payload (handles minor shape drift)
      const normalized = normalizeAnalyticsPayload(raw);

      setData(normalized);
      setLastLoadedAt(Date.now());
    } catch (e) {
      setErr(e?.message || "Failed to load analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, timezone]);

  const stats = data?.stats || {};
  const active = data?.active?.visitors ?? null;

  const visits = num(stats.visits);
  const bounces = num(stats.bounces);
  const totaltime = num(stats.totaltime);

  const bounceRate = visits > 0 ? (bounces / visits) * 100 : null;
  const avgSession = visits > 0 ? totaltime / visits : null;

  const pageSeries = Array.isArray(data?.series?.pageviews) ? data.series.pageviews : [];
  const sessionSeries = Array.isArray(data?.series?.sessions) ? data.series.sessions : [];

  const debugShape = data
    ? `keys: ${Object.keys(data).join(", ")} | stats: ${Object.keys(stats).join(", ")}`
    : "—";

  return (
    <Wrap>
      <Header>
        <HeaderContent>
          <TitleSection>
            <MainTitle>
              <TitleIcon>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </TitleIcon>
              Analytics Dashboard
            </MainTitle>
            {lastLoadedAt
              ?
                <Subtitle>
                  Last updated {fmtTimeAgo(lastLoadedAt)}
                </Subtitle>
              :
                null
            }
            <DebugLine title="This helps confirm what the Edge Function returned">{debugShape}</DebugLine>
          </TitleSection>

          <Controls>
            {/* <ControlGroup>
              <Label>Website ID</Label>
              <InputWrapper>
                <Input
                  value={websiteId}
                  onChange={(e) => setWebsiteId(e.target.value)}
                  placeholder="Enter Website ID"
                  spellCheck={false}
                />
              </InputWrapper>
            </ControlGroup> */}

            <ControlGroup>
              <Label>Time Range</Label>
              <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
                {PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    Last {p.label}
                  </option>
                ))}
              </Select>
            </ControlGroup>

            <ControlGroup>
              <Label>Timezone</Label>
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Pacific/Honolulu">Pacific/Honolulu</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/New_York">America/New_York</option>
                <option value="UTC">UTC</option>
              </Select>
            </ControlGroup>

            <RefreshBtn onClick={load} disabled={loading}>
              <BtnIcon className={loading ? "spin" : ""}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              </BtnIcon>
              {loading ? "Refreshing..." : "Refresh"}
            </RefreshBtn>
          </Controls>
        </HeaderContent>
      </Header>

      {!!err && (
        <ErrorCard>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>{err}</ErrorText>
        </ErrorCard>
      )}

      <MetricsGrid>
        <MetricCard>
          <MetricHeader>
            <MetricIcon style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </MetricIcon>
            <MetricLabel>Active Users</MetricLabel>
          </MetricHeader>
          <MetricValue>{active === null ? "—" : fmtInt(active)}</MetricValue>
          <MetricFooter>
            <LiveIndicator>
              <LiveDot />
              Live • Last 5 minutes
            </LiveIndicator>
          </MetricFooter>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricIcon style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </MetricIcon>
            <MetricLabel>Pageviews</MetricLabel>
          </MetricHeader>
          <MetricValue>{fmtInt(num(stats.pageviews))}</MetricValue>
          <MetricFooter>
            <MetricHint>Last {range.days} days</MetricHint>
          </MetricFooter>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricIcon style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </MetricIcon>
            <MetricLabel>Unique Visitors</MetricLabel>
          </MetricHeader>
          <MetricValue>{fmtInt(num(stats.visitors))}</MetricValue>
          <MetricFooter>
            <MetricHint>Unique users</MetricHint>
          </MetricFooter>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricIcon style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </MetricIcon>
            <MetricLabel>Total Sessions</MetricLabel>
          </MetricHeader>
          <MetricValue>{fmtInt(visits)}</MetricValue>
          <MetricFooter>
            <MetricHint>Sessions</MetricHint>
          </MetricFooter>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricIcon style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </MetricIcon>
            <MetricLabel>Bounce Rate</MetricLabel>
          </MetricHeader>
          <MetricValue>{bounceRate === null ? "—" : `${bounceRate.toFixed(1)}%`}</MetricValue>
          <MetricFooter>
            <MetricHint>Lower is better</MetricHint>
          </MetricFooter>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricIcon style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </MetricIcon>
            <MetricLabel>Avg. Session Duration</MetricLabel>
          </MetricHeader>
          <MetricValue>{avgSession === null ? "—" : fmtSeconds(avgSession)}</MetricValue>
          <MetricFooter>
            <MetricHint>Time on site</MetricHint>
          </MetricFooter>
        </MetricCard>
      </MetricsGrid>

      <ChartsGrid>
        <ChartPanel>
          <PanelHeader>
            <PanelTitleRow>
              <PanelTitle>Pageviews Over Time</PanelTitle>
              <PanelBadge>{pageSeries.length} points</PanelBadge>
            </PanelTitleRow>
            <PanelSubtitle>Trend for the selected period</PanelSubtitle>
          </PanelHeader>
          <ChartBody>
            <SparkBars data={pageSeries} color="#7da8c1" />
          </ChartBody>
        </ChartPanel>

        <ChartPanel>
          <PanelHeader>
            <PanelTitleRow>
              <PanelTitle>Session Activity</PanelTitle>
              <PanelBadge>{sessionSeries.length} points</PanelBadge>
            </PanelTitleRow>
            <PanelSubtitle>Trend for the selected period</PanelSubtitle>
          </PanelHeader>
          <ChartBody>
            <SparkBars data={sessionSeries} color="#8b5cf6" />
          </ChartBody>
        </ChartPanel>
      </ChartsGrid>

      <DataGrid>
        <DataPanel>
          <PanelHeader>
            <PanelTitleRow>
              <PanelIconTitle>
                <PanelIconCircle style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </PanelIconCircle>
                <PanelTitle>Top Pages</PanelTitle>
              </PanelIconTitle>
              <PanelBadge>{Array.isArray(data?.topPages) ? data.topPages.length : 0} items</PanelBadge>
            </PanelTitleRow>
          </PanelHeader>
          <RankList items={data?.topPages} valueLabel="Visitors" />
        </DataPanel>

        <DataPanel>
          <PanelHeader>
            <PanelTitleRow>
              <PanelIconTitle>
                <PanelIconCircle style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </PanelIconCircle>
                <PanelTitle>Top Referrers</PanelTitle>
              </PanelIconTitle>
              <PanelBadge>{Array.isArray(data?.topReferrers) ? data.topReferrers.length : 0} items</PanelBadge>
            </PanelTitleRow>
          </PanelHeader>
          <RankList items={data?.topReferrers} valueLabel="Visitors" />
        </DataPanel>

        <DataPanel>
          <PanelHeader>
            <PanelTitleRow>
              <PanelIconTitle>
                <PanelIconCircle style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </PanelIconCircle>
                <PanelTitle>Top Countries</PanelTitle>
              </PanelIconTitle>
              <PanelBadge>{Array.isArray(data?.topCountries) ? data.topCountries.length : 0} items</PanelBadge>
            </PanelTitleRow>
          </PanelHeader>
          <RankList items={data?.topCountries} valueLabel="Visitors" />
        </DataPanel>

        <DataPanel>
          <PanelHeader>
            <PanelTitleRow>
              <PanelIconTitle>
                <PanelIconCircle style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </PanelIconCircle>
                <PanelTitle>Devices</PanelTitle>
              </PanelIconTitle>
              <PanelBadge>{Array.isArray(data?.topDevices) ? data.topDevices.length : 0} items</PanelBadge>
            </PanelTitleRow>
          </PanelHeader>
          <RankList items={data?.topDevices} valueLabel="Visitors" />
        </DataPanel>

        <DataPanel>
          <PanelHeader>
            <PanelTitleRow>
              <PanelIconTitle>
                <PanelIconCircle style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </PanelIconCircle>
                <PanelTitle>Browsers</PanelTitle>
              </PanelIconTitle>
              <PanelBadge>{Array.isArray(data?.topBrowsers) ? data.topBrowsers.length : 0} items</PanelBadge>
            </PanelTitleRow>
          </PanelHeader>
          <RankList items={data?.topBrowsers} valueLabel="Visitors" />
        </DataPanel>
      </DataGrid>
    </Wrap>
  );
}

/**
 * Normalizes common payload variations so the UI works even if your Edge Function
 * returns slightly different keys.
 */
function normalizeAnalyticsPayload(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const statsIn = raw.stats || raw.Stats || {};
  const seriesIn = raw.series || raw.Series || {};

  // Some Umami endpoints call these differently; we normalize into:
  // stats: { pageviews, visitors, visits, bounces, totaltime }
  const stats = {
    pageviews: num(statsIn.pageviews ?? statsIn.views ?? statsIn.pageViews),
    visitors: num(statsIn.visitors ?? statsIn.uniqueVisitors ?? statsIn.uniques),
    visits: num(statsIn.visits ?? statsIn.sessions ?? statsIn.sessionCount),
    bounces: num(statsIn.bounces ?? statsIn.bounce ?? statsIn.bounceCount),
    totaltime: num(statsIn.totaltime ?? statsIn.totalTime ?? statsIn.totalseconds),
  };

  // series: { pageviews: [{x,y}], sessions: [{x,y}] }
  const series = {
    pageviews: normalizeXYSeries(seriesIn.pageviews ?? seriesIn.pageViews ?? seriesIn.views),
    sessions: normalizeXYSeries(seriesIn.sessions ?? seriesIn.visits ?? seriesIn.session),
  };

  // top lists often vary naming
  const topPages = normalizeTopList(raw.topPages ?? raw.top_pages ?? raw.pages ?? raw.topPageviews);
  const topReferrers = normalizeTopList(raw.topReferrers ?? raw.top_referrers ?? raw.referrers);
  const topCountries = normalizeTopList(raw.topCountries ?? raw.top_countries ?? raw.countries);
  const topDevices = normalizeTopList(raw.topDevices ?? raw.top_devices ?? raw.devices);
  const topBrowsers = normalizeTopList(raw.topBrowsers ?? raw.top_browsers ?? raw.browsers);

  return {
    ...raw,
    stats,
    series,
    topPages,
    topReferrers,
    topCountries,
    topDevices,
    topBrowsers,
  };
}

function normalizeXYSeries(series) {
  const arr = Array.isArray(series) ? series : [];
  return arr
    .map((d) => {
      if (!d) return null;
      const x = d.x ?? d.t ?? d.date ?? d.time ?? "";
      const y = d.y ?? d.value ?? d.count ?? 0;
      return { x, y: num(y) };
    })
    .filter(Boolean);
}

function normalizeTopList(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .map((d) => {
      if (!d) return null;
      // Standardize into { x, y }
      const x = d.x ?? d.name ?? d.value ?? d.label ?? d.url ?? d.referrer ?? d.country ?? d.device ?? d.browser ?? "";
      const y = d.y ?? d.count ?? d.visitors ?? d.value ?? 0;
      return { x: clean(x) || "—", y: num(y) };
    })
    .filter(Boolean);
}

function SparkBars({ data, color = "#7da8c1" }) {
  const ys = Array.isArray(data) ? data.map((d) => num(d?.y)) : [];
  const max = ys.length ? Math.max(...ys, 1) : 1;

  return (
    <BarsContainer>
      {Array.isArray(data) &&
        data.map((d, i) => {
          const y = num(d?.y);
          const h = Math.max(2, Math.round((y / max) * 100));
          const label = d?.x ? String(d.x) : d?.t ? String(d.t) : "";
          return (
            <BarWrapper key={`${label}-${i}`}>
              <Bar title={`${label} • ${y}`} style={{ height: `${h}%`, background: color }} />
            </BarWrapper>
          );
        })}
    </BarsContainer>
  );
}

function RankList({ items, valueLabel }) {
  const arr = Array.isArray(items) ? items : [];
  const max = arr.length ? Math.max(...arr.map((x) => num(x?.y)), 1) : 1;

  return (
    <ListContainer>
      {arr.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyText>No data available</EmptyText>
        </EmptyState>
      ) : (
        arr.map((x, i) => {
          const name = clean(x?.x) || "—";
          const y = num(x?.y);
          const pct = Math.max(2, Math.round((y / max) * 100));
          return (
            <ListRow key={`${name}-${i}`}>
              <RowRank>{i + 1}</RowRank>
              <RowContent>
                <RowName title={name}>{name}</RowName>
                <ProgressTrack>
                  <ProgressBar style={{ width: `${pct}%` }} />
                </ProgressTrack>
              </RowContent>
              <RowValue title={`${valueLabel}: ${y}`}>{fmtInt(y)}</RowValue>
            </ListRow>
          );
        })
      )}
    </ListContainer>
  );
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clean(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function fmtInt(n) {
  return Number(n || 0).toLocaleString();
}
function fmtSeconds(s) {
  const sec = Math.max(0, Math.round(Number(s) || 0));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${r}s`;
}
function fmtTimeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.round(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

/** ------------------ styles (yours, with fixes) ------------------ */

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div`
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  border: 1px solid rgba(47, 47, 50, 0.08);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);

  @media (max-width: 1024px) {
    padding: 24px;
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const MainTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const TitleIcon = styled.div`
  color: #7da8c1;
`;

const Subtitle = styled.div`
  margin-top: 8px;
  color: rgba(47, 47, 50, 0.65);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.01em;
`;

const SmallMuted = styled.span`
  margin-left: 8px;
  font-weight: 700;
  color: rgba(47, 47, 50, 0.5);
`;

const DebugLine = styled.div`
  margin-top: 10px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(47, 47, 50, 0.45);
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;

  @media (max-width: 640px) {
    min-width: 0;
    flex: 1;
  }
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: rgba(47, 47, 50, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(47, 47, 50, 0.12);
  background: rgba(255, 255, 255, 0.98);
  font-weight: 600;
  color: #2f2f32;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #7da8c1;
    box-shadow: 0 0 0 3px rgba(125, 168, 193, 0.1);
  }

  &::placeholder {
    color: rgba(47, 47, 50, 0.4);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(47, 47, 50, 0.12);
  background: rgba(255, 255, 255, 0.98);
  font-weight: 600;
  color: #2f2f32;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #7da8c1;
    box-shadow: 0 0 0 3px rgba(125, 168, 193, 0.1);
  }

  &:hover {
    border-color: rgba(47, 47, 50, 0.2);
  }
`;

const RefreshBtn = styled.button`
  border: 0;
  cursor: pointer;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  color: white;
  background: linear-gradient(135deg, #7da8c1 0%, #6b94ad 100%);
  box-shadow: 0 2px 8px rgba(125, 168, 193, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(125, 168, 193, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BtnIcon = styled.div`
  display: flex;
  align-items: center;

  &.spin {
    animation: ${spin} 1s linear infinite;
  }
`;

const ErrorCard = styled.div`
  margin-bottom: 24px;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1.5px solid rgba(239, 68, 68, 0.2);
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(254, 226, 226, 0.95) 100%);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.3s ease;
`;

const ErrorIcon = styled.div`
  font-size: 20px;
`;

const ErrorText = styled.div`
  color: #991b1b;
  font-weight: 700;
  font-size: 14px;
  flex: 1;
`;

const MetricsGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-bottom: 24px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(47, 47, 50, 0.08);
  border-radius: 20px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  animation: ${fadeIn} 0.4s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
    border-color: rgba(47, 47, 50, 0.12);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
`;

const MetricLabel = styled.div`
  font-weight: 700;
  font-size: 13px;
  color: rgba(47, 47, 50, 0.65);
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const MetricValue = styled.div`
  font-weight: 900;
  font-size: 36px;
  color: #1e293b;
  line-height: 1.2;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
`;

const MetricFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(47, 47, 50, 0.55);
`;

const LiveDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const MetricHint = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: rgba(47, 47, 50, 0.45);
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const ChartPanel = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(47, 47, 50, 0.08);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease;

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  }
`;

const PanelHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1.5px solid rgba(47, 47, 50, 0.06);
`;

const PanelTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
`;

const PanelIconTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PanelIconCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
`;

const PanelTitle = styled.div`
  font-weight: 800;
  font-size: 16px;
  color: #1e293b;
`;

const PanelSubtitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: rgba(47, 47, 50, 0.5);
`;

const PanelBadge = styled.div`
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(125, 168, 193, 0.1);
  color: #6b94ad;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const ChartBody = styled.div`
  padding: 24px;
`;

const BarsContainer = styled.div`
  height: 180px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 6px;
  align-items: end;
`;

const BarWrapper = styled.div`
  height: 100%;
  display: flex;
  align-items: flex-end;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const Bar = styled.div`
  width: 100%;
  border-radius: 6px 6px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 -2px 8px rgba(125, 168, 193, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const DataPanel = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(47, 47, 50, 0.08);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.6s ease;

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  }
`;

const ListContainer = styled.div`
  padding: 20px 24px;
  max-height: 400px;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-weight: 600;
  color: rgba(47, 47, 50, 0.5);
  font-size: 14px;
`;

const ListRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(47, 47, 50, 0.04);
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(125, 168, 193, 0.03);
    margin: 0 -12px;
    padding: 12px 12px;
    border-radius: 10px;
  }
`;

const RowRank = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(125, 168, 193, 0.15) 0%, rgba(125, 168, 193, 0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 13px;
  color: #6b94ad;
  flex-shrink: 0;
`;

const RowContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowName = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
`;

const ProgressTrack = styled.div`
  height: 6px;
  border-radius: 999px;
  background: rgba(125, 168, 193, 0.1);
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7da8c1 0%, #6b94ad 100%);
  transition: width 0.5s ease;
  box-shadow: 0 0 8px rgba(125, 168, 193, 0.25);
`;

const RowValue = styled.div`
  min-width: 70px;
  text-align: right;
  font-weight: 800;
  font-size: 15px;
  color: #1e293b;
  flex-shrink: 0;
`;
