import fs from "node:fs";
import path from "node:path";

const SITE_URL =
  process.env.SITE_URL || "https://atlas-equipment-web.vercel.app";

// Keep this list aligned with your LOCATION_GROUPS
const LOCATION_GROUPS = [
  {
    island: "O‘ahu",
    cities: [
      "Honolulu",
      "Waikīkī",
      "Kāne‘ohe",
      "Kailua",
      "Kapolei",
      "‘Ewa Beach",
      "Waipahu",
      "Mililani",
      "Wahiawā",
      "Pearl City",
      "Aiea",
      "Salt Lake",
      "Nānākuli",
      "Wai‘anae",
      "Hale‘iwa",
      "Waialua",
      "Pūpūkea",
      "Kahuku",
      "Lā‘ie",
      "Hau‘ula",
    ],
  },
  {
    island: "Maui",
    cities: [
      "Kahului",
      "Wailuku",
      "Kīhei",
      "Wailea",
      "Lahaina",
      "Kā‘anapali",
      "Kapalua",
      "Makawao",
      "Pukalani",
      "Kula",
      "Pa‘ia",
      "Hāna",
    ],
  },
  {
    island: "Hawai‘i (Big Island)",
    cities: [
      "Hilo",
      "Kailua-Kona",
      "Kealakekua",
      "Waimea",
      "Honoka‘a",
      "Kea‘au",
      "Pāhoa",
      "Volcano",
      "Nā‘ālehu",
      "Ocean View",
      "Waikoloa",
    ],
  },
  {
    island: "Kaua‘i",
    cities: [
      "Līhu‘e",
      "Kapa‘a",
      "Princeville",
      "Hanalei",
      "Kīlauea",
      "Kōloa",
      "Po‘ipū",
      "Waimea",
      "Hanapēpē",
      "Kalāheo",
    ],
  },
  { island: "Moloka‘i", cities: ["Kaunakakai", "Kualapu‘u", "Maunaloa"] },
  { island: "Lāna‘i", cities: ["Lāna‘i City", "Mānele"] },
];

function slugifyCity(city) {
  return city
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʻ‘’]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

// Priority strategy:
// - O‘ahu + Big Island higher
// - Within those, bigger cities higher (hand-ordered “top” list)
const TOP_OAHU = [
  "honolulu",
  "waikiki",
  "kailua",
  "kaneohe",
  "kapolei",
  "ewa-beach",
  "waipahu",
  "pearl-city",
  "mililani",
  "wahiawa",
];
const TOP_BIGISLAND = [
  "hilo",
  "kailua-kona",
  "waimea",
  "keaau",
  "pahoa",
  "waikoloa",
  "kealakekua",
];

function cityPriority(island, slug) {
  const isOahu = island.includes("O‘ahu") || island.includes("Oʻahu");
  const isBig = island.includes("Big Island") || island.includes("Hawai‘i");

  if (isOahu) {
    if (TOP_OAHU.includes(slug)) return 0.85;
    return 0.75;
  }

  if (isBig) {
    if (TOP_BIGISLAND.includes(slug)) return 0.8;
    return 0.72;
  }

  // other islands
  return 0.65;
}

const staticRoutes = [
  { loc: "/", priority: 1.0 },
  { loc: "/about", priority: 0.8 },
  { loc: "/contact", priority: 0.8 },
];

const cityRoutes = LOCATION_GROUPS.flatMap((g) =>
  g.cities.map((c) => {
    const slug = slugifyCity(c);
    return {
      loc: `/locations/${slug}`,
      priority: cityPriority(g.island, slug),
    };
  })
);

const allRoutes = [...staticRoutes, ...cityRoutes];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const outPath = path.join(process.cwd(), "public", "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf8");
console.log(`✅ sitemap.xml written to ${outPath}`);
