module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const params = req.body || {};
  const botToken = params.bot_token;
  const chatId = params.chat_id;
  const text = params.text;
  if (!botToken || !chatId || !text) {
    res.status(400).send("Missing parameters");
    return;
  }
  try {
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
