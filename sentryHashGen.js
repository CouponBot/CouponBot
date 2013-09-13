//This script is only really used when setting up a bot account for the first time, as you only need to generate the sentry hash once (if you save it)

var fs = require('fs'),
    Steam = require('steam'),
    bot = new Steam.SteamClient(),
    sentry = '';

if(fs.existsSync('sentryfile')) {
    console.log('sentry file exists');
    sentry = fs.readFileSync('sentryfile');
    console.log('sentry: '+sentry);
}

fs.exists('accountData.txt', function (exists) {
    if(exists) {
        var accountData = fs.readFileSync('accountData.txt').toString().split('\n');
        console.log('Loaded account details from file');
        //console.log('User: '+accountData[0]+' Pass: '+accountData[1]);
        
        bot.logOn({
            accountName: accountData[0],
            password: accountData[1],
            shaSentryfile: sentry
        });
        
        bot.on('sentry',function(sentryHash) {
            console.log('sentry file does not exist');
            fs.writeFile('sentryfile',sentryHash);
        });
        
        bot.on('loggedOn', function () {
            console.log('Logged in as ' + bot.steamID);
        });
    }
    else{
        console.log('No account details file!');
    }
});