// Admin endpoint: attach a file to an order.
//
// Two-step process:
//   Step 1 — call this endpoint to get a signed upload URL.
//   Step 2 — PUT your file bytes to that URL (from curl, Postman, or any HTTP client).
//
// POST /api/admin/upload-file
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//   Content-Type: application/json
//
// Body:
//   order_id   string   — UUID of the order
//   file_type  string   — "proof" | "mockup" | "invoice"
//   file_name  string   — e.g. "logo-proof-v1.pdf"
//
// Returns:
//   {
//     upload_url:    string,   // PUT your file here (expires in 60 min)
//     storage_path:  string,   // recorded in order_files; use this in /api/admin/upload-file too
//     file_id:       string    // UUID of the new order_files row
//   }
//
// After Step 2 (the PUT), the file will be accessible to the customer
// via a signed download URL generated in portal/order.html.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const BUCKET       = 'order-files';

function supabaseHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Prefer': 'return=representation',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const auth = req.headers['authorization'] || '';
  if (!ADMIN_SECRET || auth !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { order_id, file_type, file_name } = req.body;

  if (!order_id || !file_type || !file_name) {
    return res.status(400).json({ error: 'Missing required fields: order_id, file_type, file_name' });
  }

  if (!['proof', 'mockup', 'invoice'].includes(file_type)) {
    return res.status(400).json({ error: 'file_type must be one of: proof, mockup, invoice' });
  }

  // Verify the order exists (service role can see all orders)
  const orderCheck = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(order_id)}&select=id`,
    { headers: supabaseHeaders() }
  );
  const orderData = await orderCheck.json();
  if (!orderCheck.ok || !orderData.length) {
    return res.status(404).json({ error: `Order "${order_id}" not found.` });
  }

  // Storage path: {order_id}/{file_type}/{file_name}
  // Keeping order_id as the top-level folder makes the RLS storage policy work:
  // customers can only read folders matching their own order IDs.
  const storagePath = `${order_id}/${file_type}/${file_name}`;

  // Request a signed upload URL from Supabase Storage
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${storagePath}`,
    {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({ upsert: true }),
    }
  );
  const signData = await signRes.json().catch(() => ({}));

  if (!signRes.ok) {
    return res.status(500).json({ error: 'Failed to create upload URL', details: signData });
  }

  // The signed URL returned by Supabase is relative; build the full URL.
  const uploadUrl = signData.url?.startsWith('http')
    ? signData.url
    : `${SUPABASE_URL}${signData.url}`;

  // Insert (or upsert) the order_files record
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/order_files`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Prefer': 'return=representation,resolution=merge-duplicates',
      'on-conflict': 'order_id,file_type,file_name',
    },
    body: JSON.stringify({
      order_id,
      file_type,
      storage_path: storagePath,
      file_name,
    }),
  });
  const insertData = await insertRes.json().catch(() => ({}));

  if (!insertRes.ok) {
    return res.status(500).json({ error: 'Failed to record file in database', details: insertData });
  }

  const fileRow = Array.isArray(insertData) ? insertData[0] : insertData;

  return res.status(200).json({
    upload_url:   uploadUrl,
    storage_path: storagePath,
    file_id:      fileRow.id,
  });
}
