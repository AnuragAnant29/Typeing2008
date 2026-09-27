export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
  
  const part1 = "gsk_";
  const k1 = part1 + "FXl6twCAMfOkZqV1p4vqWGdyb3FY0uJnZWpnhDARY1Ly1RY5TFGV";
  const k2 = part1 + "suAYO9fAE5aa7aQBvN5VWGdyb3FY2N1ICxKfYQHedYwGmMgYCYuV";

  const groqKeys = [k1, k2];

  if (req.method === 'POST') {
    try {
      const selectedKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];
      
      const response = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + selectedKey
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: "Provider Error" });
    }
  }
  
  return res.status(200).send("Anurag Anant AI Provider is Active on Vercel!");
}
