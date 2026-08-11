const https = require('https');

const config = {
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

function telegramRequest(botToken, method, headers, bodyBuffer) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      path: '/bot' + botToken + '/' + method,
      method: 'POST',
      headers: headers
    };
    const req = https.request(options, (resp) => {
      let chunks = [];
      resp.on('data', (c) => chunks.push(c));
      resp.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed = {};
        try { parsed = JSON.parse(raw); } catch (e) { parsed = { raw: raw }; }
        resolve({ status: resp.statusCode, data: parsed });
      });
    });
    req.on('error', (err) => reject(err));
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

async function forwardText(botToken, chatId, text) {
  const form = 'chat_id=' + encodeURIComponent(chatId) + '&text=' + encodeURIComponent(text);
  const bodyBuffer = Buffer.from(form, 'utf8');
  const result = await telegramRequest(botToken, 'sendMessage', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': bodyBuffer.length
  }, bodyBuffer);
  return { ok: result.status === 200 && result.data.ok !== false, status: result.status, data: result.data };
}

async function forwardVoice(botToken, chatId, caption, filename, mimeType, method, fieldName, audioBase64) {
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const boundary = '----AIVoiceTyperRelayBoundary' + Date.now();
  const lineEnd = '\r\n';

  const parts = [];
  parts.push(Buffer.from('--' + boundary + lineEnd +
    'Content-Disposition: form-data; name="chat_id"' + lineEnd + lineEnd +
    chatId + lineEnd, 'utf8'));

  if (caption) {
    parts.push(Buffer.from('--' + boundary + lineEnd +
      'Content-Disposition: form-data; name="caption"' + lineEnd + lineEnd +
      caption + lineEnd, 'utf8'));
  }

  parts.push(Buffer.from('--' + boundary + lineEnd +
    'Content-Disposition: form-data; name="' + fieldName + '"; filename="' + filename + '"' + lineEnd +
    'Content-Type: ' + mimeType + lineEnd + lineEnd, 'utf8'));
  parts.push(audioBuffer);
  parts.push(Buffer.from(lineEnd, 'utf8'));
  parts.push(Buffer.from('--' + boundary + '--' + lineEnd, 'utf8'));

  const bodyBuffer = Buffer.concat(parts);

  const result = await telegramRequest(botToken, method, {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length
  }, bodyBuffer);

  return { ok: result.status === 200 && result.data.ok !== false, status: result.status, data: result.data };
}

module.exports = async (req, res) => {
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
};

module.exports.config = config;
