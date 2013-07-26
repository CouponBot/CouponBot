var Steam = require('steam');
var bot = new Steam.SteamClient();
var SteamTrade = require('steam-trade');
var steamTrade = new SteamTrade();
var fs = require('fs');

fs.exists('accountData.txt', function(exists) {
    if (exists){
    console.log('accountData exists!');
    var accountData = fs.readFileSync('accountData.txt').toString().split('\n');
    bot.logOn({
        accountName: accountData[0],
        password: accountData[1]
    });

    bot.on('loggedOn', function() {
        console.log('Logged in!');
        bot.setPersonaState(Steam.EPersonaState.Online);
        bot.setPersonaName('Coupon Bot');
    });

    bot.on('relationships', function() {
        console.log('Relationships loaded!');
        console.log('Steam friends list: '+String(Steam.friends));
        Steam.friends && Steam.friends.forEach(function(steamID) {
            console.log(String(steamID));
        });
        //bot.addFriend('STEAM_0:1:24409951');
    });

    bot.on('chatInvite', function(chatRoomID, chatRoomName, patronID) {
            console.log('Got an invite to ' + chatRoomName + ' from ' + bot.users[patronID].playerName);
            bot.joinChat(chatRoomID); // autojoin on invite
    });

    bot.on('message', function(source, message, type, chatter) {
        // respond to both chat room and private messages
        if (message != '') {
            console.log('Received message: ' + message);
            if (message == 'ping') {
                bot.sendMessage(source, 'pong', Steam.EChatEntryType.ChatMsg); // ChatMsg by default
            }
        }
    });

    bot.on('friend', function(steamID, EFriendRelationship) {
        console.log('Friend Activity!');
        if (EFriendRelationship == Steam.EFriendRelationship['RequestRecipient']){
            console.log('Pending friend request!');
        }
    });
    }
    else{
        console.log('accountData does not exist, stopping...');
        process.exit();
    }
});

