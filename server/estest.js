var mysql = require('mysql');
var fs = require('fs');
var request = require('request');
var config = require('./config.js');

var pool = mysql.createPool({
  database: config.config_site.database.database,
  host: config.config_site.database.host,
  user: config.config_site.database.user,
  password: config.config_site.database.password
});

var apikey = 'zD50rkNrppMvnUVPD3Sq2yfgjdbx32eo';



function checkWinners() {
  // logger.info('Checking winners');
  console.log('checking');
  pool.query('SELECT `matchid` FROM `matches` WHERE `status` = '+pool.escape('live'), function(err1, row1){
    if(err1) {
      // logger.error(err1);
      writeError(err1);
      return;
    }

    console.log(`found ${row1.length} matches`);

    row1.forEach(function(match_sql){
      request('https://esport-api.com/api/v2/?token=' + apikey + '&matchid=' + pool.escape(match_sql.matchid), function(err2, response2) {
        if(err2) {
          logger.error(err2);
          return writeError(err2);
        }



        if(match_sql.matchid !== '34358' && match_sql.matchid !== 34358) return;
        console.log('https://esport-api.com/api/v2/?token=' + apikey + '&matchid=' + pool.escape(match_sql.matchid));

        if(response2.body[0] == '<') {
          console.log('response is html (unexpected / fatal)');
          return console.log(response2.body);
        }

        var match = JSON.parse(response2.body)[0];
        console.log(JSON.stringify(match));

        // debug
        match.status = 'ended';

        if(match.status == 'ended'){ 

          var winner_opponent = match.result1 == 'won' ? 1 : 2;
          var multiplyer = match.result1 == 'won' ? parseFloat(match.bet1) : parseFloat(match.bet2);

          console.log(`match #${match.matchid} ended (${winner_opponent}, x${multiplyer})`);

          // logger.info(`match ${match.matchid} has ended, winner: ${match.result1} / ${match.result2}`)

          pool.query('SELECT * FROM `match_ticket` WHERE `matchid` = '+pool.escape(match.matchid) + ' AND `is_finished` = 0', function(err3, bets){
            if(err3) {
              logger.error(err3);
              return writeError(err3);
            }

            pool.query('UPDATE `matches` SET `status` = '+pool.escape(match.status)+', `opponent1_name` = '+pool.escape(match.opponent1)+', `opponent2_name` = '+pool.escape(match.opponent2)+' WHERE `matchid` = '+pool.escape(match.SOMETHINGUNDEFINEDTHISISSUPPOSEDTOBEMATCHID), function(err3, row3){
              if(err3) {
                logger.error(err3);
                return writeError(err3);
              }


              // if(metches_betting[match.matchid] !== undefined) delete metches_betting[match.matchid];
            });

            console.log(`found ${bets.length} bets on match #${match.matchid}`);

            if(bets.length <= 0) return;

            bets.forEach(function(bet){
              // Check if passed
              var isPassed = bet.opponent == winner_opponent;

              console.log(`did bet #${bet.id} pass: ${isPassed}`);

              pool.query('UPDATE `match_ticket` SET `is_finished` = 1, `is_passed` = ' + pool.escape(isPassed) + ' WHERE `id` = ' + pool.escape(bet.id), function(err4) {
                if(err4) {
                  logger.error(err4);
                  return writeError(err4);
                }
              });
            });
          });
        } else if(match.status == 'deleted' || match.status == 'cancelled' || match.status == 'abandoned') {
          pool.query('SELECT * FROM `match_ticket` WHERE `matchid` = '+pool.escape(match.matchid) + ' AND `is_finished` = 0', function(err3, bets){
            if(err3) {
              logger.error(err3);
              return writeError(err3);
            }

            pool.query('UPDATE `matches` SET `status` = '+pool.escape(match.status)+', `opponent1_name` = '+pool.escape(match.opponent1)+' `opponent2_name` = '+pool.escape(match.opponent2)+' WHERE `matchid` = '+pool.escape(match.matchid), function(err3, row3){
              if(err3) {
                logger.error(err3);
                return writeError(err3);
              }

              // if(metches_betting[match.matchid] !== undefined) delete metches_betting[match.matchid];
            });

            if(bets.length <= 0) return;

            bets.forEach(function(bet){
              pool.query('UPDATE `match_ticket` SET `is_finished` = 1, `is_passed` = 1, `is_draw` = 1 WHERE `id` = ' + pool.escape(bet.id), function(err4) {
                if(err4) {
                  logger.error(err4);
                  writeError(err4);
                  return;
                }
              });
            });
          });
        }
      });
    });
  })
}

checkWinners();