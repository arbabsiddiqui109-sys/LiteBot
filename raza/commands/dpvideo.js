const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

module.exports.config = {
  name: "dpvideo",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Create DP video with song",
  commandCategory: "Media",
  usages: "[song name] - Reply to image",
  prefix: true,
  cooldowns: 20
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply } = event;

  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Kisi image ko reply karo!", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Sirf image reply karo!", threadID, messageID);
  }

  const songName = args.join(" ") || "Tera Ban Jaunga";
  const imageUrl = attachment.url;

  const processingMsg = await api.sendMessage(
    `🎬 *DP Video bana rahi hu...*\n🎵 Song: ${songName}\n⏳ Wait...`,
    threadID
  );

  try {
    const cacheDir = path.join(__dirname, "cache", "dp");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // Download image
    const inputPath = path.join(cacheDir, `bg_${Date.now()}.jpg`);
    const outputPath = path.join(cacheDir, `dp_${Date.now()}.mp4`);
    const audioPath = path.join(cacheDir, `audio_${Date.now()}.m4a`);

    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(inputPath);
    response.data.pipe(writer);
    await new Promise((resolve) => writer.on("finish", resolve));

    // Download song
    try {
      await execPromise(`yt-dlp -f bestaudio -x --audio-format m4a -o "${audioPath}" "ytsearch1:${songName}"`);
    } catch (e) {
      console.log("Song download failed");
    }

    // Templates - Simple colors
    const templates = [
      { name: "Candy 🍬", bg: "pink", text: "white" },
      { name: "Neon 💡", bg: "black", text: "#00ff00" },
      { name: "Romantic 💕", bg: "red", text: "white" },
      { name: "Fire 🔥", bg: "orange", text: "yellow" },
      { name: "Royal 👑", bg: "purple", text: "gold" }
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];

    // SIMPLE FFMPEG COMMAND - No complex filters
    const ffmpegCmd = `ffmpeg -loop 1 -i "${inputPath}" -t 10 ` +
      `-vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,` +
      `drawtext=text='${songName}':fontcolor=${template.text}:fontsize=50:x=(w-text_w)/2:y=100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,` +
      `drawtext=text='${template.name}':fontcolor=${template.text}:fontsize=30:x=(w-text_w)/2:y=180:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,` +
      `drawtext=text='🎵 ${songName}':fontcolor=${template.text}:fontsize=40:x=(w-text_w)/2:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,` +
      `drawtext=text='💝 MISS ALIYA':fontcolor=${template.text}:fontsize=40:x=(w-text_w)/2:y=500:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" ` +
      `-c:v libx264 -preset ultrafast -pix_fmt yuv420p "${outputPath}" -y`;

    await execPromise(ffmpegCmd);

    // Add audio if available
    if (fs.existsSync(audioPath)) {
      const finalOutput = path.join(cacheDir, `final_${Date.now()}.mp4`);
      await execPromise(`ffmpeg -i "${outputPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${finalOutput}" -y`);
      fs.renameSync(finalOutput, outputPath);
    }

    // Send video
    api.unsendMessage(processingMsg.messageID);
    
    api.sendMessage(
      {
        body: `✅ *DP Video Ready!*\n\n🎵 ${songName}\n🎨 ${template.name}\n💝 MISS ALIYA`,
        attachment: fs.createReadStream(outputPath)
      },
      threadID,
      () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      },
      messageID
    );

  } catch (error) {
    console.error(error);
    api.unsendMessage(processingMsg.messageID);
    api.sendMessage("❌ Error: " + error.message, threadID, messageID);
  }
};