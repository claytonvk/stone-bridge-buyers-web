// src/lib/dealmachineImport.js

const DM_FIELD_ALIASES = {
  firstName: [
    "owner_first_name",
    "first_name",
    "firstname",
    "First Name",
    "Owner First Name",
  ],
  lastName: [
    "owner_last_name",
    "last_name",
    "lastname",
    "Last Name",
    "Owner Last Name",
  ],
  fullName: [
    "owner_full_name",
    "full_name",
    "name",
    "Owner Name",
    "Owner Full Name",
  ],

  street: [
    "property_address",
    "Property Address",
    "address",
    "Address",
    "street_address",
    "Street Address",
  ],
  city: ["property_city", "Property City", "city", "City"],
  state: ["property_state", "Property State", "state", "State"],
  zip: ["property_zip", "Property Zip", "zip", "zipcode", "ZIP", "Zip"],

  notes: ["notes", "Notes"],
};

const DM_PHONE_COLUMNS = [
  { num: "phone_1", type: "phone_1_type", dnc: "phone_1_dnc" },
  { num: "phone_2", type: "phone_2_type", dnc: "phone_2_dnc" },
  { num: "phone_3", type: "phone_3_type", dnc: "phone_3_dnc" },
  { num: "phone_4", type: "phone_4_type", dnc: "phone_4_dnc" },

  { num: "Phone 1", type: "Phone 1 Type", dnc: "Phone 1 DNC" },
  { num: "Phone 2", type: "Phone 2 Type", dnc: "Phone 2 DNC" },
];

const DM_EMAIL_COLUMNS = [
  "email_1",
  "email_2",
  "Email 1",
  "Email 2",
  "email",
  "Email",
];

function getFirstTruthy(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return "";
}

function normalizeBool(v) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (["true", "yes", "y", "1"].includes(s)) return true;
  if (["false", "no", "n", "0", ""].includes(s)) return false;
  return false;
}

function stripNonDigits(s) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

// mirror your Edge Function’s phone normalization rules (US default)
function isValidPhoneForEdge(input) {
  if (!input) return false;
  const trimmed = String(input).trim();
  if (!trimmed) return false;

  const digits = stripNonDigits(trimmed);
  if (!digits) return false;

  if (trimmed.startsWith("+"))
    return digits.length >= 10 && digits.length <= 15;
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;

  return false;
}

function splitName(fullName) {
  const s = String(fullName ?? "").trim();
  if (!s) return { first: "", last: "" };
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function pickBestEmail(row) {
  for (const key of DM_EMAIL_COLUMNS) {
    const v = row?.[key];
    if (v && String(v).includes("@")) return String(v).trim();
  }
  return "";
}

function pickBestPhoneRaw(row) {
  const candidates = [];

  for (const p of DM_PHONE_COLUMNS) {
    if (row?.[p.num]) {
      candidates.push({
        raw: String(row[p.num]).trim(),
        type: String(row?.[p.type] ?? "")
          .trim()
          .toLowerCase(),
        dnc: normalizeBool(row?.[p.dnc]),
      });
    }
  }

  // generic "Phone 5" pattern
  for (const k of Object.keys(row || {})) {
    if (/^phone\s*\d+$/i.test(k) && row[k]) {
      candidates.push({ raw: String(row[k]).trim(), type: "", dnc: false });
    }
  }

  // keep only candidates that Edge Function can normalize
  const clean = candidates.filter((c) => isValidPhoneForEdge(c.raw));

  const nonDnc = clean.filter((c) => !c.dnc);
  const mobile = nonDnc.find(
    (c) => c.type.includes("mobile") || c.type.includes("cell")
  );
  if (mobile) return { phone: mobile.raw, allPhonesDnc: false };

  if (nonDnc.length) return { phone: nonDnc[0].raw, allPhonesDnc: false };

  if (clean.length) return { phone: "", allPhonesDnc: true };

  return { phone: "", allPhonesDnc: false };
}

export function transformDealMachineRowToLead(row, { sourceRef } = {}) {
  const first = getFirstTruthy(row, DM_FIELD_ALIASES.firstName);
  const last = getFirstTruthy(row, DM_FIELD_ALIASES.lastName);
  const full = getFirstTruthy(row, DM_FIELD_ALIASES.fullName);

  let first_name = first;
  let last_name = last;

  if ((!first_name || !last_name) && full) {
    const split = splitName(full);
    first_name = first_name || split.first;
    last_name = last_name || split.last;
  }

  const email = pickBestEmail(row);
  const { phone, allPhonesDnc } = pickBestPhoneRaw(row);

  const street_address = getFirstTruthy(row, DM_FIELD_ALIASES.street);
  const city = getFirstTruthy(row, DM_FIELD_ALIASES.city);
  const state = getFirstTruthy(row, DM_FIELD_ALIASES.state);
  const zipcode = getFirstTruthy(row, DM_FIELD_ALIASES.zip);

  const skipReasons = [];
  if (!phone) {
    if (allPhonesDnc) skipReasons.push("All phone numbers are DNC");
    else skipReasons.push("No valid phone found");
  }

  // IMPORTANT: purchased leads are NOT opted-in
  const lead = {
    phone: phone || null,
    email: email || null,
    first_name: first_name || null,
    last_name: last_name || null,

    street_address: street_address || null,
    unit: null,
    city: city || null,
    state: state || null,
    zipcode: zipcode || null,

    raw_address: null,

    // if all numbers are DNC, disable can_text
    can_text: !allPhonesDnc,

    // null = unknown (and for purchased leads you should keep these null / false depending on your policy)
    sms_subscription: null,
    consent_marketing: null,

    status: "new",
    source: "dealmachine",
    source_ref: sourceRef || "dealmachine_csv",

    // optional: you can choose to store notes via a column later if you have it
    // notes,
  };

  return { lead, skipReasons };
}
