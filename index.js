require("dotenv").config();
const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType
} = require("discord.js");

// ================== CONFIG ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "c!";
const ITEMS_PER_PAGE = 5;
const EMBED_COLOR = 0x00BFFF;
const DATA_FILE = path.join(__dirname, "data.json");

// ================== DATA ==================
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function ensureUser(data, guildId, userId) {
  if (!data[guildId]) data[guildId] = { users: {} };
  if (!data[guildId].users[userId]) {
    data[guildId].users[userId] = { matches: [] };
  }
}

// ================== HELPERS ==================
function deleteUserMessage(message) {
  setTimeout(() => {
    message.delete().catch(() => {});
  }, 1000);
}

function errorEmbed(text) {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(`❌ ${text}`);
}

function formatDate(ms) {
  const d = new Date(ms);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes} (UTC-3)`;
}

function paginate(array, page) {
  const start = page * ITEMS_PER_PAGE;
  return array.slice(start, start + ITEMS_PER_PAGE);
}

function buttons(page, maxPages, id) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${id}_prev`)
      .setLabel("⬅")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`${id}_next`)
      .setLabel("➡")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= maxPages - 1)
  );
}

//==================ESTADOS DE GUNTER===========

const gunterStates = [
  { state: "Dormido 😴", image: "https://i.imgur.com/CS42VeK.png" },
  { state: "Enojado 😡", image: "https://i.imgur.com/qz449en.png" },
  { state: "Aburrido 😩", image: "https://i.imgur.com/IjcWYC8.png" },
  { state: "Pensando 🤔", image: "https://i.imgur.com/dmN1ZGT.png"},
  { state: "Cayendo? 😨", image: "https://i.imgur.com/lfH7MJK.png"},
  { state: "Cocinando 🍳", image: "https://i.imgur.com/5VjJXPY.png"},
  { state: "Mal 🤢", image: "https://i.imgur.com/yYCFJsQ.jpeg"},
  { state: "Tocando la bateria 🥁", image: "https://i.imgur.com/Bz2Wz8o.png"},
  { state: "Comiendo 😋", image: "https://i.imgur.com/SNvL7lf.png"},
  { state: "Caramelizado 🍬", image: "https://i.imgur.com/bgag5SO.jpeg"},
  { state: "Tranquilo 😊", image: "https://i.imgur.com/LOHSG9U.jpeg"}
];

let currentGunterState = gunterStates[0];


function changeGunterState() {
  const randomIndex = Math.floor(Math.random() * gunterStates.length);
  currentGunterState = gunterStates[randomIndex];
  console.log(`✅ Nuevo estado de Gunter: ${currentGunterState.state}`);
}

changeGunterState();
setInterval(changeGunterState, 600000);

// ================== READY ==================
client.once("clientReady", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  client.user.setActivity('c!help', { type: ActivityType.Playing });
});

// ================== COMMANDS ==================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  deleteUserMessage(message);

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  const data = loadData();
  const guildId = message.guild.id;
  const authorId = message.author.id;



// ================== VERIFICACIÓN DE CANAL ==================
  if (!data[guildId]) data[guildId] = { users: {}, settings: {} };
  if (!data[guildId].settings) data[guildId].settings = {};

  const adminCommands = ["setchannel", "clearchannel", "getchannel"];

  const botChannelId = data[guildId]?.settings?.botChannel;
  if (botChannelId) {
    const botChannel = message.guild.channels.cache.get(botChannelId);
    if (!botChannel) {
      // Canal eliminado: limpiar configuración automáticamente
      delete data[guildId].settings.botChannel;
      saveData(data);
      console.log(`⚠ Canal configurado del bot eliminado en ${message.guild.name}. Configuración borrada.`);
    }
  }

// Bloquear comandos fuera del canal permitido, pero permitir adminCommands
if (botChannelId && !adminCommands.includes(cmd) && message.channel.id !== botChannelId) return;
  
  // ================== COMANDOS DE CANAL ==================
  if (cmd === "setchannel") {
    if (!message.member.permissions.has("Administrator")) {
      const m = await message.channel.send({ embeds: [errorEmbed("❌ Solo administradores pueden usar este comando")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      const m = await message.channel.send({ embeds: [errorEmbed("❌ Debes mencionar un canal válido")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    data[guildId].settings.botChannel = channel.id;
    saveData(data);

    const m = await message.channel.send({ embeds: [new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setDescription(`✅ Canal del bot establecido en ${channel}`)] 
    });
    setTimeout(() => m.delete().catch(() => {}), 30000);
  }

  if (cmd === "clearchannel") {
    if (!message.member.permissions.has("Administrator")) {
      const m = await message.channel.send({ embeds: [errorEmbed("❌ Solo administradores pueden usar este comando")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    if (!data[guildId]?.settings?.botChannel) {
      const m = await message.channel.send({ embeds: [errorEmbed("❌ No hay un canal establecido actualmente")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    delete data[guildId].settings.botChannel;
    saveData(data);

    const m = await message.channel.send({ embeds: [new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setDescription(`✅ Canal del bot eliminado. Ahora puede hablar en cualquier canal`)] 
    });
    setTimeout(() => m.delete().catch(() => {}), 30000);
  }

  if (cmd === "getchannel") {
    const botChannelId = data[guildId]?.settings?.botChannel;
    if (!botChannelId) {
      const m = await message.channel.send({ embeds: [errorEmbed("❌ No hay un canal configurado actualmente")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const channel = message.guild.channels.cache.get(botChannelId);
    const m = await message.channel.send({ embeds: [new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setDescription(`✅ Canal actual del bot: ${channel || "No encontrado"}`)] 
    });
    setTimeout(() => m.delete().catch(() => {}), 30000);
  }

  // ================== c!pvp ==================
  if (cmd === "pvp") {
    const opponent = message.mentions.users.first();
    const kills = parseInt(args[1], 10);
    const deaths = parseInt(args[2], 10);

    if (!opponent || !Number.isInteger(kills) || !Number.isInteger(deaths)) {
      const m = await message.channel.send({
        embeds: [errorEmbed("Uso correcto: `c!pvp @oponente kills muertes`")]
      });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    if (opponent.id === authorId || kills < 0 || deaths < 0) {
      const m = await message.channel.send({ embeds: [errorEmbed("Datos inválidos para el PvP")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle("Solicitud de Registro")
      .setDescription(
        `**${message.author.username}** vs **${opponent.username}**\n\n` +
        `Resultado propuesto: **${kills}/${deaths}**\n\n` +
        `${opponent}, confirma en **1 minuto**`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("pvp_accept").setLabel("✅ Aceptar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("pvp_reject").setLabel("❌ Rechazar").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", i => {
      if (i.user.id !== opponent.id) return i.reply({ content: "No puedes usar estos botones", ephemeral: true });
      collector.stop(i.customId);
    });

    collector.on("end", async (_, reason) => {
      if (reason === "pvp_accept") {
        ensureUser(data, guildId, authorId);
        ensureUser(data, guildId, opponent.id);
        const now = Date.now();
        data[guildId].users[authorId].matches.push({ date: now, opponentId: opponent.id, kills, deaths });
        data[guildId].users[opponent.id].matches.push({ date: now, opponentId: authorId, kills: deaths, deaths: kills });
        saveData(data);
        const m = await msg.edit({ embeds: [new EmbedBuilder().setColor(EMBED_COLOR).setDescription("✅ PvP registrado")], components: [] });
        setTimeout(() => m.delete().catch(() => {}), 30000);
      } else {
        const text = reason === "pvp_reject" ? "❌ Registro rechazado" : "⌛ Registro expirado";
        const m = await msg.edit({ embeds: [new EmbedBuilder().setColor(EMBED_COLOR).setDescription(text)], components: [] });
        setTimeout(() => m.delete().catch(() => {}), 30000);
      }
    });
  }

  // ================== c!undo ==================
  if (cmd === "undo") {
    const matches = data[guildId]?.users[authorId]?.matches ?? [];
    if (!matches.length) {
      const m = await message.channel.send({ embeds: [errorEmbed("No tienes partidas")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const last = matches[matches.length - 1];
    if (Date.now() - last.date > 2 * 60 * 1000) {
      const m = await message.channel.send({ embeds: [errorEmbed("Ya no se puede deshacer")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const oppMatches = data[guildId].users[last.opponentId].matches;
    data[guildId].users[authorId].matches.pop();
    const i = oppMatches.findIndex(m => m.date === last.date && m.opponentId === authorId);
    if (i !== -1) oppMatches.splice(i, 1);
    saveData(data);

    const m = await message.channel.send({ embeds: [new EmbedBuilder().setColor(EMBED_COLOR).setDescription("❌PvP deshecho")] });
    setTimeout(() => m.delete().catch(() => {}), 30000);
  }

  // ================== c!stats ==================
  if (cmd === "stats") {
    const target = message.mentions.users.first() || message.author;
    const matches = data[guildId]?.users[target.id]?.matches ?? [];
    if (!matches.length) {
      const m = await message.channel.send({ embeds: [errorEmbed("Sin partidas")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    let k = 0, d = 0;
    matches.forEach(m => { k += m.kills; d += m.deaths; });
    const last = matches[matches.length - 1];
    const kb = d === 0 ? "∞" : (k / d).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(`Stats de ${target.username}`)
      .addFields(
        { name: "Partidas", value: `${matches.length}`, inline: true },
        { name: "Kills", value: `${k}`, inline: true },
        { name: "Muertes", value: `${d}`, inline: true },
        { name: "KB", value: `${kb}`, inline: true },
        { name: "Última", value: `vs <@${last.opponentId}> ${last.kills}/${last.deaths}\n${formatDate(last.date)}` }
      );

    const m = await message.channel.send({ embeds: [embed] });
    setTimeout(() => m.delete().catch(() => {}), 60000);
  }

// ================== c!history ==================
if (cmd === "history") {
  // Usuario objetivo: mencionado o el que ejecuta el comando
  const target = message.mentions.users.first() || message.author;

  // Cargar partidas del usuario
  const matches = data[guildId]?.users[target.id]?.matches ?? [];
  if (!matches.length) {
    const m = await message.channel.send({ embeds: [errorEmbed("No tiene partidas registradas")] });
    return setTimeout(() => m.delete().catch(() => {}), 5000);
  }

  // Ordenar las partidas más recientes primero
  matches.sort((a, b) => b.date - a.date);

  let page = 0;
  const maxPages = Math.ceil(matches.length / ITEMS_PER_PAGE);
  const uid = `history_${message.id}`;

  // Función que genera el embed según la página actual
  const render = () => {
    const list = paginate(matches, page)
      .map(m => `vs <@${m.opponentId}> — **${m.kills}/${m.deaths}**\n${formatDate(m.date)}`)
      .join("\n\n");

    return new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(`Historial de ${target.username}`) // <-- Aquí siempre aparece el usuario correcto
      .setDescription(list)
      .setFooter({ text: `Página ${page + 1}/${maxPages}` });
  };

  // Enviar el embed con botones de paginación
  const msg = await message.channel.send({ embeds: [render()], components: [buttons(page, maxPages, uid)] });

  // Collector para los botones
  const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60000 });

  collector.on("collect", i => {
    if (i.customId.endsWith("next")) page++;
    if (i.customId.endsWith("prev")) page--;
    page = Math.max(0, Math.min(page, maxPages - 1));
    i.update({ embeds: [render()], components: [buttons(page, maxPages, uid)] });
  });

  collector.on("end", () => {
    msg.edit({ components: [] }).catch(() => {}); // deshabilita los botones al finalizar
    setTimeout(() => msg.delete().catch(() => {}), 1000); // borra el mensaje después de 1 minuto
  });
}


  // ================== c!vs ==================
  if (cmd === "vs") {
    const opponent = message.mentions.users.first();
    if (!opponent) {
      const m = await message.channel.send({ embeds: [errorEmbed("❌ Debes mencionar a un usuario")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const matches = data[guildId]?.users[authorId]?.matches?.filter(m => m.opponentId === opponent.id) ?? [];
    if (!matches.length) {
      const m = await message.channel.send({ embeds: [errorEmbed("No hay partidas contra ese usuario")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    matches.sort((a, b) => b.date - a.date);
    let page = 0;
    const maxPages = Math.ceil(matches.length / ITEMS_PER_PAGE);
    const uid = `vs_${message.id}`;

    const render = () => {
      const list = paginate(matches, page).map(m => `**${m.kills}/${m.deaths}**\n${formatDate(m.date)}`).join("\n\n");
      return new EmbedBuilder().setColor(EMBED_COLOR).setTitle(`${message.author.username} vs ${opponent.username}`).setDescription(list).setFooter({ text: `Página ${page + 1}/${maxPages}` });
    };

    const msg = await message.channel.send({ embeds: [render()], components: [buttons(page, maxPages, uid)] });
    const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === authorId, time: 60000 });

    collector.on("collect", i => {
      if (i.customId.endsWith("next")) page++;
      if (i.customId.endsWith("prev")) page--;
      page = Math.max(0, Math.min(page, maxPages - 1));
      i.update({ embeds: [render()], components: [buttons(page, maxPages, uid)] });
    });

   collector.on("end", () => {
     msg.edit({ components: [] }).catch(() => {}); // deshabilita los botones
     setTimeout(() => msg.delete().catch(() => {}), 1000); // borra el mensaje después de 1 minuto
   });

  }

  // ================== c!ranking ==================
  if (cmd === "ranking") {
    const users = data[guildId]?.users ?? {};
    const stats = Object.entries(users).map(([id, u]) => {
      let k = 0, d = 0;
      u.matches.forEach(m => { k += m.kills; d += m.deaths; });
      return { id, kb: d === 0 ? Infinity : k / d };
    });

    if (!stats.length) {
      const m = await message.channel.send({ embeds: [errorEmbed("No hay datos aún")] });
      return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    stats.sort((a, b) => b.kb - a.kb);
    let page = 0;
    const maxPages = Math.ceil(stats.length / ITEMS_PER_PAGE);
    const uid = `lb_${message.id}`;

    const render = () => {
      const list = paginate(stats, page).map((u, i) => {
        const pos = page * ITEMS_PER_PAGE + i + 1;
        const kbText = u.kb === Infinity ? "∞" : u.kb.toFixed(2);
        return `#${pos} <@${u.id}> — **KB ${kbText}**`;
      }).join("\n");
      return new EmbedBuilder().setColor(EMBED_COLOR).setTitle("Ranking KB").setDescription(list).setFooter({ text: `Página ${page + 1}/${maxPages}` });
    };

    const msg = await message.channel.send({ embeds: [render()], components: [buttons(page, maxPages, uid)] });
    const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === authorId, time: 60000 });

    collector.on("collect", i => {
      if (i.customId.endsWith("next")) page++;
      if (i.customId.endsWith("prev")) page--;
      page = Math.max(0, Math.min(page, maxPages - 1));
      i.update({ embeds: [render()], components: [buttons(page, maxPages, uid)] });
    });

   collector.on("end", () => {
     msg.edit({ components: [] }).catch(() => {}); // deshabilita los botones
     setTimeout(() => msg.delete().catch(() => {}), 1000); // borra el mensaje después de 1 minuto
   });

  }

  //=========ESTADO DE GUNTER COMANDO========
   if (cmd === "gunter") {
     const embed = new EmbedBuilder()
       .setTitle("Estado actual de Gunter")
       .setDescription(`Gunter se encuentra ${currentGunterState.state}`)
       .setImage(currentGunterState.image)
       .setColor(EMBED_COLOR);

    const msg = await message.channel.send({ embeds: [embed] });
     setTimeout(() => {msg.delete().catch(() => {}); }, 30000)
    }

// ================== c!help ==================
if (cmd === "help") {
  const helpEmbed = new EmbedBuilder()
    .setTitle("Comandos del Bot")
    .setColor(EMBED_COLOR)
    .addFields(
      { name: "PvP", value: "`c!pvp @usuario kills muertes` — Registrar un PvP\n`c!undo` — Deshacer último registro en 2 minutos" },
      { name: "Estadísticas", value: "`c!stats [@usuario]` — Ver tus stats o de otro usuario\n`c!history [@usuario]` — Ver historial de partidas\n`c!vs @usuario` — Ver partidas contra un usuario específico\n`c!ranking` — Ranking KB de todos los jugadores" }
    )
    .setFooter({ text: "v1.0" });

  message.author.send({ embeds: [helpEmbed] })
    .then(() => {
      message.channel.send("✅ Revisa tu DM.")
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    })
    .catch(() => {
      message.channel.send("❌ No pude enviarte un DM.")
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    });
}

});

client.login(process.env.TOKEN);
