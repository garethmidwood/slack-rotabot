
module.exports = function(controller) {

    function getFirstWord(text) {
        return text.match(/^[^\s]+/i) ? text.match(/^[^\s]+/i)[0] : '';
    }

    var rotas = {};


    controller.on('slash_command',function(bot,message) {
        // we're always going to send an immediate response. 
        // this means that we must ALWAYS use delayed replies, no immediate ones
        bot.replyAcknowledge();

        switch (message.command) {
            case '/rota':
                rotaResponse(bot, message);
            break;
            default:
                bot.replyPrivateDelayed(message, 'Your command cannot be handled by the rota bot');
        }
    })


    function rotaResponse(bot, message) {
        var subCommand = getFirstWord(message.text);
        var args = message.text.replace(subCommand, '').trim();

        switch(subCommand) {
        case 'create':
            rotaCreate(bot, message, args);
        break;
        case 'delete':
            rotaDelete(bot, message, args);
        break;
        case 'add':
            rotaAdd(bot, message, args);
        break;
        case 'remove':
            rotaRemove(bot, message, args);
        break;
        case 'list':
            rotaList(bot, message, args);
        break;
        case 'help':
            rotaHelp(bot, message, args);
        break;
        default:
            rotaWhosOn(bot, message);
        break;
        }
    }

    function rotaWhosOn(bot, message) {
        var rotaName = getFirstWord(message.text);

        if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'Please specify which rota you want to lookup, e.g. `/rota brews`');
        } else if (rotas[rotaName] != null) {
            if (rotas[rotaName].users.length > 0) {
                var pointer = rotas[rotaName].pointer;
                bot.replyPrivateDelayed(message, rotas[rotaName].users[pointer] + ' is currently active on the *' + rotaName + '* rota');
            } else {
                bot.replyPrivateDelayed(message, 'There are no people on the *' + rotaName + '* rota');
            }
        } else {
                bot.replyPrivateDelayed(message, '*' + rotaName + '* rota could not be found');
        }
    }

    function rotaHelp(bot, message, args) {
        bot.replyPrivateDelayed(message, 'Need some help eh buddy?!'); 
    }

    function rotaCreate(bot, message, args) {
        var rotaName = getFirstWord(args);

        if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'You must provide a rota name to create, e.g. `/rota create brews`');
        } else {
            rotas[rotaName] = {'pointer': 0, 'users' : []};
            bot.replyPublicDelayed(message, 'Created empty rota *' + rotaName + '*');
        }
    }

    function rotaDelete(bot, message, args) {
        var rotaName = getFirstWord(args);

        if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'You must provide a rota name to delete, e.g. `/rota delete brews`');
        } else if (rotas[rotaName] != null) {
            delete rotas[rotaName];
            bot.replyPrivateDelayed(message, '*' + rotaName + '* has been deleted');
        } else {
            bot.replyPrivateDelayed(message, '*' + rotaName + '* rota could not be found');
        }
    }

    function rotaAdd(bot, message, args) {
        var rotaName = getFirstWord(args);

            if (rotaName.length == 0) {
                bot.replyPrivateDelayed(message, 'You must specify a rota and who you want to add to it. e.g. `/rota add brews @dave`');
            } else if (rotas[rotaName] != null) {
                // get the user details
                var args = args.replace(rotaName, '').trim();       
                var user = getFirstWord(args);

                if (args.length == 0) {
                    bot.replyPrivateDelayed(message, 'You must specify a user to add to the rota, e.g. `/rota add brews @dave`');
                } else {
                    rotas[rotaName]['users'].push(user);
                    bot.replyPrivateDelayed(message, 'Adding *' + user + '* to *' + rotaName + '*');
                }
            } else {
                bot.replyPrivateDelayed(message, '*' + rotaName + '* rota was not found. Create it with `/rota create ' + rotaName + '`');
            }
    }

    function rotaRemove(bot, message, args) {
        var rotaName = getFirstWord(args);

        if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'You must provide a rota name to remove people from, e.g. `/rota remove brews @dave`');
        } else if (rotas[rotaName] != null) {
            // get the user details
            var args = args.replace(rotaName, '').trim();
            var user = getFirstWord(args);
                
            if (args.length == 0) {
                bot.replyPrivateDelayed(message, 'You must specify a user to remove from the rota, e.g. `/rota remove brews @dave`');
            } else if (rotas[rotaName]['users'][user] != null) {
                delete rotas[rotaName]['users'][user];
                bot.replyPrivateDelayed(message, 'Removed *' + user + '* from *' + rotaName + '*');
            } else {
                bot.replyPrivateDelayed(message, '*' + user + '* is not on the *' + rotaName + '* rota');
            }
        } else {
            bot.replyPrivateDelayed(message, '*' + rotaName + '* rota could not be found');
        }
    }

    function rotaList(bot, message, args) {
        var rotaName = getFirstWord(args);

        if (Object.keys(rotas).length == 0) {
            bot.replyPublicDelayed(message, 'There are no existing rotas');
        } else if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'Existing rotas: ' + Object.keys(rotas).join(', '));
        } else if (rotas[rotaName] != null) {
            if (Object.keys(rotas[rotaName]['users']).length == 0) {
                bot.replyPrivateDelayed(message, '*' + rotaName + '* is empty. Add members by running `/rota add ' + rotaName + ' @dave`');
            } else {
                bot.replyPrivateDelayed(message, '*' + rotaName + '* rota has the following members: ' + Object.keys(rotas[rotaName]['users']).join(','));
            }
        } else {
            bot.replyPrivateDelayed(message, '*' + rotaName + '* rota was not found. Create it with `/rota create ' + rotaName + '`');
        }
    }
}
