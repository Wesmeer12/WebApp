'use strict';
const discord_get_servers = require('../discord_get_servers.js');//Used to get user's Discord guilds ( Where has an admin access )
const guilds_database = require('../database/guilds.js');//Used to check in database if a server exist and if this server is premium
const panel_localization_fr = require('../localization/panel_fr.js');
const panel_localization_en = require('../localization/panel_en.js');
const crypto = require('crypto');//Generate random strings

module.exports = async function(req, res, database_pool, logger){

  if(req.session.discord_id!=undefined){

    //Check if server is in database ( = if the bot was added in the server )
    guilds_database.checkIfServerExist(database_pool, req.params.id, true)
    .then(async(data)=>{
      if(data.exist){
        //Server is registered in database
        const premium = data.premium;//will store if the server is premium or not

        //Check if user is admin on selected server
        discord_get_servers.servers(req, database_pool, logger, (guilds)=>{//Get all guilds where user has an admin permission
          let guild = undefined;
          for(let i=0; i<guilds.length; i++){//Iterate throught all user's admin guilds, and compare them to the ID of the selected guilds
            if(guilds[i].id===String(req.params.id)){//If one guild match this ID, the user is admin in this guild. If none match with, user isn't admin on it
              guild = guilds[i];
            }
          }

          if(guild!=undefined){
            logger.info("User "+ req.session.discord_id +" got rollback access to guild "+guild.id);
            //User is admin on the selected server

            //Get saved workspaces for this guild :
            database_pool.query('SELECT workspace_id, creation_date FROM server_workspace WHERE server_id=$1 ORDER BY creation_date DESC LIMIT $2 OFFSET 1', [String(req.params.id), process.env.P_MAX_ROLLBACKS])
            .then(async(savedWorkspaces)=>{
              //Successfully got saved workspaces

              //If a rollback is done, we will use a security token to be sure that users can rollback only after visited this page
              //We also save last seen server's id to avoid rollbacking a server with token generated on another server's rollback page
              req.session.securityToken = crypto.randomBytes(16).toString('hex');
              req.session.workingOnServer = String(req.params.id);

              let locale;
              //Select right language
              if(req.session.locale=='fr'){
                locale=panel_localization_fr;
              }else{
                locale=panel_localization_en;
              }

              //Everything seems good, rendering page
              res.render('panel.ejs', {session: req.session, locale: locale, guilds:guilds, guild: guild, premium:premium, page:2, savedWorkspaces:savedWorkspaces.rows});
            })
            .catch(async(err)=>{//If there is an error
              logger.error("Error while getting guild's saved workspaces : "+err);
              res.status(500).end("Error 500");
            });

          }else{
            //User isn't admin on the selected server

            //The discord_get_servers.servers() function can log out an user if error while getting his guilds ( rate limits, ... ). We should suppose that req.session isn't defined here
            res.redirect('/');
          }
        });

      }else{
        //Server isn't registered in database
        res.redirect('/panel?message=1');
      }

    })
    .catch(async(err)=>{//If there is an error while checking if server exist in database
      logger.error("Error while checking if guild is registered in database : "+err);
      res.status(500).end("Error 500");
    });

  }else{
    //Not logged in
    res.redirect('/panel');
  }

}
