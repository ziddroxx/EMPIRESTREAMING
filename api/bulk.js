import { put } from "@vercel/blob";

function norm(s = "") {
  return String(s).trim().toLowerCase();
}
function makeKey(item) {
  // anti-doublon "fort": id si présent, sinon title+year+type
  if (item?.id) return `id:${String(item.id)}`;
  return `t:${norm(item?.title)}|y:${item?.year ?? ""}|ty:${norm(item?.type)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // mini sécurité: clé admin
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && req.headers["x-admin-key"] !== adminKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const contentUrl = process.env.CONTENT_BLOB_URL;
  if (!contentUrl) return res.status(500).json({ error: "Missing CONTENT_BLOB_URL env" });

  // 1) charge l'existant
  const currentRes = await fetch(contentUrl, { cache: "no-store" });
  const current = currentRes.ok ? await currentRes.json() : [];
  const existing = Array.isArray(current) ? current : [];

  // 2) payload bulk
  const incoming = req.body;
  const list = Array.isArray(incoming) ? incoming : incoming?.items;
  if (!Array.isArray(list)) return res.status(400).json({ error: "Body must be an array or {items:[...]}" });

  const seen = new Set(existing.map(makeKey));

  let added = 0, skipped = 0, invalid = 0;
  const merged = [...existing];

  for (const it of list) {
    if (!it || !it.title || !it.type) { invalid++; continue; }
    const k = makeKey(it);
    if (seen.has(k)) { skipped++; continue; }
    seen.add(k);
    merged.push(it);
    added++;
  }

  // 3) réécrit le JSON dans Blob
  // ⚠️ Nécessite BLOB_READ_WRITE_TOKEN dans les env Vercel
  const updatedBlob = await put("content.json", JSON.stringify(merged, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });

  // IMPORTANT: si l'URL du blob change chez toi, mets à jour CONTENT_BLOB_URL
  res.status(200).json({ added, skipped, invalid, total: merged.length, blobUrl: updatedBlob.url });
}
