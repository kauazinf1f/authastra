const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Página inicial (login)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "index.html");
});

// Callback do Discord OAuth2
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Erro: nenhum código recebido.");

  try {
    // Trocar code por access_token
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, token_type } = tokenResponse.data;

    // Pegar dados do usuário
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `${token_type} ${access_token}` },
    });

    const user = userResponse.data;

    // Adicionar ao servidor com guilds.join
    await axios.put(
      `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${user.id}`,
      { access_token },
      {
        headers: {
          Authorization: `Bot ${process.env.BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.send(
      `<h1>✅ Olá ${user.username}, você foi adicionado ao servidor!</h1>`
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Ocorreu um erro ao autenticar.");
  }
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));