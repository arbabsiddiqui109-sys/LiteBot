const axios = require('axios');
const fs = require('fs-extra');
const { PasteClient } = require('pastebin-api');
const path = require('path');

module.exports = {
  config: {
    name: "adc",
    version: "1.0.0",
    description: "Upcode to Pastebin or apply code from link",
    usage: "adc [reply or file name]",
    category: "Admin",
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID, messageReply, type } = event;

    // Handle message reply for code text
    if (type === "message_reply") {
      const text = messageReply.body;
      const fileName = args[0];

      if (!fileName) {
        return send.reply("Please provide a file name to save the code.");
      }

      const urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urlMatch = text.match(urlR);

      if (urlMatch) {
        try {
          const response = await axios.get(urlMatch[0]);
          const data = response.data;
          const filePath = path.join(__dirname, `${fileName}.js`);
          await fs.writeFile(filePath, data, "utf-8");
          return send.reply(`✅ Applied code to ${fileName}.js successfully.`);
        } catch (error) {
          return send.reply(`⚠️ Error applying code: ${error.message}`);
        }
      } else {
        // If it's just text (not a URL), we might want to upload it to Pastebin?
        // Or save it directly. The original logic was a bit mixed.
        // Let's stick to the requested modification which is translation and fitting the bot.
        return send.reply("Please reply to a message containing a code link.");
      }
    }

    // Handle command with file name to upload to Pastebin
    if (args[0]) {
      const fileName = args[0];
      const filePath = path.join(__dirname, `${fileName}.js`);

      if (!fs.existsSync(filePath)) {
        return send.reply(`❎ File ${fileName}.js does not exist.`);
      }

      try {
        const data = await fs.readFile(filePath, "utf-8");
        const client = new PasteClient("P5FuV7J-UfXWFmF4lUTkJbGnbLBbLZJo");

        const url = await client.createPaste({
          code: data,
          expireDate: 'N',
          format: "javascript",
          name: fileName,
          publicity: 1
        });

        const id = url.split('/').pop();
        const rawLink = `https://pastebin.com/raw/${id}`;
        return send.reply(rawLink);
      } catch (error) {
        return send.reply(`⚠️ Error uploading to Pastebin: ${error.message}`);
      }
    }

    return send.reply("❎ Please reply to a message with a code link or provide a file name to upload to Pastebin!");
  }
};
