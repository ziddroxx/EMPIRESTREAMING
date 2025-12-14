import { head } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.CONTENT_BLOB_URL; // URL du blob content.json
  if (!url) return res.status(500).json({ error: "Missing CONTENT_BLOB_URL env" });

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) return res.status(500).json({ error: "Failed to fetch content blob" });

  const data = await r.json();
  res.status(200).json(data);
}
