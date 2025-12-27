const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

// Create a new Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Configuration
const config = {
    token: 'MTQxNDczNTY3MTk4NTQ0Mjg4Ng.GvV9tA.iSBDv8TnL7KxhLczYsiicMKWqK3OxQwSmr6h-g', // Replace with your bot token
    voiceChannelId: '1349220931012395071' // Replace with your voice channel ID
};

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    
    // Set streaming status
    client.user.setPresence({
        activities: [{
            name: '帮派猫头鹰 🗾',
            type: ActivityType.Streaming,
            url: 'https://twitch.tv/twitch' // Optional streaming URL
        }],
        status: 'online'
    });
    
    console.log('📺 Streaming status set!');
    
    // Join voice channel
    await joinVoice();
});

// Function to join voice channel
async function joinVoice() {
    try {
        const channel = await client.channels.fetch(config.voiceChannelId);
        
        if (!channel || !channel.isVoiceBased()) {
            console.error('❌ Invalid voice channel!');
            return;
        }

        // Create voice connection
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true, // Bot deafens itself (can't hear others)
            selfMute: false // Bot is not muted (can transmit)
        });

        // Handle connection events
        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log(`✅ Successfully joined voice channel: ${channel.name}`);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.log('⚠️  Disconnected from voice channel. Attempting to reconnect...');
            setTimeout(joinVoice, 5000); // Try to reconnect after 5 seconds
        });

        connection.on('error', error => {
            console.error('❌ Voice connection error:', error);
        });

    } catch (error) {
        console.error('❌ Failed to join voice channel:', error);
        // Try again after 10 seconds if failed
        setTimeout(joinVoice, 10000);
    }
}

// Simple command handler (optional)
client.on('messageCreate', async message => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Simple commands via message
    if (message.content === '!join') {
        await joinVoice();
        message.react('✅');
    }
    
    if (message.content === '!status') {
        client.user.setPresence({
            activities: [{
                name: '帮派猫头鹰',
                type: ActivityType.Streaming,
                url: 'https://twitch.tv/twitch'
            }],
            status: 'online'
        });
        message.react('📺');
    }
    
    if (message.content === '!leave') {
        const guild = message.guild;
        if (guild) {
            const connection = getVoiceConnection(guild.id);
            if (connection) {
                connection.destroy();
                message.react('👋');
            }
        }
    }
});

// Get the voice connection (helper function)
function getVoiceConnection(guildId) {
    return client.voice?.adapters?.get(guildId)?.connection;
}

// Error handling
client.on('error', console.error);
process.on('unhandledRejection', console.error);

// Login to Discord
client.login(config.token);
