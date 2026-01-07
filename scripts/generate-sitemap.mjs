import fs from "node:fs";
import path from "node:path";

const SITE_URL = process.env.SITE_URL || "https://stonebridgebuyers.com";

/**
 * Keep this aligned with your actual router:
 * - /locations (states directory page)
 * - /locations/:state (state pages)
 */

const STATIC_ROUTES = [
  { loc: "/", priority: 1.0, changefreq: "weekly" },
  { loc: "/about", priority: 0.7, changefreq: "monthly" },
  { loc: "/contact", priority: 0.8, changefreq: "monthly" },
  { loc: "/locations", priority: 0.9, changefreq: "weekly" },
];

// All 50 states (name + slug)
const STATES = [
  ["Alabama", "alabama"],
  ["Alaska", "alaska"],
  ["Arizona", "arizona"],
  ["Arkansas", "arkansas"],
  ["California", "california"],
  ["Colorado", "colorado"],
  ["Connecticut", "connecticut"],
  ["Delaware", "delaware"],
  ["Florida", "florida"],
  ["Georgia", "georgia"],
  ["Hawaii", "hawaii"],
  ["Idaho", "idaho"],
  ["Illinois", "illinois"],
  ["Indiana", "indiana"],
  ["Iowa", "iowa"],
  ["Kansas", "kansas"],
  ["Kentucky", "kentucky"],
  ["Louisiana", "louisiana"],
  ["Maine", "maine"],
  ["Maryland", "maryland"],
  ["Massachusetts", "massachusetts"],
  ["Michigan", "michigan"],
  ["Minnesota", "minnesota"],
  ["Mississippi", "mississippi"],
  ["Missouri", "missouri"],
  ["Montana", "montana"],
  ["Nebraska", "nebraska"],
  ["Nevada", "nevada"],
  ["New Hampshire", "new-hampshire"],
  ["New Jersey", "new-jersey"],
  ["New Mexico", "new-mexico"],
  ["New York", "new-york"],
  ["North Carolina", "north-carolina"],
  ["North Dakota", "north-dakota"],
  ["Ohio", "ohio"],
  ["Oklahoma", "oklahoma"],
  ["Oregon", "oregon"],
  ["Pennsylvania", "pennsylvania"],
  ["Rhode Island", "rhode-island"],
  ["South Carolina", "south-carolina"],
  ["South Dakota", "south-dakota"],
  ["Tennessee", "tennessee"],
  ["Texas", "texas"],
  ["Utah", "utah"],
  ["Vermont", "vermont"],
  ["Virginia", "virginia"],
  ["Washington", "washington"],
  ["West Virginia", "west-virginia"],
  ["Wisconsin", "wisconsin"],
  ["Wyoming", "wyoming"],
];

function normalizeSiteUrl(url) {
  // prevent double slashes in <loc>
  return String(url || "").replace(/\/+$/, "");
}

const SITE = normalizeSiteUrl(SITE_URL);

function statePriority(slug) {
  // Your primary target:
  if (slug === "texas") return 0.95;

  // Strong but slightly lower for the rest:
  // (Don’t over-optimize priorities; keep it reasonable.)
  return 0.78;
}

const stateRoutes = STATES.map(([name, slug]) => ({
  loc: `/locations/${slug}`,
  priority: statePriority(slug),
  changefreq: "weekly",
}));

const allRoutes = [...STATIC_ROUTES, ...stateRoutes];

// Optional: include lastmod (build time). Not required, but nice.
const lastmod = new Date().toISOString().split("T")[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (r) => `  <url>
    <loc>${SITE}${r.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const outPath = path.join(process.cwd(), "public", "sitemap.xml");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, xml, "utf8");
console.log(`✅ sitemap.xml written to ${outPath}`);
