

module.exports = {
  TOKEN: "",
  language: "pt",
  ownerID: ["1004206704994566164", "981743770016055328"], 
  mongodbUri : "mongodb+srv://andre_andrezinh2:2ymwOxtp4Zed6GfE@djfordog.tieovhx.mongodb.net/?retryWrites=true&w=majority",
  spotifyClientId : "",
  spotifyClientSecret : "",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#1db954",
  activityName: "YouTube Music", 
  activityType: "LISTENING",  // Available activity types : LISTENING , PLAYING
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5, 
  errorLog: "", 
  nodes: [
     {
      name: "DJforDog",
      password: "2ymwOxtp4Zed6GfE",
      host: "23.80.88.110",
      port:  10796,
      secure: false
     }
  ]
}
