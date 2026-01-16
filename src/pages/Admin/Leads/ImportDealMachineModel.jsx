import React, { useMemo, useState } from "react";
import styled from "styled-components";

export default function ImportDealMachineModal({ preview, onClose, onConfirmImport, busy }) {
  const [tab, setTab] = useState("valid"); // "valid" | "skipped"
  const [search, setSearch] = useState("");

  const filteredValid = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return preview.valid;
    return preview.valid.filter(({ lead }) => {
      const blob = [
        lead.first_name,
        lead.last_name,
        lead.phone,
        lead.email,
        lead.property_address,
        lead.mailing_address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [preview.valid, search]);

  const filteredSkipped = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return preview.skipped;
    return preview.skipped.filter(({ row, reasons }) => {
      const blob = [
        ...Object.values(row || {}).map((v) => String(v ?? "")),
        ...(reasons || []),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [preview.skipped, search]);

  return (
    <Backdrop>
      <Modal>
        <Header>
          <div>
            <Title>Import DealMachine CSV</Title>
            <Sub>
              File: <b>{preview.fileName}</b> • Rows: <b>{preview.allCount}</b> • Valid:{" "}
              <b>{preview.valid.length}</b> • Skipped: <b>{preview.skipped.length}</b>
            </Sub>
          </div>
          <X onClick={onClose} aria-label="Close">✕</X>
        </Header>

        <Controls>
          <Tabs>
            <TabButton $active={tab === "valid"} onClick={() => setTab("valid")}>
              Valid ({preview.valid.length})
            </TabButton>
            <TabButton $active={tab === "skipped"} onClick={() => setTab("skipped")}>
              Skipped ({preview.skipped.length})
            </TabButton>
          </Tabs>

          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / phone / address..."
          />
        </Controls>

        <Body>
          {tab === "valid" ? (
            <Table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Property</th>
                  <th>Mailing</th>
                </tr>
              </thead>
              <tbody>
                {filteredValid.slice(0, 300).map(({ lead, rowIndex }) => (
                  <tr key={rowIndex}>
                    <td>{rowIndex}</td>
                    <td>{[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—"}</td>
                    <td>{lead.phone || "—"}</td>
                    <td>{lead.email || "—"}</td>
                    <td className="wide">{lead.property_address || "—"}</td>
                    <td className="wide">{lead.mailing_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Reasons</th>
                  <th>Sample</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkipped.slice(0, 300).map(({ row, rowIndex, reasons }) => (
                  <tr key={rowIndex}>
                    <td>{rowIndex}</td>
                    <td>{reasons.join(", ")}</td>
                    <td className="wide">
                      {[
                        row?.owner_full_name,
                        row?.["Owner Name"],
                        row?.property_address,
                        row?.["Property Address"],
                        row?.phone_1,
                        row?.["Phone 1"],
                      ]
                        .filter(Boolean)
                        .join(" • ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <Hint>
            Showing up to 300 rows in the preview for performance. Import will include all valid rows.
          </Hint>
        </Body>

        <Footer>
          <Secondary onClick={onClose} disabled={busy}>
            Cancel
          </Secondary>
          <Primary
            onClick={() => onConfirmImport()}
            disabled={busy || preview.valid.length === 0}
            title={preview.valid.length === 0 ? "No valid rows to import" : ""}
          >
            {busy ? "Importing..." : `Import ${preview.valid.length} leads`}
          </Primary>
        </Footer>
      </Modal>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Modal = styled.div`
  width: min(1100px, 94vw);
  max-height: 86vh;
  background: white;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 16px 18px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 18px;
`;

const Sub = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #555;
`;

const Tiny = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #666;
`;

const X = styled.button`
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  padding: 2px 6px;
`;

const Controls = styled.div`
  padding: 10px 18px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
`;

const TabButton = styled.button`
  border: 1px solid #ddd;
  background: ${({ $active }) => ($active ? "#111" : "white")};
  color: ${({ $active }) => ($active ? "white" : "#111")};
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
`;

const Search = styled.input`
  flex: 1;
  max-width: 420px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 13px;
`;

const Body = styled.div`
  padding: 14px 18px 0 18px;
  overflow: auto;
  flex: 1;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    border-bottom: 1px solid #f0f0f0;
    padding: 10px 8px;
    text-align: left;
    font-size: 13px;
    vertical-align: top;
  }

  th {
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
    border-bottom: 1px solid #e9e9e9;
  }

  .wide {
    max-width: 420px;
    word-break: break-word;
  }
`;

const Hint = styled.div`
  padding: 10px 0 14px 0;
  font-size: 12px;
  color: #777;
`;

const Footer = styled.div`
  padding: 14px 18px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Primary = styled.button`
  background: #111;
  color: white;
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
`;

const Secondary = styled.button`
  background: white;
  color: #111;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
`;
