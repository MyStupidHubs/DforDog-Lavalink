

module.exports = {
  TOKEN: "",
  language: "ptbr",
  ownerID: ["1004206704994566164", "981743770016055328"], 
  mongodbUri : "mongodb+srv://andre_andrezinh2:2ymwOxtp4Zed6GfE@djfordog.tieovhx.mongodb.net/?retryWrites=true&w=majority",
  spotifyClientId : "d92baed9605a45a39ed7c2a2d960b1c1",
  spotifyClientSecret : "e9b29f6739de4315bc03b6d8a8e93b03",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#1db954",
  customEmoji: true,  // true = use custom emoji IDs from emoji.js, false = use default unicode
  emojiTheme: "redwhite", // active custom emoji theme key in emoji.js
  helpBannerUrl: "https://i.ibb.co/GfTxbJfC/7-edited.png", // Optional: set a direct image URL to show an inline banner in /help
  activityName: " DJ For Dog Musics", 
  activityType: "LISTENING",  // Available activity types : LISTENING , PLAYING
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5,
  showProgressBar: false,  // Show progress bar in track embed
  showVisualizer: false,  // Show visualizer on music card (disabled for low-memory optimization)
  generateSongCard: true,  // custom song card image, if false uses thumbnail
  metadataTag: true,  // If true, always show Song Details even when the card image is present
  // Performance optimizations for low-memory environments (512MB RAM)
  lowMemoryMode: true,  // Enable optimizations for low-memory hosting
  errorLog: "", 
  nodes: [
     {
    name: "DJForDog",
    password: "UHrg5iqJVE0",
    host: "172.96.140.62",
    port: 7793,
    secure: false
    }
  ]
}
