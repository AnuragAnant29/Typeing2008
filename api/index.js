module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const params = req.body || {};
  const botToken = params.bot_token;
  const chatId = params.chat_id;

  if (!botToken || !chatId) {
    res.status(400).send("Missing parameters");
    return;
  }

  try {
    if (params.audio_base64) {
      const audioBuffer = Buffer.from(params.audio_base64, "base64");
      const method = params.method || "sendAudio";
      const fieldName = params.field_name || "audio";
      const filename = params.filename || "voice_feedback.ogg";
      const mimeType = params.mime_type || "audio/ogg";

      const form = new FormData();
      form.append("chat_id", chatId);
      if (params.caption) form.append("caption", params.caption);
      form.append(fieldName, new Blob([audioBuffer], { type: mimeType }), filename);

      const telegramUrl = "https://api.telegram.org/bot" + botToken + "/" + method;
      const response = await fetch(telegramUrl, {
        method: "POST",
        body: form
      });
      const data = await response.json();
      if (data.ok) {
        res.status(200).send("OK");
      } else {
        res.status(500).send(JSON.stringify(data));
      }
      return;
    }

    const text = params.text;
    if (!text) {
      res.status(400).send("Missing parameters");
      return;
    }
    const telegramUrl = "https://api.telegram.org/bot" + botToken + "/sendMessage";
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "chat_id=" + encodeURIComponent(chatId) + "&text=" + encodeURIComponent(text)
    });
    const data = await response.json();
    if (data.ok) {
      res.status(200).send("OK");
    } else {
      res.status(500).send(JSON.stringify(data));
    }
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};
