/**************************************
 *          String Constants          *
 **************************************/
var MSG_INVALID_COMMAND = "You have entered an invalid command. Please try again.";
var MSG_NOT_ADMIN = "You are not an admin!";

var MSG_SUCCESSFUL_OP = "Added ID to admins!";
var MSG_ALREADY_OP = "That ID is already set to admin.";

var MSG_SUCCESSFUL_DEOP = "Removed ID from admins!";
var MSG_ALREADY_DEOP = "That ID is already not set to admin.";

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
var SteamTrade = require('steam-trade');

var bot = new Steam.SteamClient();
var botTrade = new SteamTrade();

var fs = require('fs');

var rest = require('./getJSON');

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
 * Logging function (do not remove)
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

/**
 * Dumps an array the same way PHP's print_r() function does
 * Taken from http://stackoverflow.com/a/9613740/992504
 */

function print_r(arr, level) {
    var dumped_text = "";
    if(!level) level = 0;

    //The padding given at the beginning of the line.
    var level_padding = "";
    for(var j = 0; j < level + 1; j++) level_padding += "    ";

    if(typeof (arr) == 'object') { //Array/Hashes/Objects 
        for(var item in arr) {
            var value = arr[item];

            if(typeof (value) == 'object') { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += print_r(value, level + 1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else { //Stings/Chars/Numbers etc.
        dumped_text = "===>" + arr + "<===(" + typeof (arr) + ")";
    }
    return dumped_text;
}

/**
 * Function for verifying steamIDs
 */

function verifySteamID(steamID) {
    var options = {
        hostname: 'www.vacbans.com',
        port: 443,
        path: '/api/?call=profile&comm_id=' + steamID,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    log(options);
    log('Verifying SteamID: '+steamID);
    rest.getJSON(options, function (stat, res) {
        log("onResult: (" + stat + ")" + JSON.stringify(res));
    });
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

        bot.on('webSessionID', function (sessionID) {
            log('Obtained community session ID: ' + sessionID);
            botTrade.sessionID = sessionID;
            bot.webLogOn(function (cookies) {
                log('Received a new cookie: ' + cookies);
                cookies[0].split(';').forEach(function (cookie) {
                    botTrade.setCookie(cookie);
                });
            });
        });

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
                            verifySteamID(uid);
                        } else {
                            typeMessage(uid, MSG_INVALID_COMMAND);
                            log('Admin with SteamID ' + uid + ' entered invalid command: ' + msg);
                        }

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
                        }*/


                    } else {
                        typeMessage(uid, MSG_INVALID_COMMAND);
                        log('Admin with SteamID ' + uid + ' entered invalid command: ' + msg);
                    }
                } else {
                    if(msg.indexOf("/") == 0) {
                        typeMessage(uid, MSG_NOT_ADMIN);
                        log('Non-admin user with SteamID ' + uid + ' tried to execute command: ' + msg);
                    } else {
                        if(msg.indexOf("trade") == 0) {
                            bot.trade(uid);
                        }


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
                        //log(getKeys[easterEggs]); */

                        else {
                            log('Received message from SteamID ' + uid + ': ' + msg);
                            typeMessage(uid, msg);
                        }
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



        var inventory;
        var scrap;
        var weapons;
        var addedScrap;
        var client;


        bot.on('tradeProposed', function (tradeID, uid) {
            log('tradeProposed');
            bot.respondToTrade(tradeID, true);
        });

        bot.on('sessionStart', function (uid) {
            inventory = [];
            scrap = [];
            weapons = 0;
            addedScrap = [];
            client = uid;

            log('trading ' + bot.users[client].playerName);
            botTrade.open(uid);
            botTrade.loadInventory(753, 3, function (inv) {
                inventory = inv;
                log(print_r(item));
                //scrap = inv.filter(function(item) { return item.name == 'Scrap Metal';});
            });
        });


        bot.on('error', function (e) {
            log('An error occurred: ' + e.cause);
        });
    } else {
        log('Could not load account details, shutting down...');
        process.exit();
    }
});