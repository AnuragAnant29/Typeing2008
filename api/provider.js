export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      
      const partO = "sk-or-v1-";
      const o1 = partO + "7cf62ad2071310c9d526e29470955110ae28c1e379e44956f9c264b8d8afc219";
      const o2 = partO + "9e5e686ce01cfb0be98cdde6ae50ec9b80eab0a7146f6c3994e036005863a0dd";
      const o3 = partO + "bb440680a83b643dc48f11a76ea563faa2e80f94f58a1625045c8cc7410a9514";
      const o4 = partO + "e030dcbf56ce796403d6009baa203c3d8fce749c3948fd065672bf4abb3fdce2";
      const o5 = partO + "55354bbc88dd85c17d7194ccc8a281602d3760a95339bc3aa40e401535d4e832";
      
      const orKeys = [o1, o2, o3, o4, o5];
      const apiKey = orKeys[Math.floor(Math.random() * orKeys.length)];

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: "Provider Error" });
    }
  }
  
  return res.status(200).send("Developed by Anurag Anant - OpenRouter AI Provider Active!");
}
