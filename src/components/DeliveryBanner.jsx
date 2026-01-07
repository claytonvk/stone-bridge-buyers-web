import React from "react";
import styled from "styled-components";

export function DeliveryBanner() {
  return (
    <Bar>
      <Text>We buy houses as-is. No repairs. No pressure.</Text>
    </Bar>
  );
}

const Bar = styled.div`
  width: 100%;
  background: #7da8c1;
  padding: 14px 22px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Text = styled.div`
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: white;
  text-align: center;
`;
