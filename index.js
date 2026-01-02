// index.js - Complete Discord Music Bot v12
require('dotenv').config();
const { Client, Collection } = require('discord.js');
const express = require('express');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;
const PREFIX = process.env.PREFIX || '!';

// ==================== WEB SERVER ====================
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🎵 Discord Music Bot v12</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 800px; 
          margin: 40px auto; 
          padding: 20px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          text-align: center;
        }
        .container {
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        h1 { 
          color: #fff; 
          margin-bottom: 30px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .commands-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin: 25px 0;
        }
        .command-card {
          background: rgba(255,255,255,0.15);
          padding: 15px;
          border-radius: 10px;
          transition: transform 0.2s;
        }
        .command-card:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.2);
        }
        .command-card h3 {
          margin: 0 0 10px 0;
          color: #4fc3f7;
        }
        .command-card p {
          margin: 5px 0;
          font-size: 14px;
        }
        .status {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          font-size: 14px;
        }
        code {
          background: rgba(0,0,0,0.3);
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          color: #ffcc80;
        }
        .highlight {
          color: #4fc3f7;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎵 Discord Music Bot v12</h1>
        <div class="status">
          <p>🤖 Status: <span class="highlight">Online</span></p>
          <p>⚡ Prefix: <code>${PREFIX}</code></p>
          <p>📊 Version: Discord.js v12 | Node.js ${process.version}</p>
          <p>🎶 Features: Music Playback, Queue System, Playlists</p>
        </div>
        
        <h2>🎵 Music Commands</h2>
        <div class="commands-grid">
          <div class="command-card">
            <h3>${PREFIX}play [song]</h3>
            <p>Play a song from YouTube</p>
            <p><em>Example: ${PREFIX}play despacito</em></p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}skip</h3>
            <p>Skip the current song</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}stop</h3>
            <p>Stop the music and clear queue</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}pause</h3>
            <p>Pause the current song</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}resume</h3>
            <p>Resume paused song</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}queue</h3>
            <p>Show the current queue</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}np</h3>
            <p>Show now playing song</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}volume [1-100]</h3>
            <p>Adjust the volume</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}loop</h3>
            <p>Toggle loop mode</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}shuffle</h3>
            <p>Shuffle the queue</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}search [query]</h3>
            <p>Search for songs</p>
          </div>
          <div class="command-card">
            <h3>${PREFIX}lyrics</h3>
            <p>Get lyrics for current song</p>
          </div>
        </div>
        
        <div class="status">
          <p>🌐 Hosted on Render.com | 🎵 Music Bot v12</p>
          <p>Use <code>${PREFIX}help</code> in Discord for more info</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'Discord.js v12 Music Bot'
  });
});

app.get('/ping', (req, res) => {
  res.json({ ping: 'pong', time: Date.now() });
});

const server = app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log(`🎵 Discord Music Bot v12`);
  console.log(`⚡ Prefix: ${PREFIX}`);
});

// ==================== DISCORD BOT ====================
const client = new Client();

// Queue system
const queues = new Map();
const loopModes = new Map();

// Queue structure for each guild
function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      songs: [],
      volume: 50,
      playing: false,
      connection: null,
      dispatcher: null,
      textChannel: null
    });
  }
  return queues.get(guildId);
}

// ==================== MUSIC FUNCTIONS ====================
async function searchYouTube(query) {
  try {
    const searchResults = await ytsr(query, { limit: 10 });
    return searchResults.items.filter(item => item.type === 'video');
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function getSongInfo(url) {
  try {
    const info = await ytdl.getInfo(url);
    return {
      title: info.videoDetails.title,
      url: info.videoDetails.video_url,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails[0].url,
      requester: null
    };
  } catch (error) {
    console.error('Song info error:', error);
    return null;
  }
}

async function playSong(guildId) {
  const queue = getQueue(guildId);
  if (queue.songs.length === 0) {
    queue.playing = false;
    if (queue.textChannel) {
      queue.textChannel.send('🎵 Queue finished!');
    }
    return;
  }

  const song = queue.songs[0];
  queue.playing = true;

  try {
    const stream = ytdl(song.url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25
    });

    const dispatcher = queue.connection
      .play(stream, { 
        volume: queue.volume / 100,
        bitrate: 'auto'
      })
      .on('finish', () => {
        // Handle loop modes
        if (loopModes.get(guildId) === 'song') {
          // Keep same song
        } else if (loopModes.get(guildId) === 'queue') {
          // Move current song to end
          const currentSong = queue.songs.shift();
          queue.songs.push(currentSong);
        } else {
          // Normal mode - remove song
          queue.songs.shift();
        }
        
        playSong(guildId);
      })
      .on('error', error => {
        console.error('Playback error:', error);
        queue.songs.shift();
        playSong(guildId);
      });

    queue.dispatcher = dispatcher;

    // Update now playing message
    if (queue.textChannel) {
      const embed = {
        color: 0x0099ff,
        title: '🎵 Now Playing',
        description: `**[${song.title}](${song.url})**`,
        fields: [
          {
            name: 'Duration',
            value: formatDuration(song.duration),
            inline: true
          },
          {
            name: 'Requested by',
            value: song.requester || 'Unknown',
            inline: true
          }
        ],
        thumbnail: {
          url: song.thumbnail
        },
        timestamp: new Date()
      };
      
      queue.textChannel.send({ embed });
    }

  } catch (error) {
    console.error('Play error:', error);
    queue.songs.shift();
    playSong(guildId);
  }
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatQueue(guildId, page = 1) {
  const queue = getQueue(guildId);
  if (queue.songs.length === 0) {
    return 'The queue is empty!';
  }

  const itemsPerPage = 10;
  const totalPages = Math.ceil(queue.songs.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const currentSongs = queue.songs.slice(start, end);

  let queueString = `**Total Songs:** ${queue.songs.length} | **Page:** ${page}/${totalPages}\n\n`;
  
  currentSongs.forEach((song, index) => {
    const position = start + index + 1;
    const duration = formatDuration(song.duration);
    queueString += `**${position}.** [${song.title}](${song.url}) - \`${duration}\`\n`;
    if (song.requester) {
      queueString += `   👤 ${song.requester}\n`;
    }
  });

  return queueString;
}

// ==================== COMMAND HANDLERS ====================
async function handlePlay(message, args) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.channel.send('❌ You need to be in a voice channel to play music!');
  }

  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.channel.send('❌ I need permissions to join and speak in your voice channel!');
  }

  const query = args.join(' ');
  if (!query) {
    return message.channel.send('❌ Please provide a song name or URL!');
  }

  const queue = getQueue(message.guild.id);
  queue.textChannel = message.channel;

  // Join voice channel if not already connected
  if (!queue.connection) {
    try {
      queue.connection = await voiceChannel.join();
    } catch (error) {
      console.error('Join error:', error);
      return message.channel.send('❌ Could not join the voice channel!');
    }
  }

  const loadingMsg = await message.channel.send('🔍 Searching for song...');

  try {
    let song;
    
    // Check if it's a YouTube URL
    if (ytdl.validateURL(query)) {
      song = await getSongInfo(query);
    } else {
      // Search for song
      const searchResults = await searchYouTube(query);
      if (searchResults.length === 0) {
        await loadingMsg.edit('❌ No results found!');
        return;
      }
      song = await getSongInfo(searchResults[0].url);
    }

    if (!song) {
      await loadingMsg.edit('❌ Could not get song information!');
      return;
    }

    song.requester = message.author.tag;
    queue.songs.push(song);

    await loadingMsg.edit(`✅ Added **${song.title}** to the queue!`);

    if (!queue.playing) {
      playSong(message.guild.id);
    }

  } catch (error) {
    console.error('Play command error:', error);
    await loadingMsg.edit('❌ An error occurred while searching for the song!');
  }
}

async function handleSkip(message) {
  const queue = getQueue(message.guild.id);
  if (!queue.playing || !queue.dispatcher) {
    return message.channel.send('❌ There is no song playing!');
  }

  queue.dispatcher.end();
  message.channel.send('⏭️ Skipped the current song!');
}

async function handleStop(message) {
  const queue = getQueue(message.guild.id);
  if (!queue.playing) {
    return message.channel.send('❌ There is no song playing!');
  }

  queue.songs = [];
  queue.dispatcher.end();
  message.channel.send('⏹️ Stopped the music and cleared the queue!');
}

async function handlePause(message) {
  const queue = getQueue(message.guild.id);
  if (!queue.playing || !queue.dispatcher) {
    return message.channel.send('❌ There is no song playing!');
  }

  if (queue.dispatcher.paused) {
    return message.channel.send('❌ The song is already paused!');
  }

  queue.dispatcher.pause();
  message.channel.send('⏸️ Paused the music!');
}

async function handleResume(message) {
  const queue = getQueue(message.guild.id);
  if (!queue.playing || !queue.dispatcher) {
    return message.channel.send('❌ There is no song playing!');
  }

  if (!queue.dispatcher.paused) {
    return message.channel.send('❌ The song is not paused!');
  }

  queue.dispatcher.resume();
  message.channel.send('▶️ Resumed the music!');
}

async function handleQueue(message, args) {
  const queue = getQueue(message.guild.id);
  const page = parseInt(args[0]) || 1;

  if (queue.songs.length === 0) {
    return message.channel.send('📭 The queue is empty!');
  }

  const embed = {
    color: 0x0099ff,
    title: '🎵 Music Queue',
    description: formatQueue(message.guild.id, page),
    timestamp: new Date(),
    footer: {
      text: `Use ${PREFIX}queue [page] to view other pages`
    }
  };

  message.channel.send({ embed });
}

async function handleNowPlaying(message) {
  const queue = getQueue(message.guild.id);
  if (queue.songs.length === 0) {
    return message.channel.send('❌ There is no song playing!');
  }

  const song = queue.songs[0];
  const embed = {
    color: 0x0099ff,
    title: '🎵 Now Playing',
    description: `**[${song.title}](${song.url})**`,
    fields: [
      {
        name: 'Duration',
        value: formatDuration(song.duration),
        inline: true
      },
      {
        name: 'Requested by',
        value: song.requester || 'Unknown',
        inline: true
      },
      {
        name: 'Queue',
        value: `${queue.songs.length} song${queue.songs.length === 1 ? '' : 's'}`,
        inline: true
      }
    ],
    thumbnail: {
      url: song.thumbnail
    },
    timestamp: new Date()
  };

  message.channel.send({ embed });
}

async function handleVolume(message, args) {
  const volume = parseInt(args[0]);
  if (isNaN(volume) || volume < 1 || volume > 100) {
    return message.channel.send('❌ Please provide a volume between 1 and 100!');
  }

  const queue = getQueue(message.guild.id);
  queue.volume = volume;

  if (queue.dispatcher) {
    queue.dispatcher.setVolume(volume / 100);
  }

  message.channel.send(`🔊 Volume set to **${volume}%**`);
}

async function handleLoop(message) {
  const currentMode = loopModes.get(message.guild.id) || 'off';
  let newMode;

  switch (currentMode) {
    case 'off':
      newMode = 'song';
      message.channel.send('🔂 Loop mode: **Song**');
      break;
    case 'song':
      newMode = 'queue';
      message.channel.send('🔁 Loop mode: **Queue**');
      break;
    case 'queue':
      newMode = 'off';
      message.channel.send('✅ Loop mode: **Off**');
      break;
  }

  loopModes.set(message.guild.id, newMode);
}

async function handleShuffle(message) {
  const queue = getQueue(message.guild.id);
  if (queue.songs.length < 2) {
    return message.channel.send('❌ Need at least 2 songs in queue to shuffle!');
  }

  // Keep the first song (currently playing) in place
  const currentSong = queue.songs.shift();
  const restOfQueue = queue.songs;
  
  // Fisher-Yates shuffle algorithm
  for (let i = restOfQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [restOfQueue[i], restOfQueue[j]] = [restOfQueue[j], restOfQueue[i]];
  }

  queue.songs = [currentSong, ...restOfQueue];
  message.channel.send('🔀 Shuffled the queue!');
}

async function handleSearch(message, args) {
  const query = args.join(' ');
  if (!query) {
    return message.channel.send('❌ Please provide a search query!');
  }

  const loadingMsg = await message.channel.send('🔍 Searching...');

  try {
    const results = await searchYouTube(query);
    if (results.length === 0) {
      await loadingMsg.edit('❌ No results found!');
      return;
    }

    let searchString = '**Search Results:**\n\n';
    results.slice(0, 10).forEach((result, index) => {
      const duration = result.duration || 'Unknown';
      searchString += `**${index + 1}.** ${result.title} - \`${duration}\`\n`;
    });

    searchString += `\nType \`${PREFIX}play [number]\` to play a song`;

    const embed = {
      color: 0x0099ff,
      description: searchString,
      timestamp: new Date()
    };

    await loadingMsg.edit({ embed });

  } catch (error) {
    console.error('Search error:', error);
    await loadingMsg.edit('❌ An error occurred while searching!');
  }
}

async function handleLyrics(message) {
  const queue = getQueue(message.guild.id);
  if (queue.songs.length === 0) {
    return message.channel.send('❌ There is no song playing!');
  }

  const song = queue.songs[0];
  message.channel.send(`🎵 Lyrics for **${song.title}** are not available in this version.\n*Note: Requires lyrics API integration*`);
}

async function handleHelp(message) {
  const embed = {
    color: 0x0099ff,
    title: '🎵 Music Bot Commands',
    description: `Prefix: \`${PREFIX}\``,
    fields: [
      {
        name: '🎶 Music Commands',
        value: 
          `\`${PREFIX}play [song/url]\` - Play a song\n` +
          `\`${PREFIX}skip\` - Skip current song\n` +
          `\`${PREFIX}stop\` - Stop music\n` +
          `\`${PREFIX}pause\` - Pause music\n` +
          `\`${PREFIX}resume\` - Resume music\n` +
          `\`${PREFIX}queue [page]\` - Show queue\n` +
          `\`${PREFIX}np\` - Now playing\n` +
          `\`${PREFIX}volume [1-100]\` - Set volume\n` +
          `\`${PREFIX}loop\` - Toggle loop\n` +
          `\`${PREFIX}shuffle\` - Shuffle queue\n` +
          `\`${PREFIX}search [query]\` - Search songs\n` +
          `\`${PREFIX}lyrics\` - Get lyrics`
      },
      {
        name: '⚙️ Other Commands',
        value: 
          `\`${PREFIX}help\` - Show this help\n` +
          `\`${PREFIX}ping\` - Check bot latency\n` +
          `\`${PREFIX}invite\` - Get bot invite link`
      }
    ],
    timestamp: new Date(),
    footer: {
      text: 'Discord.js v12 Music Bot'
    }
  };

  message.channel.send({ embed });
}

async function handlePing(message) {
  const msg = await message.channel.send('🏓 Pinging...');
  const latency = msg.createdTimestamp - message.createdTimestamp;
  const apiLatency = Math.round(client.ws.ping);
  
  const embed = {
    color: 0x0099ff,
    title: '🏓 Pong!',
    fields: [
      {
        name: 'Bot Latency',
        value: `${latency}ms`,
        inline: true
      },
      {
        name: 'API Latency',
        value: `${apiLatency}ms`,
        inline: true
      }
    ],
    timestamp: new Date()
  };

  msg.edit({ embed });
}

async function handleInvite(message) {
  const embed = {
    color: 0x0099ff,
    title: '🤖 Invite Me',
    description: '[Click here to invite me to your server](https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=36703232)\n\n**Required Permissions:**\n- Connect to Voice\n- Speak in Voice\n- Send Messages\n- Embed Links\n- Read Message History',
    timestamp: new Date()
  };

  message.channel.send({ embed });
}

// ==================== EVENT HANDLERS ====================
client.once('ready', () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);
  console.log(`🎵 Music Bot v12 Online!`);
  console.log(`⚡ Prefix: ${PREFIX}`);
  
  // Set bot status
  client.user.setActivity(`${PREFIX}help for commands`, { type: 'LISTENING' });
});

client.on('message', async message => {
  // Ignore bot messages and DMs
  if (message.author.bot || !message.guild) return;
  
  // Check for command prefix
  if (!message.content.startsWith(PREFIX)) return;
  
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  try {
    switch (command) {
      case 'play':
      case 'p':
        await handlePlay(message, args);
        break;
        
      case 'skip':
      case 's':
        await handleSkip(message);
        break;
        
      case 'stop':
        await handleStop(message);
        break;
        
      case 'pause':
        await handlePause(message);
        break;
        
      case 'resume':
        await handleResume(message);
        break;
        
      case 'queue':
      case 'q':
        await handleQueue(message, args);
        break;
        
      case 'np':
      case 'nowplaying':
        await handleNowPlaying(message);
        break;
        
      case 'volume':
      case 'vol':
        await handleVolume(message, args);
        break;
        
      case 'loop':
        await handleLoop(message);
        break;
        
      case 'shuffle':
        await handleShuffle(message);
        break;
        
      case 'search':
        await handleSearch(message, args);
        break;
        
      case 'lyrics':
        await handleLyrics(message);
        break;
        
      case 'help':
        await handleHelp(message);
        break;
        
      case 'ping':
        await handlePing(message);
        break;
        
      case 'invite':
        await handleInvite(message);
        break;
        
      default:
        if (parseInt(command) >= 1 && parseInt(command) <= 10) {
          // Handle number selection from search
          const queue = getQueue(message.guild.id);
          if (queue.textChannel) {
            message.channel.send(`*Use ${PREFIX}play [song name] to play a song*`);
          }
        } else {
          message.channel.send(`Unknown command! Use \`${PREFIX}help\` for commands.`);
        }
    }
  } catch (error) {
    console.error(`Command error: ${command}`, error);
    message.channel.send('❌ An error occurred while processing your command!');
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  // Auto leave voice channel if empty
  if (oldState.channel && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
    const queue = getQueue(oldState.guild.id);
    if (queue.connection) {
      queue.songs = [];
      queue.playing = false;
      queue.connection.disconnect();
      queue.connection = null;
      queue.dispatcher = null;
    }
  }
});

client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

// ==================== START BOT ====================
async function startBot() {
  try {
    if (!DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN is not set in environment variables');
    }
    
    console.log('🤖 Starting Discord Music Bot v12...');
    await client.login(DISCORD_TOKEN);
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    console.log('💡 Make sure:');
    console.log('1. DISCORD_TOKEN is set in .env file');
    console.log('2. Bot has been invited to server');
    console.log('3. Bot has voice permissions');
    process.exit(1);
  }
}

// ==================== KEEP-ALIVE FOR RENDER ====================
if (process.env.RENDER) {
  const https = require('https');
  const PING_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  
  setInterval(() => {
    https.get(`${PING_URL}/ping`, (res) => {
      console.log(`🔄 Keep-alive ping: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log('⚠️ Keep-alive ping failed:', err.message);
    });
  }, 4 * 60 * 1000);
}

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
  console.log('🛑 Shutdown signal received');
  
  // Disconnect from all voice channels
  for (const [guildId, queue] of queues) {
    if (queue.connection) {
      queue.connection.disconnect();
    }
  }
  
  if (client) {
    client.destroy();
  }
  
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (error) => {
  console.error('⚠️ Unhandled promise rejection:', error.message);
});

// Start the bot
startBot();
