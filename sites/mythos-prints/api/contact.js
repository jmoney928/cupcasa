function esc(str) {
  if (!str) return '—';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label, value) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #eee;width:150px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#888;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:15px;color:#1a1a1a;">${esc(value)}</td>
  </tr>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, business, email, phone, 'cup-type': cupType, volume, location, timeline, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#0D0E10;padding:24px 32px;border-bottom:3px solid #C47A4A;">
    <p style="color:#C47A4A;font-size:11px;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">Mythos Prints</p>
    <h1 style="color:#ECE8E4;font-size:22px;margin:0;font-weight:700;">New Inquiry</h1>
  </div>
  <div style="padding:32px;">
    <table style="width:100%;border-collapse:collapse;">
      ${row('Name', name)}
      ${row('Business', business)}
      ${row('Email', email)}
      ${row('Phone', phone)}
      ${row('Cup Type', cupType)}
      ${row('Volume', volume)}
      ${row('Location', location)}
      ${row('Timeline', timeline)}
    </table>
    ${message ? `<div style="margin-top:24px;padding:16px 20px;background:#f8f7f5;border-left:3px solid #C47A4A;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.5px;color:#888;text-transform:uppercase;">Message</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#333;">${esc(message)}</p>
    </div>` : ''}
  </div>
  <div style="background:#f5f4f2;padding:14px 32px;font-size:12px;color:#999;">
    Reply to this email to respond directly to ${esc(name)} at ${esc(email)}.
  </div>
</div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mythos Prints <onboarding@resend.dev>',
        to: ['mythosprintshop@gmail.com'],
        reply_to: email,
        subject: `New inquiry — ${name}${business ? ` · ${business}` : ''}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email', details: err });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
