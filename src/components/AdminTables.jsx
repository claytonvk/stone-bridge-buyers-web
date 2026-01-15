import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../auth/useAuth";

const TABLES = [
  {
    key: "quote_form_submissions",
    label: "Quote Form Submissions",
    columns: [
      { key: "id", label: "ID", readOnly: true },
      { key: "created_at", label: "Created", readOnly: true },
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "raw_address", label: "Address" },
      { key: "street_address", label: "Street" },
      { key: "unit", label: "Unit" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zipcode", label: "Zipcode" },
      { key: "sms_subscription", label: "SMS", type: "boolean", readOnly: true },
      { key: "consent_marketing", label: "Marketing", type: "boolean", readOnly: true },
    ],
    orderBy: { column: "created_at", ascending: false },
    primaryKey: "id",
  },
  {
    key: "help_agent_submissions",
    label: "Help Agent Submissions",
    columns: [
      { key: "id", label: "ID", readOnly: true },
      { key: "created_at", label: "Created", readOnly: true },
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "message", label: "Message", type: "text" },
    ],
    orderBy: { column: "created_at", ascending: false },
    primaryKey: "id",
  },
];

export default function AdminTables({ title = "Admin" }) {
  const { ready, session } = useAuth();

  const [activeTableKey, setActiveTableKey] = useState(TABLES[0].key);
  const activeTable = useMemo(
    () => TABLES.find((t) => t.key === activeTableKey) || TABLES[0],
    [activeTableKey]
  );

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [view, setView] = useState("table"); // table | cards | compact

  const [editingRowId, setEditingRowId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ sorting state
  const [sort, setSort] = useState(() => ({
    key: TABLES[0].orderBy.column,
    ascending: TABLES[0].orderBy.ascending,
  }));

  // ✅ per-table column widths (resizing)
  const [colWidths, setColWidths] = useState({}); // { [tableKey]: { [colKey]: number } }

  const loadAttemptedRef = useRef(false);

  const makeClient = useCallback(() => {
    return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      },
    });
  }, [session]);

  // ✅ start resize helper
  const startResize = useCallback(
    (tableKey, colKey, startX) => {
      const startWidth = colWidths?.[tableKey]?.[colKey] ?? 160;

      const onMove = (e) => {
        const next = Math.max(80, startWidth + (e.clientX - startX));
        setColWidths((p) => ({
          ...p,
          [tableKey]: { ...(p[tableKey] || {}), [colKey]: next },
        }));
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [colWidths]
  );

  const load = useCallback(async () => {
    if (!session) {
      setStatus("error");
      setError("Not signed in.");
      return;
    }

    setError("");
    setStatus("loading");

    try {
      const client = makeClient();
      const selectCols = activeTable.columns.map((c) => c.key).join(", ");

      const { data, error } = await client
        .from(activeTable.key)
        .select(selectCols)
        .order(activeTable.orderBy.column, { ascending: activeTable.orderBy.ascending });

      if (error) throw error;

      setRows(data || []);
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e?.message || "Failed to load rows.");
    }
  }, [session, makeClient, activeTable]);

  useEffect(() => {
    if (!ready || !session || loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;
    load();
  }, [ready, session, load]);

  useEffect(() => {
    if (!ready || !session) return;

    // reset edit state and reload
    setEditingRowId(null);
    setDraft({});
    setStatus("idle");
    setError("");

    // reset sort for new table
    setSort({
      key: activeTable.orderBy.column,
      ascending: activeTable.orderBy.ascending,
    });

    load();
  }, [activeTableKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const saved = localStorage.getItem('admin-col-widths');
    if (saved) {
      try {
        setColWidths(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved column widths:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-col-widths', JSON.stringify(colWidths));
  }, [colWidths]);

  const handleRefresh = () => {
    if (session) load();
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const base = !needle
      ? rows
      : rows.filter((r) => {
          const hay = activeTable.columns
            .map((c) => r?.[c.key])
            .filter((v) => v !== null && v !== undefined)
            .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
            .join(" ")
            .toLowerCase();

          return hay.includes(needle);
        });

    const { key, ascending } = sort || {};
    if (!key) return base;

    const col = activeTable.columns.find((c) => c.key === key);

    const toComparable = (v) => {
      if (v === null || v === undefined) return null;
      if (col?.type === "boolean") return v ? 1 : 0;
      if (typeof v === "number") return v;
      const s = String(v);
      const t = Date.parse(s);
      if (!Number.isNaN(t) && (key === "created_at" || s.includes("T"))) return t;
      return s.toLowerCase();
    };

    const sorted = [...base].sort((a, b) => {
      const av = toComparable(a?.[key]);
      const bv = toComparable(b?.[key]);

      if (av === bv) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;

      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });

    return ascending ? sorted : sorted.reverse();
  }, [rows, q, activeTable, sort]);

  const startEdit = (row) => {
    setEditingRowId(row[activeTable.primaryKey]);
    const nextDraft = {};
    activeTable.columns.forEach((c) => {
      if (c.readOnly) return;
      nextDraft[c.key] = row?.[c.key] ?? (c.type === "boolean" ? false : "");
    });
    setDraft(nextDraft);
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setDraft({});
  };

  const setDraftValue = (key, value) => {
    setDraft((p) => ({ ...p, [key]: value }));
  };

  const saveEdit = async (row) => {
    if (!session) return;

    const rowIdRaw = row?.[activeTable.primaryKey];
    if (rowIdRaw === undefined || rowIdRaw === null) return;

    const rowId =
      typeof rowIdRaw === "number"
        ? rowIdRaw
        : /^\d+$/.test(String(rowIdRaw))
        ? Number(rowIdRaw)
        : String(rowIdRaw);

    setSaving(true);
    setError("");

    try {
      const client = makeClient();

      const updatePayload = {};
      activeTable.columns.forEach((c) => {
        if (c.readOnly) return;
        if (!(c.key in draft)) return;

        const v = draft[c.key];
        if (c.type === "boolean") updatePayload[c.key] = !!v;
        else updatePayload[c.key] = v === "" ? null : v;
      });

      if (Object.keys(updatePayload).length === 0) {
        setError("No changes to save.");
        return;
      }

      const { data, error } = await client
        .from(activeTable.key)
        .update(updatePayload)
        .eq(activeTable.primaryKey, rowId)
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Update affected 0 rows. Either RLS blocked it, or the row id / primary key is not matching."
        );
      }

      setRows((prev) =>
        prev.map((r) =>
          String(r[activeTable.primaryKey]) === String(rowId) ? { ...r, ...data } : r
        )
      );

      setEditingRowId(null);
      setDraft({});
    } catch (e) {
      setError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row) => {
    if (!session) return;
    const rowId = row[activeTable.primaryKey];
    if (rowId === undefined || rowId === null) return;

    setDeletingId(rowId);
    setError("");

    try {
      const client = makeClient();
      const { error } = await client.from(activeTable.key).delete().eq(activeTable.primaryKey, rowId);

      if (error) throw error;

      setRows((prev) => prev.filter((r) => String(r[activeTable.primaryKey]) !== String(rowId)));
    } catch (e) {
      setError(e?.message || "Failed to delete row.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!ready) {
    return (
      <Page>
        <TopBar>
          <Left>
            <H1>{title}</H1>
            <Meta>Loading...</Meta>
          </Left>
        </TopBar>
        <CardsGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </CardsGrid>
      </Page>
    );
  }

  if (!session) {
    return (
      <Page>
        <TopBar>
          <Left>
            <H1>{title}</H1>
          </Left>
        </TopBar>
        <ErrorCard>
          <strong>Not signed in.</strong>
          <div style={{ marginTop: 6, opacity: 0.85 }}>Please sign in to view admin data.</div>
        </ErrorCard>
      </Page>
    );
  }

  return (
    <Page>
      <TopBar>
        <Left>
          <H1>{title}</H1>
          <Meta>{status === "ready" ? `${filtered.length} shown • ${rows.length} total` : " "}</Meta>
        </Left>

        <Right>
          <SelectTable
            value={activeTableKey}
            onChange={(e) => setActiveTableKey(e.target.value)}
            aria-label="Select table"
          >
            {TABLES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </SelectTable>

          <Search value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />

          <Segmented role="tablist" aria-label="View mode">
            <SegBtn type="button" $active={view === "table"} onClick={() => setView("table")}>
              Table
            </SegBtn>
            <SegBtn type="button" $active={view === "cards"} onClick={() => setView("cards")}>
              Cards
            </SegBtn>
            <SegBtn type="button" $active={view === "compact"} onClick={() => setView("compact")}>
              Compact
            </SegBtn>
          </Segmented>

          <Btn onClick={handleRefresh} disabled={status === "loading" || saving}>
            {status === "loading" ? "Refreshing…" : "Refresh"}
          </Btn>
        </Right>
      </TopBar>

      {status === "error" && (
        <ErrorCard>
          <strong>Couldn't load data.</strong>
          <div style={{ marginTop: 6, opacity: 0.85 }}>{error}</div>
          <div style={{ marginTop: 12 }}>
            <Btn onClick={handleRefresh}>Try again</Btn>
          </div>
        </ErrorCard>
      )}

      {!!error && status !== "error" && (
        <ErrorCard style={{ marginBottom: 14 }}>
          <strong>Action failed.</strong>
          <div style={{ marginTop: 6, opacity: 0.85 }}>{error}</div>
        </ErrorCard>
      )}

      {status === "loading" || status === "idle" ? (
        view === "table" ? (
          <TableWrap>
            <TableSkeleton />
          </TableWrap>
        ) : (
          <CardsGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </CardsGrid>
        )
      ) : status === "ready" && filtered.length === 0 ? (
        <Empty>
          <strong>No rows found.</strong>
          <div style={{ marginTop: 6, opacity: 0.8 }}>
            {q.trim() ? "Try a different search." : "New submissions will appear here."}
          </div>
        </Empty>
      ) : view === "table" ? (
        <TableView
          table={activeTable}
          rows={filtered}
          editingRowId={editingRowId}
          draft={draft}
          saving={saving}
          deletingId={deletingId}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSetDraftValue={setDraftValue}
          onSave={saveEdit}
          onDelete={deleteRow}
          sort={sort}
          setSort={setSort}
          colWidths={colWidths}
          startResize={startResize}
        />
      ) : view === "compact" ? (
        <CompactView
          table={activeTable}
          rows={filtered}
          editingRowId={editingRowId}
          draft={draft}
          saving={saving}
          deletingId={deletingId}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSetDraftValue={setDraftValue}
          onSave={saveEdit}
          onDelete={deleteRow}
        />
      ) : (
        <CardsView
          table={activeTable}
          rows={filtered}
          editingRowId={editingRowId}
          draft={draft}
          saving={saving}
          deletingId={deletingId}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSetDraftValue={setDraftValue}
          onSave={saveEdit}
          onDelete={deleteRow}
        />
      )}
    </Page>
  );
}

/* ---------------------------
   ✅ Consolidated TableView
   - Sortable headers
   - Resizable columns
--------------------------- */

function TableView({
  table,
  rows,
  editingRowId,
  draft,
  saving,
  deletingId,
  onStartEdit,
  onCancelEdit,
  onSetDraftValue,
  onSave,
  onDelete,
  sort,
  setSort,
  colWidths,
  startResize,
}) {
  const pk = table.primaryKey;

  const getWidth = (colKey) => {
    if (colWidths?.[table.key]?.[colKey]) {
      return colWidths[table.key][colKey];
    }
    
    return 'auto';
  };
  const sortKey = sort?.key;
  const sortAsc = !!sort?.ascending;

  const toggleSort = (colKey) => {
    setSort((prev) => {
      const isSame = prev?.key === colKey;
      return { key: colKey, ascending: isSame ? !prev.ascending : true };
    });
  };

  return (
    <TableWrap>
      <Table>
        <colgroup>
          {table.columns.map((c) => {
            const width = getWidth(c.key);
            return (
              <col 
                key={c.key} 
                style={width === 'auto' ? {} : { width }} 
              />
            );
          })}
          <col style={{ width: 200 }} />
        </colgroup>

        <thead>
          <tr>
            {table.columns.map((c) => {
              const active = sortKey === c.key;
              const icon = active ? (sortAsc ? "▲" : "▼") : "";
              return (
                <Th
                  key={c.key}
                  $clickable
                  onClick={() => toggleSort(c.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleSort(c.key);
                  }}
                  tabIndex={0}
                  role="button"
                  title="Sort"
                >
                  <ThInner>
                    <span>{c.label}</span>
                    <SortIcon aria-hidden="true">{icon}</SortIcon>
                  </ThInner>

                  <ResizeHandle
                    title="Drag to resize"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startResize(table.key, c.key, e.clientX);
                    }}
                  />
                </Th>
              );
            })}
            <Th $center>Actions</Th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const id = r[pk];
            const isEditing = editingRowId === id;

            return (
              <Tr key={String(id)}>
                {table.columns.map((c) => {
                  const val = r?.[c.key];
                  const isPk = c.key === pk;

                  return (
                    <Td key={c.key} $mono={c.key === "created_at"} $strong={isPk}>
                      {c.readOnly || !isEditing ? (
                        <Ellip title={String(val ?? "")}>{renderValue(val, c)}</Ellip>
                      ) : (
                        <EditorCell>
                          {c.type === "boolean" ? (
                            <ToggleWrap>
                              <input
                                type="checkbox"
                                checked={!!draft[c.key]}
                                onChange={(e) => onSetDraftValue(c.key, e.target.checked)}
                              />
                              <span>{draft[c.key] ? "True" : "False"}</span>
                            </ToggleWrap>
                          ) : c.type === "text" ? (
                            <TextArea
                              value={draft[c.key] ?? ""}
                              onChange={(e) => onSetDraftValue(c.key, e.target.value)}
                            />
                          ) : (
                            <InlineInput
                              value={draft[c.key] ?? ""}
                              onChange={(e) => onSetDraftValue(c.key, e.target.value)}
                            />
                          )}
                        </EditorCell>
                      )}
                    </Td>
                  );
                })}

                <Td $center>
                  {!isEditing ? (
                    <TdRow>
                      <ActBtn type="button" onClick={() => onStartEdit(r)}>
                        Edit
                      </ActBtn>
                      <DangerBtn
                        type="button"
                        onClick={() => {
                          const ok = window.confirm("Delete this row? This cannot be undone.");
                          if (ok) onDelete(r);
                        }}
                        disabled={String(deletingId) === String(id)}
                      >
                        {String(deletingId) === String(id) ? "Deleting…" : "Delete"}
                      </DangerBtn>
                    </TdRow>
                  ) : (
                    <TdRow>
                      <ActBtn type="button" onClick={() => onSave(r)} disabled={saving}>
                        {saving ? "Saving…" : "Save"}
                      </ActBtn>
                      <Btn2 type="button" onClick={onCancelEdit} disabled={saving}>
                        Cancel
                      </Btn2>
                    </TdRow>
                  )}
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
}

/* ---------------------------
   Cards + Compact (unchanged)
--------------------------- */

function CardsView({
  table,
  rows,
  editingRowId,
  draft,
  saving,
  deletingId,
  onStartEdit,
  onCancelEdit,
  onSetDraftValue,
  onSave,
  onDelete,
}) {
  const pk = table.primaryKey;

  return (
    <CardsGrid>
      {rows.map((r) => {
        const id = r[pk];
        const isEditing = editingRowId === id;

        return (
          <Card key={String(id)}>
            <CardTop>
              <Name>#{String(id)}</Name>
              <Time>{formatDate(r.created_at)}</Time>
            </CardTop>

            <CardBody>
              {table.columns.map((c) => {
                const val = r?.[c.key];
                if (c.key === pk) return null;

                return (
                  <Line key={c.key}>
                    <Label>{c.label}</Label>

                    {c.readOnly ? (
                      <Value title={String(val ?? "")}>{renderValue(val, c)}</Value>
                    ) : isEditing ? (
                      <EditorCell>
                        {c.type === "boolean" ? (
                          <ToggleWrap>
                            <input
                              type="checkbox"
                              checked={!!draft[c.key]}
                              onChange={(e) => onSetDraftValue(c.key, e.target.checked)}
                            />
                            <span>{draft[c.key] ? "True" : "False"}</span>
                          </ToggleWrap>
                        ) : c.type === "text" ? (
                          <TextArea
                            value={draft[c.key] ?? ""}
                            onChange={(e) => onSetDraftValue(c.key, e.target.value)}
                          />
                        ) : (
                          <InlineInput
                            value={draft[c.key] ?? ""}
                            onChange={(e) => onSetDraftValue(c.key, e.target.value)}
                          />
                        )}
                      </EditorCell>
                    ) : (
                      <Value title={String(val ?? "")}>{renderValue(val, c)}</Value>
                    )}
                  </Line>
                );
              })}
            </CardBody>

            <Actions>
              {!isEditing ? (
                <>
                  <ActBtn type="button" onClick={() => onStartEdit(r)}>
                    Edit
                  </ActBtn>
                  <DangerBtn
                    type="button"
                    onClick={() => {
                      const ok = window.confirm("Delete this row? This cannot be undone.");
                      if (ok) onDelete(r);
                    }}
                    disabled={String(deletingId) === String(id)}
                  >
                    {String(deletingId) === String(id) ? "Deleting…" : "Delete"}
                  </DangerBtn>
                </>
              ) : (
                <>
                  <ActBtn type="button" onClick={() => onSave(r)} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </ActBtn>
                  <Btn2 type="button" onClick={onCancelEdit} disabled={saving}>
                    Cancel
                  </Btn2>
                </>
              )}
            </Actions>
          </Card>
        );
      })}
    </CardsGrid>
  );
}

function CompactView({
  table,
  rows,
  editingRowId,
  draft,
  saving,
  deletingId,
  onStartEdit,
  onCancelEdit,
  onSetDraftValue,
  onSave,
  onDelete,
}) {
  const pk = table.primaryKey;

  return (
    <CompactWrap>
      {rows.map((r) => {
        const id = r[pk];
        const isEditing = editingRowId === id;

        return (
          <CompactRow key={String(id)}>
            <CompactTop>
              <CompactName>#{String(id)}</CompactName>
              <CompactTime>{formatDate(r.created_at)}</CompactTime>
            </CompactTop>

            <CompactMeta>
              {table.columns
                .filter((c) => c.key !== pk)
                .map((c) => {
                  const val = r?.[c.key];

                  return (
                    <CompactMetaItem key={c.key}>
                      <strong>{c.label}:</strong>{" "}
                      {c.readOnly || !isEditing ? (
                        <span title={String(val ?? "")}>{renderValue(val, c)}</span>
                      ) : c.type === "boolean" ? (
                        <ToggleWrap>
                          <input
                            type="checkbox"
                            checked={!!draft[c.key]}
                            onChange={(e) => onSetDraftValue(c.key, e.target.checked)}
                          />
                          <span>{draft[c.key] ? "True" : "False"}</span>
                        </ToggleWrap>
                      ) : c.type === "text" ? (
                        <TextArea
                          value={draft[c.key] ?? ""}
                          onChange={(e) => onSetDraftValue(c.key, e.target.value)}
                        />
                      ) : (
                        <InlineInput
                          value={draft[c.key] ?? ""}
                          onChange={(e) => onSetDraftValue(c.key, e.target.value)}
                        />
                      )}
                    </CompactMetaItem>
                  );
                })}
            </CompactMeta>

            <Actions style={{ marginTop: 10 }}>
              {!isEditing ? (
                <>
                  <ActBtn type="button" onClick={() => onStartEdit(r)}>
                    Edit
                  </ActBtn>
                  <DangerBtn
                    type="button"
                    onClick={() => {
                      const ok = window.confirm("Delete this row? This cannot be undone.");
                      if (ok) onDelete(r);
                    }}
                    disabled={String(deletingId) === String(id)}
                  >
                    {String(deletingId) === String(id) ? "Deleting…" : "Delete"}
                  </DangerBtn>
                </>
              ) : (
                <>
                  <ActBtn type="button" onClick={() => onSave(r)} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </ActBtn>
                  <Btn2 type="button" onClick={onCancelEdit} disabled={saving}>
                    Cancel
                  </Btn2>
                </>
              )}
            </Actions>
          </CompactRow>
        );
      })}
    </CompactWrap>
  );
}

/* ---------------------------
   utils
--------------------------- */

function renderValue(val, col) {
  if (val === null || val === undefined || val === "") return "—";
  if (col?.type === "boolean") return val ? "True" : "False";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/* ---------------------------
   styles
--------------------------- */

const Page = styled.div`
  background: #ffffff;
  padding: 22px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 8px;
  }

  @media (max-width: 480px) {
    padding: 0px;
  }
`;

const TopBar = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 8px auto 18px;
  max-width: 1100px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const Left = styled.div`
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Right = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
`;

const H1 = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  color: #2f2f32;

  @media (max-width: 768px) {
    font-size: 22px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const Meta = styled.div`
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.72);

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const SelectTable = styled.select`
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: #2f2f32;
  font-weight: 900;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Search = styled.input`
  width: min(360px, 72vw);
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(47, 47, 50, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: #2f2f32;
  font-weight: 700;

  &::placeholder {
    color: rgba(47, 47, 50, 0.55);
  }

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Segmented = styled.div`
  display: flex;
  gap: 6px;
  padding: 6px;
  border-radius: 999px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.92);

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SegBtn = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 10px 12px;
  font-weight: 900;
  cursor: pointer;
  background: ${(p) => (p.$active ? "#7da8c1" : "transparent")};
  color: ${(p) => (p.$active ? "#ffffff" : "rgba(47,47,50,0.86)")};

  &:hover {
    background: ${(p) => (p.$active ? "#7da8c1" : "rgba(47,47,50,0.10)")};
  }

  @media (max-width: 768px) {
    flex: 1;
    padding: 12px 10px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    padding: 10px 8px;
  }
`;

const Btn = styled.button`
  border: 0;
  border-radius: 18px;
  padding: 12px 14px;
  font-weight: 900;
  cursor: pointer;
  background: #f3f4f6;
  color: #2f2f32;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Btn2 = styled.button`
  border: 0;
  border-radius: 18px;
  padding: 12px 14px;
  font-weight: 900;
  cursor: pointer;
  background: rgba(47, 47, 50, 0.08);
  color: #2f2f32;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 14px;
  }
`;

const CardsGrid = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #f3f4f6;
  border-radius: 22px;
  padding: 14px;
  box-shadow: 0 14px 45px rgba(0, 0, 0, 0.22);

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 18px;
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 10px;
`;

const Name = styled.div`
  font-weight: 900;
  color: #2f2f32;
  font-size: 15px;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const Time = styled.div`
  font-weight: 800;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.6);

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const CardBody = styled.div`
  margin-top: 6px;
`;

const Line = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: start;
  padding: 8px 0;
  border-top: 1px solid rgba(47, 47, 50, 0.08);

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 4px;
  }
`;

const Label = styled.div`
  font-size: 11px;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.6);

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const Value = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: #2f2f32;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;

  @media (max-width: 480px) {
    font-size: 12px;
    white-space: normal;
    word-break: break-word;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const ActBtn = styled.button`
  border: 0;
  border-radius: 18px;
  padding: 12px 14px;
  font-weight: 900;
  cursor: pointer;
  background: #7da8c1;
  color: #ffffff;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 14px;
    width: 100%;
  }
`;

const DangerBtn = styled.button`
  border: 0;
  border-radius: 18px;
  padding: 12px 14px;
  font-weight: 900;
  cursor: pointer;
  background: rgba(239, 68, 68, 0.12);
  color: rgba(127, 29, 29, 0.92);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 14px;
    width: 100%;
  }
`;

const EditorCell = styled.div`
  width: 100%;
  min-width: 0;
`;

const InlineInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  color: #2f2f32;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 14px;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 86px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 47, 50, 0.14);
  background: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  color: #2f2f32;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #7da8c1;
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 14px;
    min-height: 72px;
  }
`;

const ToggleWrap = styled.label`
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 900;
  color: rgba(47, 47, 50, 0.84);

  input {
    width: 16px;
    height: 16px;
    accent-color: #7da8c1;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const Empty = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  background: rgba(243, 244, 246, 0.12);
  border: 1px solid rgba(243, 244, 246, 0.18);
  color: #2f2f32;
  border-radius: 22px;
  padding: 18px;
  text-align: center;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 18px;
    font-size: 14px;
  }
`;

const ErrorCard = styled.div`
  max-width: 1100px;
  margin: 0 auto 14px;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.22);
  color: rgba(127, 29, 29, 0.92);
  border-radius: 22px;
  padding: 14px;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 18px;
    font-size: 14px;
  }
`;

const Skeleton = styled.div`
  height: 240px;
  border-radius: 22px;
  background: rgba(243, 244, 246, 0.12);
  border: 1px solid rgba(243, 244, 246, 0.18);

  @media (max-width: 480px) {
    height: 200px;
    border-radius: 18px;
  }
`;

const TableWrap = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 22px;
  overflow: auto;
  border: 1px solid rgba(243, 244, 246, 0.16);
  background: rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    border-radius: 18px;
    margin: 0 -16px;
    max-width: calc(100vw - 24px);
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 480px) {
    border-radius: 14px;
    margin: 0 -12px;
    max-width: calc(100vw - 24px);
  }
`;

const Table = styled.table`
  width: max-content;
  border-collapse: collapse;
  background: rgba(0, 0, 0, 0.04);
  color: #2f2f32;

  thead {
    background: rgba(0, 0, 0, 0.07);
  }

  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const Th = styled.th`
  text-align: left;
  font-size: 12px;
  font-weight: 900;
  padding: 12px 12px;
  color: rgba(47, 47, 50, 0.88);
  border-bottom: 1px solid rgba(47, 47, 50, 0.1);
  white-space: nowrap;
  position: relative;
  user-select: none;

  ${(p) =>
    p.$clickable
      ? `
    cursor: pointer;
    &:hover { background: rgba(0,0,0,0.06); }
  `
      : ``}

  ${(p) =>
    p.$center
      ? `
    text-align: center;
  `
      : ``}

  ${(p) =>
    p.$right
      ? `
    text-align: right;
  `
      : ``}

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 10px 8px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
    padding: 8px 6px;
  }
`;

const ThInner = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const SortIcon = styled.span`
  font-size: 11px;
  opacity: 0.7;

  @media (max-width: 480px) {
    font-size: 9px;
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  right: -2px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  user-select: none;

  &:hover {
    background: rgba(125, 168, 193, 0.22);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Tr = styled.tr`
  &:hover td {
    background: rgba(47, 47, 50, 0.04);
  }
`;

const Td = styled.td`
  padding: 12px 12px;
  font-size: 12px;
  font-weight: ${(p) => (p.$strong ? 900 : 800)};
  color: rgba(47, 47, 50, 0.88);
  border-bottom: 1px solid rgba(47, 47, 50, 0.08);
  vertical-align: middle;

  ${(p) =>
    p.$mono
      ? `
    font-variant-numeric: tabular-nums;
  `
      : ``}
  
  ${(p) =>
    p.$center
      ? `
    text-align: center;
  `
      : ``}

  ${(p) =>
    p.$right
      ? `
    text-align: right;
  `
      : ``}

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 10px 8px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
    padding: 8px 6px;
  }
`;

const TdRow = styled.div`
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 768px) {
    gap: 6px;
    flex-wrap: wrap;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 4px;
    width: 100%;

    button {
      width: 100%;
      font-size: 10px;
      padding: 6px 8px;
    }
  }
`;

const Ellip = styled.div`
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    max-width: 200px;
  }

  @media (max-width: 480px) {
    max-width: 120px;
  }
`;

const TableSkeleton = styled.div`
  height: 420px;

  @media (max-width: 480px) {
    height: 300px;
  }
`;

const CompactWrap = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 10px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const CompactRow = styled.div`
  background: rgba(243, 244, 246, 0.92);
  border-radius: 18px;
  padding: 12px;

  @media (max-width: 480px) {
    padding: 10px;
    border-radius: 14px;
  }
`;

const CompactTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
`;

const CompactName = styled.div`
  font-weight: 900;
  color: #2f2f32;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const CompactTime = styled.div`
  font-weight: 900;
  font-size: 11px;
  color: rgba(47, 47, 50, 0.62);

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const CompactMeta = styled.div`
  display: grid;
  gap: 6px;
  margin-top: 10px;

  @media (max-width: 480px) {
    gap: 5px;
    margin-top: 8px;
  }
`;

const CompactMetaItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  font-weight: 800;
  color: rgba(47, 47, 50, 0.82);

  span {
    font-weight: 900;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    gap: 6px;
  }
`;