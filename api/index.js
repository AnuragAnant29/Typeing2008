export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      let bot_token, chat_id, text;
      
      if (typeof req.body === 'string') {
        const params = new URLSearchParams(req.body);
        bot_token = params.get('bot_token');
        chat_id = params.get('chat_id');
        text = params.get('text');
      } else {
        bot_token = req.body.bot_token;
        chat_id = req.body.chat_id;
        text = req.body.text;
      }

      const tgUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
      const response = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat_id, text: text })
      });
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: "Telegram Proxy Failed" });
    }
  }
  
  return res.status(200).send("Developed by Anurag Anant - Telegram Proxy Active!");
}
