const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "music",
    version: "6.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Kashif Raza",
    description: "Download music from YouTube",
    commandCategory: "media",
    usages: ".music [song name]",
    cooldowns: 5
};

async function playMusicYoutube(query, apikey) {
    try {
        const response = await axios.get(`https://anabot.my.id/api/download/playmusic?query=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apikey)}`, {
            timeout: 60000
        });
        return response.data;
    } catch (error) {
        return error;
    }
}

module.exports.run = async function ({ api, event, args }) {
    const query = args.join(" ");
    const apikey = "freeApikey";
    
    if (!query) {
        return api.sendMessage("❌ Please provide a song name", event.threadID, event.messageID);
    }

    const frames = [
        "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
        "💙▰▰▱▱▱▱▱▱▱▱ 25%",
        "💜▰▰▰▰▱▱▱▱▱▱ 45%",
        "💖▰▰▰▰▰▰▱▱▱▱ 70%",
        "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const searchMsg = await api.sendMessage(`🔍 Searching: ${query}\n\n${frames[0]}`, event.threadID);

    try {
        const data = await playMusicYoutube(query, apikey);
        
        if (!data || !data.success || !data.data || !data.data.result) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ No results found or API error", event.threadID, event.messageID);
        }

        const result = data.data.result;
        const videoUrl = result.urls;
        const metadata = result.metadata;
        const title = metadata.title;
        const author = metadata.channel;
        const thumbnail = metadata.thumbnail;

        await api.editMessage(`🎵 Found: ${title}\n\n${frames[1]}`, searchMsg.messageID, event.threadID);
        await api.editMessage(`🎵 Downloading...\n\n${frames[2]}`, searchMsg.messageID, event.threadID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const mpegPath = path.join(cacheDir, `${Date.now()}.mpeg`);
        const audioPath = path.join(cacheDir, `${Date.now()}.mp3`);

        const response = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
        fs.writeFileSync(mpegPath, Buffer.from(response.data));
        
        // Rename mpeg to mp3
        fs.renameSync(mpegPath, audioPath);

        await api.editMessage(`🎵 Processing...\n\n${frames[3]}`, searchMsg.messageID, event.threadID);
        await api.editMessage(`🎵 Complete!\n\n${frames[4]}`, searchMsg.messageID, event.threadID);

        let thumbPath = null;
        if (thumbnail) {
            try {
                const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
                thumbPath = path.join(cacheDir, `${Date.now()}_thumb.jpg`);
                fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
            } catch (thumbError) {
                console.log("Thumbnail download failed:", thumbError.message);
            }
        }

        if (thumbPath && fs.existsSync(thumbPath)) {
            await api.sendMessage(
                {
                    body: `🎵 ${title}\n📺 ${author}`,
                    attachment: fs.createReadStream(thumbPath)
                },
                event.threadID
            );
        }

        await api.sendMessage(
            {
                body: `🎵 Audio File`,
                attachment: fs.createReadStream(audioPath)
            },
            event.threadID
        );

        // Auto clear cache after sending
        setTimeout(() => {
            try {
                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
                if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
                api.unsendMessage(searchMsg.messageID);
            } catch (err) {
                console.log("Cleanup error:", err);
            }
        }, 5000);

    } catch (error) {
        console.error("Music command error:", error.message);
        try { api.unsendMessage(searchMsg.messageID); } catch(e) {}
        return api.sendMessage("❌ An error occurred: " + error.message, event.threadID, event.messageID);
    }
};
