
module.exports = function(controller) {

    var rotas = {};

    /*
     * Returns the first word from a string
     */
    function getFirstWord(text) {
        return text.match(/^[^\s]+/i) ? text.match(/^[^\s]+/i)[0] : '';
    }

    /*
     * Returns the number of weekdays between 2 dates
     */
    function countWeekdaysBetweenDates(first, last) {
        if (first > last) return -1;

        var start = new Date(first.getTime());
        var end = new Date(last.getTime());
        var count = 0;
        
        while (start <= end) {
            if (start.getDay() != 0 && start.getDay() != 6) {
                count++;
            } 

            start.setDate(start.getDate() + 1);
        }

        return count;
    }

    /*
     * Returns the person on rota based on a Mon - Fri schedule
     */
    function getWeekdayRota(rotaArray) {
        var a = new Date('03/01/2019');
        var b = new Date();

        var noOfWeekdays = countWeekdaysBetweenDates(a, b);

        var index = noOfWeekdays % rotaArray.length;

        return rotaArray[index];
    }


    /*
     * Directs the slash commands to the correct handlers
     */
    function processCommand(bot, message) {
        switch (message.command) {
            case '/rota':
                rotaResponse(bot, message);
            break;
            default:
                bot.replyPrivateDelayed(message, 'Your command cannot be handled by the rota bot');
        }
    }

    /*
     * Loads in the rota data and starts the command processing
     */
    controller.on('slash_command',function(bot,message) {
        // we're always going to send an immediate response. 
        // this means that we must ALWAYS use delayed replies, no immediate ones
        bot.replyAcknowledge();

        var storage_id = message.team_id  + '-rotas';

        controller.storage.teams.get(
            storage_id,
            function(err, team_data) {
                if (err) {
                    console.log('there was an error loading the team data!');
                    console.error(err);
    
                    bot.replyPrivateDelayed(message, 'There was an error loading your team data');
                } else {
                    if (team_data.rotas != null) {
                        rotas = team_data.rotas;
                    } else {
                        rotas = {};
                    }

                    processCommand(bot, message);
                }
            }
        );
    })


    /*
     * Directs rota requests to the correct handler function
     */
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

    /*
     * Tells the user who's on the rota
     */
    function rotaWhosOn(bot, message) {
        var rotaName = getFirstWord(message.text);

        if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'Please specify which rota you want to lookup, e.g. `/rota brews`');
        } else if (rotas[rotaName] != null) {
            if (rotas[rotaName].users.length > 0) {
                var onRota = getWeekdayRota(rotas[rotaName].users);
                bot.replyPrivateDelayed(message, onRota + ' is currently active on the *' + rotaName + '* rota');
            } else {
                bot.replyPrivateDelayed(message, 'There are no people on the *' + rotaName + '* rota');
            }
        } else {
                bot.replyPrivateDelayed(message, '*' + rotaName + '* rota could not be found');
        }
    }

    /*
     * Returns help text on how to use the bot
     */
    function rotaHelp(bot, message, args) {
        bot.replyPrivateDelayed(message, 'Need some help eh buddy?!'); 
    }

    /*
     * Creates a new rota
     */
    function rotaCreate(bot, message, args) {
        var rotaName = getFirstWord(args);

        if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'You must provide a rota name to create, e.g. `/rota create brews`');
        } else if (rotas[rotaName] != null) {
            bot.replyPrivateDelayed(message, 'There is already a rota named *' + rotaName + '*');
        } else {
            rotas[rotaName] = {'pointer': 0, 'users' : []};
            bot.replyPublicDelayed(message, 'Created empty rota *' + rotaName + '*');
            saveRotas(message);
        }
    }

    /*
     * Deletes a rota
     */
    function rotaDelete(bot, message, args) {
        var rotaName = getFirstWord(args);

        if (rotaName.length == 0) {
            bot.replyPrivateDelayed(message, 'You must provide a rota name to delete, e.g. `/rota delete brews`');
        } else if (rotas[rotaName] != null) {
            delete rotas[rotaName];
            bot.replyPrivateDelayed(message, '*' + rotaName + '* has been deleted');
            saveRotas(message);
        } else {
            bot.replyPrivateDelayed(message, '*' + rotaName + '* rota could not be found');
        }
    }

    /*
     * Adds a slack user to a rota
     */
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
            } else if (rotas[rotaName]['users'].indexOf(user) != -1) {
                bot.replyPrivateDelayed(message, 'User *' + user + '* is already on the *' + rotaName + '* rota');
            } else {
                rotas[rotaName]['users'].push(user);
                bot.replyPrivateDelayed(message, 'Adding *' + user + '* to *' + rotaName + '*');
                saveRotas(message);
            }
        } else {
            bot.replyPrivateDelayed(message, '*' + rotaName + '* rota was not found. Create it with `/rota create ' + rotaName + '`');
        }
    }

    /*
     * Removes a slack user from a rota
     */
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
            } else if (rotas[rotaName]['users'].indexOf(user) != -1) {
                delete rotas[rotaName]['users'][rotas[rotaName]['users'].indexOf(user)];
                bot.replyPrivateDelayed(message, 'Removed *' + user + '* from *' + rotaName + '*');
                saveRotas(message);
            } else {
                bot.replyPrivateDelayed(message, '*' + user + '* is not on the *' + rotaName + '* rota');
            }
        } else {
            bot.replyPrivateDelayed(message, '*' + rotaName + '* rota could not be found');
        }
    }

    /*
     * Lists rotas, or if given a rota name, lists the slack users in the rota
     */
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
                bot.replyPrivateDelayed(message, '*' + rotaName + '* rota has the following members: ' + rotas[rotaName]['users'].join(','));
            }
        } else {
            bot.replyPrivateDelayed(message, '*' + rotaName + '* rota was not found. Create it with `/rota create ' + rotaName + '`');
        }
    }

    /*
     * Saves rotas to storage
     */
    function saveRotas(message) {
        var storage_id = message.team_id  + '-rotas';

        controller.storage.teams.save(
            {id: storage_id, rotas: rotas},
            function(err) {
                if (err) {
                    console.log('there was an error!');
                    console.error(err);
                }
            }
        );
    }
}
