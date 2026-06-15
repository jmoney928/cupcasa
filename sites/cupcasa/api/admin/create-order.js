// Admin endpoint: create an order for a customer.
//
// POST /api/admin/create-order
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//   Content-Type: application/json
//
// Body (all required unless marked optional):
//   customer_email   string   — finds or creates the customer row
//   cup_type         string   — "PLA" or "PHA"
//   size             string   — e.g. "12oz"
//   quantity         number
//   unit_price       number
//   total            number
//   deposit_paid     number   (optional, default 0)
//   balance_paid     number   (optional, default 0)
//   status           string   — pending | in_production | dispatched | delivered | cancelled
//   production_stage string   — awaiting_deposit | artwork_review | printing | quality_check | dispatched
//   order_date       string   — YYYY-MM-DD (optional, defaults to today)
//   expected_dispatch string  — YYYY-MM-DD (optional)
//   notes            string   (optional)
//
// Returns: { order_id: "uuid" }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function supabaseHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Prefer': 'return=representation',
  };
}

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...supabaseHeaders(), ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
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

  const {
    customer_email,
    cup_type,
    size,
    quantity,
    unit_price,
    total,
    deposit_paid   = 0,
    balance_paid   = 0,
    status         = 'pending',
    production_stage = 'awaiting_deposit',
    order_date,
    expected_dispatch,
    notes,
  } = req.body;

  if (!customer_email || !cup_type || !size || quantity == null || unit_price == null || total == null) {
    return res.status(400).json({ error: 'Missing required fields: customer_email, cup_type, size, quantity, unit_price, total' });
  }

  // Look up customer by email
  const lookup = await supabaseFetch(`customers?email=eq.${encodeURIComponent(customer_email)}&select=id`);
  if (!lookup.ok) {
    return res.status(500).json({ error: 'Failed to look up customer', details: lookup.body });
  }

  let customerId;
  if (lookup.body.length > 0) {
    customerId = lookup.body[0].id;
  } else {
    // Customer not found — they'll need a Supabase Auth user first.
    // This endpoint doesn't create auth users (that requires Supabase Admin Auth API).
    // Return a clear error pointing to the right flow.
    return res.status(404).json({
      error: `No customer found with email "${customer_email}".`,
      hint: 'The customer must sign up via the portal first, or you can create them in Supabase Dashboard → Authentication → Users, then add a row to the customers table.',
    });
  }

  // Insert the order (service role bypasses RLS so we can write any customer's order)
  const insert = await supabaseFetch('orders', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: customerId,
      cup_type,
      size,
      quantity: Number(quantity),
      unit_price: Number(unit_price),
      total: Number(total),
      deposit_paid: Number(deposit_paid),
      balance_paid: Number(balance_paid),
      status,
      production_stage,
      order_date: order_date || new Date().toISOString().slice(0, 10),
      expected_dispatch: expected_dispatch || null,
      notes: notes || null,
    }),
  });

  if (!insert.ok) {
    return res.status(500).json({ error: 'Failed to create order', details: insert.body });
  }

  const order = Array.isArray(insert.body) ? insert.body[0] : insert.body;
  return res.status(201).json({ order_id: order.id });
}
