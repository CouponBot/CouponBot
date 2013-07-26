
/**************************************
 *          String Constants          *
 **************************************/
 
var MSG_INVALID_COMMAND = "You have entered an invalid command. Please try again.";

var MSG_SUCCESSFUL_OP = "Added ID to admins!";
var MSG_ALREADY_OP = "That ID is already set to admin.";

var MSG_SUCCESSFUL_DEOP = "Removed ID from admins!";
var MSG_ALREADY_DEOP = "That ID is already not set to admin.";

var MSG_OPS_LIST_PREFIX = "Admins:\n";

var MSG_SUCCESSFUL_TOGGLE = "Value toggled!";
var MSG_TOGGLE_LIST_PREFIX = "Toggleables:\n";




/*********************************
 *          Bot Options          *
 *********************************/

/** Emulated Typing mode */
var emutyping_enabled = true; // if true, bot will seem to be typing before it sends a message
var emutyping_speed = 20; // typing speed (in characters per second)
var emutyping_maxdelay = 4; // maximum delay (in seconds) before the message will finally be sent


/** steamID64s of all admins */
var adminIDs = [
    '76561197996608666', //oxguy3
    '76561198009085631' //SoullessWaffle
];




var Steam = require('steam');
var bot = new Steam.SteamClient();
var SteamTrade = require('steam-trade');
var steamTrade = new SteamTrade();
var fs = require('fs');

/** 
 * Convenience function for send chat messages to the user
 */
function typeMessage(steamID, message) {
    if (emutyping_enabled) {
        var delay = Math.min(message.length * (1000 / emutyping_speed), emutyping_maxdelay * 1000);
        
        bot.sendMessage(steamID, "", Steam.EChatEntryType.Typing);
        setTimeout((function() {
            bot.sendMessage(steamID, message, Steam.EChatEntryType.ChatMsg);
        }), delay);
        
    } else {
        bot.sendMessage(steamID, message, Steam.EChatEntryType.ChatMsg);
    }
}


fs.exists('accountData.txt', function(exists) {
    if (exists){
        var accountData = fs.readFileSync('accountData.txt').toString().split('\n');
        console.log('Loaded account details from file');
        bot.logOn({
            accountName: accountData[0],
            password: accountData[1]
        });
        
        
        bot.on('loggedOn', function() {
            console.log('Logged in as ' + bot.steamID);
            bot.setPersonaState(Steam.EPersonaState.Online);
            //bot.setPersonaName('Coupon Bot');
        });
        
        
        bot.on('relationships', function() {
            console.log('Relationships loaded');
            /*console.log('Steam friends list: '+String(Steam.friends));
            Steam.friends && Steam.friends.forEach(function(steamID) {
                console.log(String(steamID));
            });*/
            //bot.addFriend('STEAM_0:1:24409951');
        });
        
        
        bot.on('chatInvite', function(chatRoomID, chatRoomName, patronID) {
            console.log('Got an invite to ' + chatRoomName + ' from ' + bot.users[patronID].playerName);
            bot.joinChat(chatRoomID); // autojoin on invite
        });
        
        
        var easterEggs = {'ping':'pong','poop':'piss','dog':'cat'};
        bot.on('message', function(uid, msg, type, chatter) {
            // respond to both chat room and private messages
            if (msg != '') {
                console.log('Received message: ' + msg);
                if (msg in easterEggs) {
                    typeMessage(uid, easterEggs[msg]);
                }
                
            }
        });
        
        
        bot.on('friendMsg', function(uid, msg, msgtype) {
            if (msgtype == Steam.EChatEntryType.ChatMsg) {
                
                /** if the user is sending an admin command and has permission to do so */
                if (msg.indexOf("/") == 0 && adminIDs.indexOf(uid) > -1) {
                    var cmd = msg.substr(1);
                    var cmdparams = cmd.split(" ");
                    
                    /** "/op <steamID64>" to add someone to the admin list */
                    if (cmdparams[0].toLowerCase() == "op") {
                        if (cmdparams.length == 2) {
                            //should probably be checking if they actually entered a valid steam ID
                            //should be saving adminIDs to a file so they survive reboots
                            if (adminIDs.indexOf(cmdparams[1]) > -1) {
                                typeMessage(uid, MSG_ALREADY_OP);
                            } else {
                                adminIDs.push(cmdparams[1]);
                                typeMessage(uid, MSG_SUCCESSFUL_OP);
                            }
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                        }
                        
                    /** "/deop <steamID64>" to remove someone from the admin list */
                    } else if (cmdparams[0].toLowerCase() == "deop") {
                        if (cmdparams.length == 2) {
                            //should probably be checking if they actually entered a valid steam ID
                            //should be saving adminIDs to a file so they survive reboots
                            var index = adminIDs.indexOf(cmdparams[1])
                            if (index == -1) {
                                typeMessage(uid, MSG_ALREADY_DEOP);
                            } else {
                                adminIDs = adminIDs.slice(0, index).concat(adminIDs.slice(index+1));
                                typeMessage(uid, MSG_SUCCESSFUL_DEOP);
                            }
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                        }
                        
                    /** "/ops" to list all current admins */
                    } else if (cmdparams[0].toLowerCase() == "ops") {
                        if (cmdparams.length == 1) {
                            typeMessage(uid, MSG_OPS_LIST_PREFIX + adminIDs.join("\n"));
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                        }
                    
                    /** THIS METHOD IS BROKEN RIGHT NOW BUT IT'S 2 AM AND I HAVE WORK
                       TOMORROW MORNING SO IT'S STAYING BROKEN AND COMMENTED FOR NOW */
                    /** "/toggle <varname>" to enable/disable a feature or whatever */
                    /*} else if (cmdparams[0].toLowerCase() == "toggle") {
                        var toggleables = [
                            ["emutyping", "emutyping_enabled"]
                        ];
                        
                        if (cmdparams.length == 1) {
                            var strToggleables = MSG_TOGGLE_LIST_PREFIX;
                            for (var i = 0; i < toggleables.length; i++) {
                                strToggleables += toggleables[i][0] + "\n";
                            }
                            
                            typeMessage(uid, strToggleables);
                            
                        } else if (cmdparams.length == 2) {
                            var i=0;
                            while (i < toggleables.length) {
                                if (cmdparams[1].toLowerCase() == toggleables[i][0]) {
                                    break;
                                } else {
                                    i++;
                                }
                            }
                            if (i < toggleables.length) {
                                global[toggleables[i][1]] = !global[toggleables[i][1]];
                                typeMessage(uid, MSG_SUCCESSFUL_TOGGLE);
                                
                            } else {
                                typeMessage(uid, MSG_INVALID_COMMAND);
                            }
                            
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                        }
                      */  
                    } else {
                        typeMessage(uid, MSG_INVALID_COMMAND);
                    }
                } else {
                    //code to run when the message is not an admin command
                }
            }
        });
        
        
        bot.on('friend', function(steamID, relationshipStatus) {
            //console.log('Friend Activity!');
            if (relationshipStatus == Steam.EFriendRelationship['RequestRecipient']){
                //console.log('Pending friend request!');
                bot.addFriend(steamID);
                console.log('Added '+String(steamID)+' to friends list');
            }
        });
    }
    else{
        console.log('Could not load account details, shutting down...');
        process.exit();
    }
});

