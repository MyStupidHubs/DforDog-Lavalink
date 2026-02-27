

module.exports = {
  TOKEN: "",
  language: "pt_BR",
  ownerID: ["981743770016055328", ""], 
  mongodbUri : "mongodb+srv://shiva:shiva@discordbot.opd5w.mongodb.net/?retryWrites=true&w=majority",
  spotifyClientId : "d92baed9605a45a39ed7c2a2d960b1c1",
  spotifyClientSecret : "e9b29f6739de4315bc03b6d8a8e93b03",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#1db954",
  activityName: "DJ for Dog Musics", 
  activityType: "LISTENING",  // Available activity types : LISTENING , PLAYING
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5,
  showProgressBar: true,  // Show progress bar in track embed
  showVisualizer: true,  // Show visualizer on music card (disabled for low-memory optimization)
  generateSongCard: true,  // custom song card image, if false uses thumbnail
  // Performance optimizations for low-memory environments (512MB RAM)
  lowMemoryMode: true,  // Enable optimizations for low-memory hosting
  errorLog: "", 
  nodes: [
     {
       name: "DJforDog",
       password: "UHrg5iqJVE0",
       host: "168.222.251.98",
       port: 5380,
       secure: false
    }
  ]
}
