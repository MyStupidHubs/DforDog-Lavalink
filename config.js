

module.exports = {
  TOKEN: "",
  language: "pt",
  ownerID: ["1004206704994566164", "981743770016055328"], 
  mongodbUri : "mongodb+srv://andre_andrezinh2:DejLqWEFBIlzi7Z2@djfordog.be1miyv.mongodb.net/?retryWrites=true&w=majority",
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
      name: "andre_andrezinh2",
      password: "DejLqWEFBIlzi7Z2",
      host: "eu-ro-01.wisp.uno",
      port:  9969,
      secure: false
    }
  ]
}
