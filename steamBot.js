/**************************************
 *          String Constants          *
 **************************************/
var MSG_INVALID_COMMAND = "You have entered an invalid command. Please try again.";

var MSG_SUCCESSFUL_OP = "Added ID to admins!";
var MSG_ALREADY_OP = "That ID is already set to admin.";

var MSG_SUCCESSFUL_DEOP = "Removed ID from admins!";
var MSG_ALREADY_DEOP = "That ID is already not set to admin.";

var MSG_NOT_ADMIN = "You are not an admin!";

var MSG_OPS_LIST_PREFIX = "Admins:\n";

var MSG_SUCCESSFUL_TOGGLE = "Value toggled!";
var MSG_TOGGLE_LIST_PREFIX = "Toggleables:\n";

var easterEggs = {
    'ping': 'pong',
    'poop': 'piss',
    'dog': 'cat',
    'derp': 'herp',
    'herp': 'derp',
    'bunnywabbit': '.\n(\\__/)\n(o_O)\n( v.v )',
    'y u no': '\u10DA(\u0CA0\u76CA\u0CA0\u10DA)'
};



/*********************************
 *          Bot Options          *
 *********************************/

/** Emulated Typing mode */
var emutyping_enabled = false; // if true, bot will seem to be typing before it sends a message
var emutyping_speed = 20; // typing speed (in characters per second)
var emutyping_maxdelay = 3; // maximum delay (in seconds) before the message will finally be sent


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
 * Convenience function for sending chat messages to the user
 */

function typeMessage(steamID, message) {
    if(emutyping_enabled) {
        var delay = Math.min(message.length * (1000 / emutyping_speed), emutyping_maxdelay * 1000);

        bot.sendMessage(steamID, "", Steam.EChatEntryType.Typing);
        setTimeout((function () {
            bot.sendMessage(steamID, message, Steam.EChatEntryType.ChatMsg);
        }), delay);

    } else {
        bot.sendMessage(steamID, message, Steam.EChatEntryType.ChatMsg);
    }
}

/** 
 * Convenience function for logging
 */

function log(msg) {
    console.log(msg);
}

/** 
 * Convenience function for iterating over associative arrays/objects
 */

function getKeys(obj) {
    var keys = [];

    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    log(keys.join('\n'));
    return keys;
}

fs.exists('accountData.txt', function (exists) {
    if(exists) {
        var accountData = fs.readFileSync('accountData.txt').toString().split('\n');
        log('Loaded account details from file');
        //log('User: '+accountData[0]+' Pass: '+accountData[1]); //print accountData to console for debugging purposes
        bot.logOn({
            accountName: accountData[0],
            password: accountData[1]
        });


        bot.on('loggedOn', function () {
            log('Logged in as ' + bot.steamID);
            //moved personastate to relationships to ensure bot is ready for everything when it visibly comes online
            //bot.setPersonaName('Coupon Bot');
        });


        bot.on('relationships', function () {
            log('Relationships loaded');
            bot.setPersonaState(Steam.EPersonaState.Online);
            /*log('Steam friends list: '+String(Steam.friends));
            Steam.friends && Steam.friends.forEach(function(steamID) {
                log(String(steamID));
            });*/
        });


        bot.on('chatInvite', function (chatRoomID, chatRoomName, patronID) {
            log('Got an invite to ' + chatRoomName + ' from ' + bot.users[patronID].playerName);
            bot.joinChat(chatRoomID); // autojoin on invite
        });



        //Merged friendMessage and message into message so admins can command bot in chat room
        bot.on('message', function (uid, msg, msgtype) {
            if(msgtype == Steam.EChatEntryType.ChatMsg) {

                /** if the user is sending an admin command and has permission to do so */
                if(msg.indexOf("/") == 0 && adminIDs.indexOf(uid) > -1) {
                    var cmd = msg.substr(1);
                    var cmdparams = cmd.split(" ");

                    /** "/op <steamID64>" to add someone to the admin list */
                    if(cmdparams[0].toLowerCase() == "op") {
                        if(cmdparams.length == 2) {
                            //should probably be checking if they actually entered a valid steam ID
                            //should be saving adminIDs to a file so they survive reboots
                            if(adminIDs.indexOf(cmdparams[1]) > -1) {
                                typeMessage(uid, MSG_ALREADY_OP);
                                log('Admin with SteamID ' + uid + ' tried to OP SteamID ' + cmdparams[1] + ' but that SteamID is already an admin!');
                            } else {
                                adminIDs.push(cmdparams[1]);
                                typeMessage(uid, MSG_SUCCESSFUL_OP);
                                log('Admin with SteamID ' + uid + ' successfully OP\'d SteamID ' + cmdparams[1]);
                            }
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                            log('Admin with SteamID ' + uid + ' entered invalid command: ' + msg);
                        }

                        /** "/deop <steamID64>" to remove someone from the admin list */
                    } else if(cmdparams[0].toLowerCase() == "deop") {
                        if(cmdparams.length == 2) {
                            //should probably be checking if they actually entered a valid steam ID
                            //should be saving adminIDs to a file so they survive reboots
                            var index = adminIDs.indexOf(cmdparams[1])
                            if(index == -1) {
                                typeMessage(uid, MSG_ALREADY_DEOP);
                                log('Admin with SteamID ' + uid + ' tried to DEOP SteamID ' + cmdparams[1] + ' but that SteamID is already DEOP\'d!');
                            } else {
                                adminIDs = adminIDs.slice(0, index).concat(adminIDs.slice(index + 1));
                                typeMessage(uid, MSG_SUCCESSFUL_DEOP);
                                log('Admin with SteamID ' + uid + ' successfully DEOP\'d SteamID ' + cmdparams[1]);
                            }
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                            log('Admin with SteamID ' + uid + ' entered invalid command: ' + msg);
                        }

                        /** "/ops" to list all current admins */
                    } else if(cmdparams[0].toLowerCase() == "ops") {
                        if(cmdparams.length == 1) {
                            typeMessage(uid, MSG_OPS_LIST_PREFIX + adminIDs.join("\n"));
                            log('Admin with SteamID ' + uid + ' requested the list of OPs');
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                            log('Admin with SteamID ' + uid + ' entered invalid command: ' + msg);
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
                        log('Admin with SteamID ' + uid + ' entered invalid command: ' + msg);
                    }
                } else {
                    if(msg.indexOf("/") == 0 && adminIDs.indexOf(uid) == -1) {
                        typeMessage(uid, MSG_NOT_ADMIN);
                        log('Non-admin user with SteamID ' + uid + ' tried to execute command: ' + msg);
                    } else {
                        /** Currently broken, I'm trying to detect whether any of the easter eggs are contained in msg
                        var inMsg = false;
                        for(var i = 0; i < getKeys[easterEggs].length(); i++) {
                            if(msg.toLowerCase().indexOf(keys[i]) > -1) {
                                inMsg = true;
                            }
                        }
                        if(inMsg) {
                            log('Received easter egg from SteamID ' + uid + ': ' + msg + ' Replying with: ' + easterEggs[msg]);
                            typeMessage(uid, easterEggs[msg]);
                        } else {
                            log('Received message from SteamID ' + uid + ': ' + msg);
                        }
                        */
                        //log(getKeys[easterEggs]);
                        log('Received message from SteamID ' + uid + ': ' + msg);
                        typeMessage(uid, msg);
                    }
                }
            }
        });


        bot.on('friend', function (steamID, relationshipStatus) {
            //log('Friend Activity!');
            if(relationshipStatus == Steam.EFriendRelationship['RequestRecipient']) {
                //log('Pending friend request!');
                bot.addFriend(steamID);
                log('Added ' + String(steamID) + ' to friends list');
            }
        });

        /** Initialize the trading component of the bot; This is currently not working because I find the node-steam-trade docs rather confusing and ambiguous
        var callback;
        bot.on('webSessionID'), function (sessionID) {
            log('webSessionID triggered!');
            steamTrade.sessionID = sessionID;
            log('sessionID set to '+String(sessionID));
            webLogOn(callback);
            log('webLogOn set callback to '+String(callback));
            steamTrade.setCookie(callback);
            log('cookie set to '+String(callback));
        }
        */

        bot.on('error', function (e) {
            log('An error occurred: ' + e.cause);
        });
    } else {
        log('Could not load account details, shutting down...');
        process.exit();
    }
});