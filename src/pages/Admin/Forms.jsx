import React from "react";
import styled from "styled-components";
import AdminTables from "../../components/AdminTables";

export default function AdminForms() {
  return (
    <Wrap>
      <AdminTables title="Forms" />
    </Wrap>
  );
}

const Wrap = styled.div`
  max-width: 1800px;
  margin: 0 auto;
  padding: 22px;
`;
