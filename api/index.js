export const config = {
  api: {
    bodyParser: {
      sizeLimit: '9mb'
    }
  }
};

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    const params = new URLSearchParams(req.body);
    const out = {};
    for (const [k, v] of params.entries()) out[k] = v;
    return out;
  }
  return {};
}

async function forwardText(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ chat_id: chatId, text })
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok && data.ok !== false, status: resp.status, data };
}

async function forwardVoice(botToken, chatId, caption, filename, mimeType, method, fieldName, audioBase64) {
  const buffer = Buffer.from(audioBase64, 'base64');
  const blob = new Blob([buffer], { type: mimeType || 'audio/ogg' });
  const form = new FormData();
  form.append('chat_id', chatId);
  if (caption) form.append('caption', caption);
  form.append(fieldName || 'voice', blob, filename || 'voice_feedback.ogg');

  const url = `https://api.telegram.org/bot${botToken}/${method || 'sendVoice'}`;
  const resp = await fetch(url, {
    method: 'POST',
    body: form
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok && data.ok !== false, status: resp.status, data };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseBody(req);
    const botToken = body.bot_token;
    const chatId = body.chat_id;

    if (!botToken || !chatId) {
      res.status(400).json({ ok: false, error: 'Missing bot_token or chat_id' });
      return;
    }

    if (body.audio_base64) {
      const result = await forwardVoice(
        botToken,
        chatId,
        body.caption || '',
        body.filename || 'voice_feedback.ogg',
        body.mime_type || 'audio/ogg',
        body.method || 'sendVoice',
        body.field_name || 'voice',
        body.audio_base64
      );
      if (!result.ok) {
        res.status(502).json({ ok: false, error: 'Telegram rejected voice upload', telegram: result.data });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (body.text) {
      const result = await forwardText(botToken, chatId, body.text);
      if (!result.ok) {
        res.status(502).json({ ok: false, error: 'Telegram rejected text message', telegram: result.data });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ ok: false, error: 'Neither text nor audio_base64 provided' });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
