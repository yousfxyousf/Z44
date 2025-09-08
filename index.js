const { Client, Intents } = require('discord.js');
const express = require('express');
const { joinVoiceChannel } = require('@discordjs/voice');
const https = require('https');
const fetch = require('node-fetch');
const app = express();
const prefix = "+";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.DIRECT_MESSAGES
  ],
  partials: ['CHANNEL'], // Needed for DMs
});

// Express server setup
app.get('/', (req, res) => {
  res.send(`
  <body>
  <center><h1>Bot 24H ON!</h1></center>
  </body>`);
});

var listener = app.listen(process.env.PORT || 2000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

// Uptime pinger
const URL = "https://gang-1-2y8u.onrender.com";
const INTERVAL = 5 * 1000;

function pingSite() {
  https.get(URL, (res) => {
    console.log(`[UPTIME PINGER] Pinged ${URL} - Status ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[UPTIME PINGER] Error pinging ${URL}: ${err.message}`);
  });
}

// Webhook config
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1391196349285928970/o8yQJPARF4N9XGBXMlFzMvz61NjXSkYfyENhogpYC94eJlBWKc0B61A6I_KfrqG_nExD';
const WEBHOOK_URL1 = 'https://discord.com/api/webhooks/1386448751010512978/-MVcDisQxGgcHoO2JzUes-_eG-O1Cz4OVo9dxX13xuGMu6rvlXH0yF5xWZBHcDlf04ud';
const ALERT_CHANNEL_ID = '1390905960503054439';
const WEBHOOK_CHECK_INTERVAL = 5 * 1000;
const USER_ID_TO_DM = '1111284502396944424';

let stopSpam = false; // Flag to stop spam when user responds

async function sendSpamDMs(user, messageText) {
  console.log('Starting DM spam to user...');
  stopSpam = false; // reset stop flag before starting spam

  for (let i = 0; i < 1000; i++) { // high number to spam until stopped
    if (stopSpam) {
      console.log('User responded, stopping DM spam.');
      break;
    }
    await user.send(`${messageText}\n\n*Reply here to stop these messages.*`);
    console.log(`Sent DM #${i + 1}`);
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function checkWebhook(url, webhookLabel) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 404) {
      const channel = await client.channels.fetch(ALERT_CHANNEL_ID).catch(() => null);
      if (channel) {
        await channel.send({
          content: `⚠️ **Webhook Deleted Alert** ⚠️\n\nThe webhook at ${url} (${webhookLabel}) has been deleted or is no longer accessible!`
        });
        console.log(`Webhook deletion alert sent to channel for ${webhookLabel}!`);
      }

      const user = await client.users.fetch(USER_ID_TO_DM).catch(() => null);
      if (user) {
        await sendSpamDMs(user, `⚠️ **Webhook Deleted Alert** ⚠️\n\nThe webhook at ${url} (${webhookLabel}) has been deleted or is no longer accessible!`);
      } else {
        console.error(`Failed to find user with ID ${USER_ID_TO_DM}`);
      }

      return false;
    } else if (response.status === 200) {
      console.log(`Webhook (${webhookLabel}) is still active`);
      return true;
    }
  } catch (error) {
    console.error(`Error checking webhook (${webhookLabel}):`, error);
    return false;
  }
}

// Discord events
client.on("ready", () => {
  console.log(`${client.user.username} ready!`);
  client.user.setActivity(`Z4444`, { type: "STREAMING", url: "https://www.youtube.com/watch?v=x1qUmtpVQkg&t=24s" });
  
  // Voice channel connection
  setInterval(() => {
    const channelId = "1349220931012395071";
    const channel = client.channels.cache.get(channelId);
    if (!channel) return console.log("لم يتم العثور على القناة الصوتية!");

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: true
    });

    console.log("انضم البوت بحالة self-muted/self-deaf!");
  }, 5000);

  // Uptime pinger
  pingSite();
  setInterval(pingSite, INTERVAL);

  // Start webhook monitoring
  checkWebhook(WEBHOOK_URL, 'Webhook 1');
  setInterval(() => checkWebhook(WEBHOOK_URL, 'Webhook 1'), WEBHOOK_CHECK_INTERVAL);

  checkWebhook(WEBHOOK_URL1, 'Webhook 2');
  setInterval(() => checkWebhook(WEBHOOK_URL1, 'Webhook 2'), WEBHOOK_CHECK_INTERVAL);
});

// Listen for user DM to stop spam
client.on('messageCreate', async (message) => {
  if (
    message.channel.type === 'DM' &&
    message.author.id === USER_ID_TO_DM &&
    !message.author.bot
  ) {
    stopSpam = true;
    await message.channel.send('✅ Received your response. Stopping alerts.');
    console.log('Received response from user, spam stopped.');
  }
});

// Anti-links system
client.on('messageCreate', message => {
  if (message.author.bot) return;
  
  // Check for various link types
  if (message.content.includes("discord.gg/") || 
      message.content.includes("https://") || 
      message.content.includes(".com")) {
    if (message.channel.type === "DM") return;
    if (message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
    
    message.delete();
    message.channel.send(`${message.author} يمنع نشر روابط`);
  }

  // Special responses
  const specialResponses = {
    "panel": "Contact <@1144986830513639485> to purchase the painting <a:BlackV_AGK:1184941709264687114>",
    "اللوحة": "تواصل مع <@1144986830513639485> من اجل شراء اللوحة <a:BlackV_AGK:1184941709264687114>",
    "hack": "Contact <@1144986830513639485> to purchase the hack <a:BlackV_AGK:1184941709264687114>",
    "hello": "hi bro <:emoji_2691:1211391957478412328>",
    "hi": "hello bro <:emoji_2691:1211391957478412328>",
    "السلام عليكم": "وعليكم السلام ورحمة الله وبركاته <:emoji_2691:1211391957478412328>"
  };

  for (const [trigger, response] of Object.entries(specialResponses)) {
    if (message.content.includes(trigger)) {
      if (message.channel.type === "DM") return;
      if (message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
      message.channel.send(`${message.author} ${response}`);
      break;
    }
  }
});

// Auto-reactions in specific channels
const reactionChannels = {
  "1179388947827269813": "<a:JSP69:1184941579752972389>",
  "1202726284141273150": [
    "<:DjexoXcube:1205806393064685598>",
    "<:1043136259767406652:1205806847055896586>",
    "<a:emoji_20:1205915564485115965>",
    "<a:funnyanimalscrazy:1205807509131104307>",
    "<a:35:1205807476583301220>",
    "<:52:1205807359772065802>",
    "<a:Stfu:1184941604914593944>",
    "<a:EVs_02catrageuwu:1205806576556834876>",
    "<:unknown1:1205917172992581714>",
    "<:Swimox:1205917302655160361>",
    "<a:JBF_actingSusNotMeOwO:1205807384623317023>"
  ],
  "1193343424619876362": "<a:emoji_4:1205807801784336384>",
  "1183104673180307616": "<a:emoji_5:1205807783031738378>"
};

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  for (const [channelId, reactions] of Object.entries(reactionChannels)) {
    if (message.channel.id === channelId) {
      if (Array.isArray(reactions)) {
        for (const reaction of reactions) {
          await message.react(reaction).catch(console.error);
        }
      } else {
        await message.react(reactions).catch(console.error);
      }
    }
  }
});

// Question command
const questions = [
  "**ايش اسمك؟**",
  "**كم عمرك؟؟**",
  "**من فين انت؟؟**",
  "**ايش تسوي في الحياة؟ بعيدا عن الديسكورد**",
  "**كم صارلك داخل السيرفر؟؟**",
  "**هل عندك فكرة علي البرمجة؟**",
  "**ايش اختصاصك؟**",
  "**ايش تبي تصير في المستقبل؟**",
  "**هل تعطي الثقة في احد؟**",
  "**هل عندك فكرة علي مالك السيرفر؟**",
  "**كم صارلك في الديسكورد؟**"
];

client.on('messageCreate', message => {
  if (message.content.startsWith(prefix + "qst")) {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    const embed = new MessageEmbed()
      .setDescription(randomQuestion);
    message.channel.send({ embeds: [embed] });
  }
});

// Help command
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;
  if (message.content === prefix + 'help') {
    const embed = new MessageEmbed()
      .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true }))
      .setDescription(`
      > ${prefix}\`qst\` : **He gives you a question in Arabic** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`setname\` : **Change the name of the person you want** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`here\` : **Montion here** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`everyone\` : **Montion everyone** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`dice\` : **It gives you a number from 0 to 100** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`block images\` : **Block images at all channel** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`allow images\` : **Allow images at all channel** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`rules\` : **It gives you the server rules** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`waren\` : **To send a warning to a person in private** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`send\` : **To send a message to a person in private** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`ban\` : **To ban the member from the server** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`clear\` : **Clears the specified amount of messages in the channel** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`hide\` : **To hide the channel** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`show\` : **To show the channel** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`repeat\` : **To repeat the words** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`server\` : **To give you information about the server** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`user\` : **To give you information about the user** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`ping\` : **To give you information about the ping bot** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`link\` : **To give you the server link** <a:BlackV_AGK:1184941709264687114>
      > ${prefix}\`icon\` : **To give you the server icon** <a:BlackV_AGK:1184941709264687114>
      `)
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setColor('BLACK');
    await message.channel.send({ embeds: [embed] });
  }
});

// Set nickname command
client.on('messageCreate', message => {
  if (message.content.startsWith(prefix + "setname")) {
    if (!message.member.permissions.has(Permissions.FLAGS.CHANGE_NICKNAME)) {
      return message.reply("ليس لديك إذن");
    }
    
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    let member = message.mentions.users.first() || message.guild.members.cache.get(args[1]) || 
                 message.guild.members.cache.find(r => r.user.username === args[1]);
    
    if (!member) {
      return message.reply(`**__اكتب كذا عشان يتغير : ${prefix}تغير @منشنه __**`);
    }
    
    let nick = message.content.split(" ").slice(2).join(" ");
    let guildMember = message.guild.members.cache.get(member.id);
    
    if (!nick) {
      guildMember.setNickname(member.username);
    } else {
      guildMember.setNickname(nick);
    }
    
    const oldNick = guildMember.nickname || member.username;
    const embed = new MessageEmbed()
      .setAuthor(message.member.user.username, message.member.user.avatarURL({ dynamic: true }))
      .setThumbnail(message.member.user.avatarURL({ dynamic: true }))
      .setTitle("الاسم المستعار الجديد:")
      .addField(`الشخص الذي تم تغير اسمه`, `${member}`, true)
      .addField(`القديم:`, `**${oldNick}**`, true)
      .addField(`الجديد:`, `**${nick}**`, true)
      .setFooter(message.member.user.username, message.member.user.avatarURL({ dynamic: true }))
      .setTimestamp();
      
    message.channel.send({ embeds: [embed] });
  }
});

// Here and everyone commands
client.on('messageCreate', message => {
  if (message.content.startsWith(prefix + 'here') || message.content.startsWith(prefix + 'everyone')) {
    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return;
    if (message.author.bot) return;
    
    const mention = message.content.startsWith(prefix + 'here') ? '@here' : '@everyone';
    message.channel.send(mention);
  }
});

// Dice command
client.on('messageCreate', message => {
  if (message.content === prefix + "dice") {
    if (message.author.bot) return;
    if (message.channel.type === "DM") return;
    
    const numbers = Array.from({length: 101}, (_, i) => i.toString());
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    message.channel.send(randomNumber);
  }
});

// Block/allow images commands
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + 'block images') || message.content.startsWith(prefix + 'allow images')) {
    if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
      return message.channel.send(`** ليس لديك صلاحية لإستعمال الأمر ! 🙄 **`);
    }
    
    const allow = message.content.startsWith(prefix + 'allow images');
    let channel = message.mentions.channels.first();
    let channel_find = message.guild.channels.cache.find(ch => ch.id == channel);
    
    if (!channel) channel_find = message.channel;
    if (!channel_find) return;
    
    channel_find.permissionOverwrites.edit(message.guild.id, {
      ATTACH_FILES: allow
    });
    
    message.channel.send(`\n🌌 | **تم ${allow ? 'سماح' : 'منع'} الصور بـ**<#${channel_find.id}>\n`);
  }
});

// Message delete log
const logmsg = "1390908054954053715";
client.on("messageDelete", message => {
  if (message.content && message.content.length > 0) {
    let embed = new MessageEmbed()
      .setTitle('Message Delete')
      .setDescription(`Message : ${message.content}\n \nBy : ${message.author}`)
      .setColor(`BLACK`)
      .setTimestamp()
      .setFooter(`Log messages | (name server) `);
    client.channels.cache.get(logmsg).send({ embeds: [embed] });
  }
});

// Rules command
client.on('messageCreate', message => {
  if (message.content.startsWith(prefix + "rules")) {
    const embed = new MessageEmbed()
      .setTitle(`قوانين سيرفر ${message.guild.name}`)
      .setDescription(`
      **- 𝐆𝐀𝐍𝐆 𝐗 𝐂𝐇𝐄𝐀𝐓 Rules :  
      English 

      1- Respect all server members and not harass them in any way 

      2- It is forbidden to insult and curse in all its forms 

      3- It is forbidden to buy or sell inside the server 

      4- It is forbidden to talk about hacking in all its forms 

      5- It is forbidden from physical organic materials, recharging (recharging gems -  codes - credit - nitro ...) 

      6- Avoid spam in chat rooms 

      7- It is forbidden to publish links to other servers in the public chat 

      8- Do not interfere in management decisions and do not assume the role of  supervisors 

      9- It is forbidden to ask for equal ranks 

      10- Any impersonation of the supervisors is prohibited, leading to permanent  expulsion from the server 

      11- It is forbidden to mention the names of other servers or the name of any other YouTuber in bad terms, as respect is a must 

      12- It is forbidden to trade inside the server in all its forms 

      13- A source of annoyance to the members 

      14- The accumulation of warnings leads to banning from the server 


      Arabic 

      1- احترام أعضاء السرفر جميعا و عدم مضايقتهم بأي شكل من الأشكال 

      2- ممنوع السب والشتم بجميع انواعه 

      3-ممنوع البيع و شراء داخل السيرفر 

      4- ممنوع الحديث عن الهكر بجميع اشكاله 

      5- ممنوع طلب اشياء مادية ومعنوية 

      6- تجنب السبام في الشات 

      7- ممنوع نشر روابط سرفرات اخرى في الشات العام 

      8- لا تتدخل في قرارات الإدارة ولا تتقمص دور المشرفين 

      9- ممنوع طلب الرتب تساويها 

      10-ممنوع أي انتحال لشخصية المشرفين المشرفين إلى الطرد الدائم من السيرفر 

      11- ممنوع ذكر أسامي سرفرات أخرى أو اسم اي يوتوبر آخر بالسوء فالإحترام واجب 

      12- ممنوع التجارة داخل السرفر بجميع أشكالها 

      13- مصدر إزعاج للأعضاء  **
      `)
      .setColor("PURPLE")
      .setThumbnail(message.guild.iconURL({ dynamic: true }));
      
    message.channel.send({ embeds: [embed] });
  }
});

// Warning command
client.on('messageCreate', message => {
  if (message.content.startsWith(prefix + "waren")) {
    if (!message.member.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) {
      return message.channel.send(`>>> \`\`\`You Don't have the permission `);
    }
    
    let args = message.content.split(" ").slice(1);
    let user = message.mentions.users.first();
    let reason = args.slice(1).join(' ');
    
    if (!user) {
      const embed = new MessageEmbed()
        .setColor('black')
        .setTimestamp()
        .addField("**لأرسال انذار عليك .. ** ", ` **منشن الشخص** `);
      return message.channel.send({ embeds: [embed] });
    }
    
    if (!reason) {
      const embed = new MessageEmbed()
        .setColor('black')
        .setTimestamp()
        .addField("**لأرسال انذار عليك..**  ", `ارفق سبب الانذار مع الامر`);
      return message.channel.send({ embeds: [embed] });
    }
    
    const embed = new MessageEmbed()
      .setColor('black')
      .setTimestamp()
      .addField(" تم ", ` **تم ارسال الانذار ✅️** `);
    message.channel.send({ embeds: [embed] });
    
    const embed1 = new MessageEmbed()
      .setColor('#0083ff')
      .setTimestamp()
      .addField("لقد تم انذارك", `السبب : **${reason}**`)
      .setFooter(`انذار بواسطة ${message.author.tag}.`);
      
    user.send({ embeds: [embed1] });
    message.delete();
  }
});

// Send message command
client.on('messageCreate', message => {
  if (message.content.startsWith(prefix + "send")) {
    if (!message.member.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) {
      return message.channel.send(`>>> \`\`\`You Don't have the permission `);
    }
    
    let args = message.content.split(" ").slice(1);
    let user = message.mentions.users.first();
    let reason = args.slice(1).join(' ');
    
    if (!user) {
      const embed = new MessageEmbed()
        .setColor('black')
        .setTimestamp()
        .addField("**لأرسال انذار عليك .. ** ", ` **منشن الشخص** `);
      return message.channel.send({ embeds: [embed] });
    }
    
    if (!reason) {
      const embed = new MessageEmbed()
        .setColor('black')
        .setTimestamp()
        .addField("**لأرسال انذار عليك..**  ", `ارفق سبب الانذار مع الامر`);
      return message.channel.send({ embeds: [embed] });
    }
    
    const embed = new MessageEmbed()
      .setColor('black')
      .setTimestamp()
      .addField(" تم ", ` **تم الرسالة ✅️** `);
    message.channel.send({ embeds: [embed] });
    
    const embed1 = new MessageEmbed()
      .setColor('#ff00f7')
      .setThumbnail('https://media.discordapp.net/attachments/1145020936739897374/1211442945631453205/Y12XXXX.png?ex=65ee3729&is=65dbc229&hm=d2ad288f408b3c2d97c399505b5f0728465137ec20dba7df27a930c1a5415bb2&=&format=webp&quality=lossless&width=559&height=559')
      .setTimestamp()
      .addField("لقد تم ارسال اليك رسالة من قبل ", `${message.author.tag}.\n\n**${reason}**`);
      
    user.send({ embeds: [embed1] });
    message.delete();
  }
});

// Ban command
client.on('messageCreate', async message => {
  if (!message.guild) return;
  if (message.content.startsWith(prefix + 'ban')) {
    if (!message.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) {
      return message.reply("** ليس لديك إذن 'BAN_MEMBERS' **");
    }
    
    if (!message.guild.me.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) {
      return message.reply("** ليس لدي إذن 'BAN_MEMBERS' **");
    }
    
    const user = message.mentions.users.first();
    
    if (user) {
      const member = message.guild.members.cache.get(user.id);
      
      if (member) {
        try {
          await member.ban({ reason: 'They were bad!' });
          const embed = new MessageEmbed()
            .setColor("0F750E")
            .setTitle(` تم الحظر بنجاح`);
          message.channel.send({ embeds: [embed] });
        } catch (err) {
          message.reply('لم أتمكن من حظر العضو');
          console.error(err);
        }
      } else {
        message.reply("هذا المستخدم ليس في هذا السيرفر");
      }
    } else {
      const embed = new MessageEmbed()
        .setColor("FF0000")
        .setTitle("`` لم تذكر المستخدم لحظره!`` ❌");
      message.channel.send({ embeds: [embed] });
    }
  }
});

// Clear command
client.on('messageCreate', async message => {
  let command = message.content.toLowerCase().split(" ")[0];
  command = command.slice(prefix.length);
  
  if (["clear", "مسح", "امسح"].includes(command)) {
    await message.delete();
    
    if (!message.channel.guild) return message.reply(`** This Command For Servers Only**`);
    if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      return message.channel.send(`> ** You don't have perms :x:**`);
    }
    
    if (!message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      return message.channel.send(`> ** I don't have perms :x:**`);
    }
    
    let args = message.content.split(" ").slice(1);
    let messagecount = parseInt(args[0]) || 100;
    
    if (messagecount > 100) {
      const embed = new MessageEmbed()
        .setDescription(`\`\`\`js\ni cant delete more than 100 messages \n\`\`\``)
        .setColor(`#c000fa`);
      return message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete(), 5000));
    }
    
    try {
      const messages = await message.channel.messages.fetch({ limit: messagecount });
      await message.channel.bulkDelete(messages);
      
      const embed = new MessageEmbed()
        .setDescription(`\`\`\`js\n${messages.size} messages cleared\n\`\`\``)
        .setColor(`#c000fa`);
        
      message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete(), 5000));
    } catch (err) {
      console.error(err);
    }
  }
});

// Hide/show channel commands
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + 'hide') || message.content.startsWith(prefix + 'show')) {
    if (message.author.bot) return;
    if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
      return message.react('❌');
    }
    
    if (!message.channel.guild) return;
    const show = message.content.startsWith(prefix + 'show');
    
    await message.channel.permissionOverwrites.edit(message.guild.id, {
      VIEW_CHANNEL: show
    });
    
    message.react('✅').catch(err => console.log(`No perms to react`));
  }
});

// Repeat command
client.on('messageCreate', message => {
  if (message.content.startsWith(prefix + "repeat")) {
    message.delete();
    let args = message.content.split(" ").slice(1).join(" ");
    
    const embed = new MessageEmbed()
      .setColor(`purple`)
      .setThumbnail('https://media.discordapp.net/attachments/1145020936739897374/1211442945631453205/Y12XXXX.png?ex=65ee3729&is=65dbc229&hm=d2ad288f408b3c2d97c399505b5f0728465137ec20dba7df27a930c1a5415bb2&=&format=webp&quality=lossless&width=559&height=559')
      .setDescription(args);
      
    message.channel.send({ embeds: [embed] });
  }
});

// Server info command
client.on('messageCreate', (message) => {
  if (!message.guild || message.author.bot) return;
  const command = message.content.split(" ")[0];
  
  if (command == prefix + "server") {
    const text = message.guild.channels.cache.filter((r) => r.type === "GUILD_TEXT").size;
    const voice = message.guild.channels.cache.filter((r) => r.type === "GUILD_VOICE").size;
    const online = message.guild.members.cache.filter((m) => m.presence?.status === "online").size;
    const idle = message.guild.members.cache.filter((m) => m.presence?.status === "idle").size;
    const dnd = message.guild.members.cache.filter((m) => m.presence?.status === "dnd").size;
    
    const embed = new MessageEmbed()
      .setAuthor(message.guild.name, message.guild.iconURL({ format: "png", dynamic: true }))
      .setThumbnail(message.guild.iconURL({ format: "png", dynamic: true }))
      .setColor("black")
      .addFields(
        { name: `✨ Server Name`, value: `${message.guild.name}`, inline: false },
        { name: `👑 Owner`, value: `<@1144986830513639485>`, inline: false },
        { name: `🆔 Server ID`, value: `${message.guild.id}`, inline: false },
        { name: `📆 Created At`, value: `**<t:${parseInt(message.guild.createdAt / 1000)}:R> **`, inline: false },
        { name: `💼 Roles (${message.guild.roles.cache.size})`, value: `­-`, inline: false },
        { name: `👥 Members (${message.guild.memberCount})`, value: `**${online + idle + dnd}** Online 🟢\n**${message.guild.premiumSubscriptionCount.toString()}** Boosts ✨`, inline: false },
        { name: `💬 Rooms (${text + voice})`, value: `**${text}** Text 📄 | **${voice}** Voice 🎤`, inline: false }
      )
      .setFooter(`Made By: 'Y12`, `https://cdn.discordapp.com/attachments/1074291310032326688/1074301429960953906/unknown.png`);
      
    message.channel.send({ embeds: [embed] }).catch(() => {});
  }
});

// User info command
client.on('messageCreate', (message) => {
  if (!message.guild || message.author.bot) return;
  const args = message.content.split(" ");
  const command = args[0];
  
  if (command == prefix + "user") {
    let mem = message.mentions.members.first();
    if (args[1] && !args[1].includes("<@")) {
      mem = message.guild.members.cache.get(args[1]);
    }
    
    if (!mem || !args[1]) {
      const embed = new MessageEmbed()
        .setColor("black")
        .addFields(
          { name: `**🪪 User Name**`, value: message.author.username, inline: false },
          { name: `**🆔 User ID**`, value: message.author.id, inline: false },
          { name: `**✨ User Discriminator**`, value: message.author.discriminator, inline: false },
          { name: "**🛬 Joined Discord:**", value: `** <t:${parseInt(message.author.createdAt / 1000)}:R> **`, inline: false },
          { name: "**🛬 Joined Server:**", value: `** <t:${parseInt(message.guild.members.cache.get(message.author.id).joinedAt / 1000)}:R> **`, inline: false }
        )
        .setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
        .setThumbnail(message.author.avatarURL({ dynamic: true }))
        .setFooter(`Made By: Y12X  `, `https://cdn.discordapp.com/attachments/1074291310032326688/1074301429960953906/unknown.png`);
        
      message.reply({ embeds: [embed] }).catch(() => {});
    } else {
      const embed = new MessageEmbed()
        .setColor("purple")
        .addFields(
          { name: `**🪪 User Name**`, value: mem.user.username, inline: false },
          { name: `**🆔 User ID**`, value: mem.id, inline: false },
          { name: `**✨ User Discriminator**`, value: mem.user.discriminator, inline: false },
          { name: "**🛬 Joined Discord:**", value: `** <t:${parseInt(mem.user.createdAt / 1000)}:R> **`, inline: false },
          { name: "**🛬 Joined Server:**", value: `** <t:${parseInt(message.guild.members.cache.get(mem.id).joinedAt / 1000)}:R> **`, inline: false }
        )
        .setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
        .setThumbnail(mem.user.avatarURL({ dynamic: true }))
        .setFooter(`Made By: Y12`, `https://cdn.discordapp.com/attachments/1074291310032326688/1074301429960953906/unknown.png`);
        
      message.reply({ embeds: [embed] }).catch(() => {});
    }
  }
});

// Ping command
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  const command = message.content.split(" ")[0];
  
  if (command == prefix + "ping") {
    const msg = Date.now() - message.createdTimestamp;
    const api = Math.round(client.ws.ping);
    
    let states = "🟢 Excellent";
    let states2 = "🟢 Excellent";
    if (Number(msg) > 70) states = "🟢 Good";
    if (Number(msg) > 170) states = "🟡 Not Bad";
    if (Number(msg) > 350) states = "🔴 Soo Bad";
    if (Number(api) > 70) states2 = "🟢 Good";
    if (Number(api) > 170) states2 = "🟡 Not Bad";
    if (Number(api) > 350) states2 = "🔴 Soo Bad";
    
    const embed = new MessageEmbed()
      .setAuthor(client.user.username, client.user.avatarURL({ format: 'png' }))
      .addField("**Time Taken:**", msg + " ms 📶 | " + states, true)
      .addField("**WebSocket:**", api + " ms 📶 | " + states2, true)
      .setFooter(`Made By: 'Y12`, `https://cdn.discordapp.com/attachments/1074291310032326688/1074301429960953906/unknown.png`)
      .setTimestamp();
      
    message.channel.send({ embeds: [embed] }).catch(() => {});
  }
});

// Games commands
const gameData = {
  "اسرع": {
    questions: ["زومبي","قسطنطينة","حبيبي والله","صراع","مشروع","مثلث","رفرف","الشعر","خنق","لقب","إخفاء","بائع","ثؤلول","فينوس","سلالة","برميل","حب","معدن","تمام","كبسولة","الخيل"],
    time: 15000
  },
  "فكك": {
    questions: ["زومبي","قسطنطينة","حبيبي والله","صراع","مشروع","مثلث","رفرف","الشعر","خنق","لقب","إخفاء","بائع","ثؤلول","فينوس","سلالة","برميل","حب","معدن","تمام","كبسولة","الخيل"],
    answers: ["ز و م ب ي","ق س ط ن ط ي ن ة","ح ب ي ب ي و ا ل ل ه","ص ر ا ع","م ش ر و ع","م ث ل ث","ر ف ر ف","ا ل ش ع ر","خ ن ق","ل ق ب","إ خ ف ا ء","ب ا ئ ع","ث ؤ ل و ل","ف ي ن و س","س ل ا ل ة","ب ر م ي ل","ح ب","م ع د ن","ت م ا م","ك ب س و ل ة","ا ل خ ي ل"],
    time: 15000
  },
  "ركب": {
    questions: ["ز و م ب ي","ق س ط ن ط ي ن ة","ح ب ي ب ي و ا ل ل ه","ص ر ا ع","م ش ر و ع","م ث ل ث","ر ف ر ف","ا ل ش ع ر","خ ن ق","ل ق ب","إ خ ف ا ء","ب ا ئ ع","ث ؤ ل و ل","ف ي ن و س","س ل ا ل ة","ب ر م ي ل","ح ب","م ع د ن","ت م ا م","ك ب س و ل ة","ا ل خ ي ل"],
    answers: ["زومبي","قسطنطينة","حبيبي والله","صراع","مشروع","مثلث","رفرف","الشعر","خنق","لقب","إخفاء","بائع","ثؤلول","فينوس","سلالة","برميل","حب","معدن","تمام","كبسولة","الخيل"],
    time: 15000
  },
  "اعلام": {
    images: ["https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Flag_of_Iraq.svg/560px-Flag_of_Iraq.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Algeria.svg/560px-Flag_of_Algeria.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Flag_of_Syria.svg/560px-Flag_of_Syria.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Flag_of_Yemen.svg/560px-Flag_of_Yemen.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Flag_of_Yemen.svg/560px-Flag_of_Yemen.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Flag_of_Lebanon.svg/560px-Flag_of_Lebanon.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_Egypt.svg/560px-Flag_of_Egypt.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_United_Arab_Emirates.svg/560px-Flag_of_the_United_Arab_Emirates.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_People%27s_Republic_of_China.svg/560px-Flag_of_the_People%27s_Republic_of_China.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/560px-Flag_of_France.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Flag_of_Germany.svg/560px-Flag_of_Germany.svg.png","https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Russia.svg/560px-Flag_of_Russia.svg.png","https://media.discordapp.net/attachments/1011820688987914242/1057873633294422156/jp.png","https://media.discordapp.net/attachments/1011820688987914242/1057873632921124955/pt.png","https://media.discordapp.net/attachments/1011820688987914242/1057873631390208020/hr.png","https://media.discordapp.net/attachments/1011820688987914242/1057873632040333352/vn.png","https://media.discordapp.net/attachments/1011820688987914242/1057873632526864464/tw.png"],
    answers: ["العراق","الجزائر","سوريا","اليمن","لبنان","تركيا","مصر","الإمارات","الصين","فرنسا","المانيا","روسيا","اليابان","البرتغال","كرواتيا","فيتنام","تايوان"],
    time: 15000
  },
  "لغز": {
    questions: ["شيء موجود في السماء إذا أضفت إليه حرفا أصبح في الأرض؟","ما هو الشيء الذي يوصلك من بيتك إلى عملك دون أن يتحرك؟","تاجر من التجار إذا اقتلعنا عينه طار. فمن هو؟","ما هو الشيء الذي ترميه كلما احتجت إليه؟","يسير بلا رجلين و لا يدخل إلا بالأذنين ما هو؟","ما هو الشي الذي يكتب و لا يقر؟","من هو الحيوان الذي يحك إذنه بأنفه؟","ما هو الشي الذي كلما كثر لدينا غلا و كلما قل رخص؟","ما هي التي تأكل و لا تشبع؟","ما هو الشي الذي كلما أخذت منه يكبر ؟","ما هو الشي الذي يوجد في وسط باريس؟","ما هو البيت الذي ليس فيه أبواب و لا نوافذ؟","أين يقع البحر الذي لا يوجد به ماء؟","ماهو الشي الذي ينبض بلا قلب؟","أخت خالك و ليست خالتك من تكون ؟","شيء يحتوي على كلمات، إلا أنه لا يتكلم أبدًا؟","ما هو أمامك دائمًا ولكنك لا تستطيع رؤيته؟","ما الذي يرتفع ولكنه لا ينزل؟"],
    answers: ["نجم","الطريق","عطار","شبكة الصيد","الصوت","القلم","الفيل","العقل","النار","الحفرة","راء","بيت الشعر","في الخريطة","الساعه","أمك","كتاب","المستقبل","العمر"],
    time: 15000
  }
};

client.on('messageCreate', async message => {
  if (message.content === prefix + "games") {
    const embed = new MessageEmbed()
      .setAuthor("Commands:", client.user.avatarURL())
      .setThumbnail(message.author.avatarURL())
      .setColor("BLUE")
      .addField(`${prefix}اسرع`,`لعبة سرعة كتابة الكلمات`,true)
      .addField(`${prefix}فكك`,`لعبة تفكيك الكلمات`,true)
      .addField(`${prefix}لغز`,`لعبة الألغاز`,true)
      .addField(`${prefix}ركب`,"لعبة تركيب الكلمات",true)
      .addField(`${prefix}اعلام`,"لعبة اعلام الدول ",true);
      
    message.channel.send({ embeds: [embed] });
  }

  for (const [game, data] of Object.entries(gameData)) {
    if (message.content === prefix + game) {
      const randomIndex = Math.floor(Math.random() * data.questions.length);
      const question = data.questions[randomIndex];
      const correctAnswer = data.answers ? data.answers[randomIndex] : question;
      
      const embed = new MessageEmbed()
        .setAuthor(client.user.username, client.user.avatarURL())
        .setColor("BLUE")
        .setFooter(`لديك ${data.time/1000} ثانية للاجابة`)
        .setTimestamp();
        
      if (game === "اعلام") {
        embed.setImage(question);
      } else {
        embed.setDescription(`\`\`\`${question}\`\`\``);
      }
      
      message.channel.send({ embeds: [embed] });
      
      const filter = m => m.content.includes(correctAnswer);
      const collector = message.channel.createMessageCollector({ 
        filter, 
        max: 1, 
        time: data.time 
      });
      
      collector.on('collect', collected => {
        const embed = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(`✅ | <@${collected.author.id}> الأجابة صحيحة!`);
        message.channel.send({ embeds: [embed] });
      });
      
      collector.on('end', collected => {
        if (collected.size === 0) {
          const embed = new MessageEmbed()
            .setColor("RED")
            .setDescription(`🕘 | أنتهى الوقت لم تقوم بالاجابة الصحيحة`);
          message.channel.send({ embeds: [embed] });
        }
      });
    }
  }
});

// Server link command
client.on('messageCreate', async message => {
  if (["link", "LINK", "Link"].some(cmd => message.content === prefix + cmd)) {
    const channel = message.guild.channels.cache
      .filter(c => c.permissionsFor(message.guild.me).has(Permissions.FLAGS.CREATE_INSTANT_INVITE))
      .sort((a,b) => a.position - b.position)
      .first();
      
    if (channel) {
      const invite = await channel.createInvite({ maxAge: 0, unique: false });
      message.channel.send(`> **${message.guild.name} Server Link** \n> ${invite.url}`);
    }
  }
});

// Zajil (pigeon mail) command
client.on('messageCreate', async message => {
  if (message.content == "زاجل") {
    if (message.author.bot || message.channel.type === "DM") return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const mssg = message.content.split(" ").slice(2).join(" ");
    
    if (!args[1] || !mssg) {
      const eee = new MessageEmbed()
        .setDescription(`زاجل [ايدي شخص] الكلام`);
      return message.reply({ embeds: [eee] });
    }
    
    const embed = new MessageEmbed()
      .setDescription(`
**message :**
**${mssg}**
** user :**
<@${args[1]}>`)
      .setTimestamp();
      
    client.channels.cache.get("1390905960503054439").send({ 
      content: `> وصلك زاجل <@${args[1]}>`, 
      embeds: [embed] 
    });
    
    message.reply("تم ارسال الزاجل");
    
    const loggggZijl = new MessageEmbed()
      .setTitle(` Log Zajil :`)
      .setDescription(`
**message :**
**${mssg}**
** user :**
<@${args[1]}>
** author : **
<@${message.author.id}>
`)
      .setFooter(message.guild.name, message.guild.iconURL()) 
      .setTimestamp()
      .setThumbnail('https://cdn.discordapp.com/attachments/957700484678959125/957806283329777734/4160022.png');
      
    client.channels.cache.get("958916172319969330").send({ embeds: [loggggZijl] });
  }
});

// Server icon command
client.on('messageCreate', message => {
  if (["icon", "Icon", "ICON"].some(cmd => message.content === prefix + cmd)) {
    const serverIcon = message.guild.iconURL();
    const embed = new MessageEmbed()
      .setColor(`PURPLE`)
      .setTitle(`${message.guild.name} Server`)
      .setDescription(`[Icon Link](${serverIcon})`)
      .setImage(serverIcon)
      .setTimestamp()
      .setFooter(`Requested by : ${message.author.username}`, message.author.avatarURL());
      
    message.channel.send({ embeds: [embed] });
  }
});

// Login to Discord
client.login("MTQxNDczNTY3MTk4NTQ0Mjg4Ng.Gm432x.AnQs2MMmNqeuBgB5BVEGNjgpCXtY1u0N7Cu6XU");
