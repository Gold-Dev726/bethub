const fetch = require('node-fetch');
const yaml = require('js-yaml');
const crypto = require('crypto');
const fs = require('fs');

const STAGE = 'prod'; // DEV/PROD
const SSVALUES = {
  prod: {
    url: 'https://casino.cur.a8r.games',
    base_url: 'https://bethub.gg',
    auth_token: 'p2bdpr2vn38ja9jx'
  },

  dev: {
    url: 'https://casino.int.a8r.games',
    base_url: 'https://bethub.gg',
    auth_token: '9u9l1k1wad0h5g3j'
  }
}

const providers = [
  'alg',
  'atmosphera',
  'hub88',
  'ezugi',
  'gameart',
  'groove',
  'kagaming',
  'kalamba',
  'mascot',
  'mrslotty',
  'quickspin',
  'everymatrix',
  'thunderkick',
  'wazdan',
  'netgame',
  'evolution',
  'habanero',
  '1spin4win',
  'truelab',
  'evoplay',
  'pushgaming',
  'belatra',
  'technology',
  'gamebeat',
  'platipus',
  'tomhorn',
  'spribe',
  'spinomenal',
  'swintt',
  'zillion',
  'pragmaticexternal',
  'yggdrasil',
  'igtech',
  'mancala',
  'bsg',
  'luckystreak',
  '1x2gaming',
  'nolimit',

  /*'1x2gaming_basic',
  '1x2gaming_irondogstudio',
  '1x2gaming_leapgaming',
  '1x2gaming_megaways',
  '1x2gaming_table',
  '1spin4win_basic',
  'alg_basic',
  'alg_ajz',
  'alg_ait',
  'atmosphera_basic',
  'atmosphera_liveslots',
  'belatra_basic',
  'bsg_standard',
  'bsg_vip',
  'evolution_extra',
  'evolution_lightning',
  'evolution_live',
  'evolution_live_vip',
  'evolution_live_classic',
  'evolution_premium',
  'evolution_rng',
  'evoplay_basic',
  'ezugi_jackpot',
  'ezugi_live',
  'ezugi_premium',
  'gameart_basic',
  'gameart_branded',
  'gameart_premium',
  'gamebeat_basic',
  'groove_basic',
  'groove_felixgaming',
  'habanero_basic',
  'igtech_basic',
  'hub88_caleta_basic',
  'hub88_onetouch_basic',
  'hub88_onetouch_live',
  'hub88_greenjade_basic',
  'kagaming_basic',
  'kalamba_basic',
  'luckystreak_basic',
  'mancala_basic',
  'mascot_basic',
  'mrslotty_basic',
  'mrslotty_eagaming',
  'mrslotty_fazi',
  'netgame_basic',
  'nolimit_basic',
  'nolimit_rtp',
  'platipus_basic',
  'pragmaticexternal_live',
  'pragmaticexternal_basic',
  'pushgaming_basic',
  'quickspin_basic',
  'quickspin_rtp',
  'softswiss_basic',
  'softswiss_new',
  'spribe_basic',
  'spinomenal_basic',
  'spinomenal_basicmga',
  'spinomenal_dice1',
  'spinomenal_partners',
  'swintt_basic',
  'technology_basic',
  'thunderkick_basic',
  'tomhorn_basic',
  'truelab_basic',
  'yggdrasil_basic',
  'wazdan_basic',
  'zillion_basic'*/
];


let checkGamesIndividually = [
  // 'pragmaticexternal'
  'ALL'
];

const createHmacSHA256 = (body, key) => {
  return crypto.createHmac('sha256', key).update(body).digest('hex');
}

const requestToSoftswiss = async (url, body = {}, ip) => {
  // saveLog('Sending request to softswiss ' + url + ' from ' + ip);
  // saveLog(JSON.stringify(body, null, 2));

  /* static parameters */
  body.casino_id = 'bethub_gg';
  body.ip = ip;
  body.locale = 'us'; // todo: get client language
  body.client_type = 'desktop'; // todo: get that based on user agent
  body.jurisdiction = 'DE';

  body = JSON.stringify(body);

  const key = createHmacSHA256(body, SSVALUES[STAGE].auth_token);

  // https://casino.int.a8r.games${url}
  let cres = await fetch(`${SSVALUES[STAGE].url}${url}`, {method: 'POST', body: body, headers: {'Content-Type': 'application/json', 'X-REQUEST-SIGN': key}});
  let data = await cres.text();

  try {
    data = JSON.parse(data);
  } catch(e) {
    console.log(data);
    data = {code: 100, msg: 'cant parse'};
    // logger.error(e.message);
    // logger.info(data);
    // return res.status(403).send(data);
  }

  // saveLog('Received data from softswiss');
  // saveLog(JSON.stringify(data, null, 2));

  return data;
}

const getAllProviderGames = () => {
  // this.all = JSON.parse(fs.readFileSync('./b_games.json', 'utf8'));
  this.all = [];
  this.disabledGames = [];
  this.existingTitles = {};
  this.publishers = [];

  this.alreadyDisabled = JSON.parse(fs.readFileSync('./disabled_games.json'));

  console.log(`Start time: ${new Date().toGMTString()}`);

  this.getSingleGame = async (i, cb) => {
    let cres = await fetch(`https://cdn.softswiss.net/l/${providers[i]}.yaml`, {method: 'GET'});
    let data = await cres.text();
    let list = yaml.load(data);
    let list2 = [];

    if(typeof list == 'string') {
      console.log(`Provider "${providers[i]}" failed to return a list`);

      if(providers[i + 1]) {
        return this.getSingleGame(i + 1, cb);
      } else {
        return cb(this.all, this.disabledGames);
      }
    }

    for(let j in list) {
      const game = {
        title: list[j].title,
        identifier: list[j].identifier,
        identifier2: list[j].identifier2,
        provider: list[j].provider,
        producer: list[j].producer,
        category: list[j].category,
        feature_group: list[j].feature_group
      };

      if(!checkGamesIndividually.includes(game.provider) && checkGamesIndividually[0] !== 'ALL') {
        if(this.alreadyDisabled.indexOf(game.title) == -1) {
          if(!list[j].recalled) list2.push(game);
        } else {
          // console.log(`${game.title} is disabled`);
        }
      } else {
        const data2 = await requestToSoftswiss('/sessions', {
          "game": game.identifier,
          "currency": "EUR",
          "balance": 100,
          "urls": {
            "deposit_url": `${SSVALUES[STAGE].base_url}/deposit`,
            "return_url": `${SSVALUES[STAGE].base_url}/slots`
          },
          "user": { // todo: get the complete data
            "id": 'test',
            "firstname": "Test",
            "lastname": "Name",
            "nickname": 'testt',
            "city": "",
            "country": "DE",
            "date_of_birth": "1980-12-26",
            "gender": "m",
            "registered_at": "2018-10-11"
          }
        }, '178.128.197.126');


        if(data2.code == 405) {
          this.disabledGames.push(game.identifier);
          console.log(`[${providers[i]}] Game ${game.title} returned code ${data2.code} (${data2.message})`);
        } else {
          if(!list[j].recalled) {
            list2.push(game);

            console.log(`[${providers[i]}] Added game ${game.title} (${parseInt(j) + 1} out of ${list.length})`);
          } else {
            console.log(`[${providers[i]}] Game ${game.title} is recalled (${parseInt(j) + 1} out of ${list.length})`);
          }
        }
      }

      /*if(!game.identifier2) game.identifier2 = game.identifier;

      if(!this.existingTitles[game.title]) {
        list2.push(game);

        this.existingTitles[game.title] = [game.identifier];
      } else {
        this.existingTitles[game.title].push(game.identifier);

        console.log(`Duplicate found for ${game.title} (total ${Object.keys(this.existingTitles).length}):`);
        console.log(this.existingTitles[game.title]);
      }




      /*const data2 = await requestToSoftswiss('/sessions', {
        "game": game.identifier,
        "currency": "EUR",
        "balance": 100,
        "urls": {
          "deposit_url": `${SSVALUES[STAGE].base_url}/deposit`,
          "return_url": `${SSVALUES[STAGE].base_url}/slots`
        },
        "user": { // todo: get the complete data
          "id": 'test',
          "firstname": "Test",
          "lastname": "Name",
          "nickname": 'testt',
          "city": "",
          "country": "DE",
          "date_of_birth": "1980-12-26",
          "gender": "m",
          "registered_at": "2018-10-11"
        }
      }, '178.128.197.126');


      if(data2.code == 405) {
        this.disabledGames.push(game.title);
        console.log(`Game ${game.title} returned code ${data2.code} (${data2.message})`);
      } else {
        console.log(`Added game ${game.title} (${parseInt(j) + 1} out of ${list.length})`);
        list2.push(game);
      }*/
    }

    this.all = [...list2, ...this.all];

    fs.writeFileSync(`b_games_all2.json`, JSON.stringify(this.all));
    fs.writeFileSync(`disabledGames.json`, JSON.stringify(this.disabledGames));

    console.log(`Loaded ${list2.length} games from ${providers[i]} (${this.all.length} total)`);

    if(providers[i + 1]) {
      this.getSingleGame(i + 1, cb);
    } else {
      return cb(this.all, this.disabledGames);
    }
  }

  this.getSingleGame(0, (games, disabledGames = []) => {
    console.log(`Done! Got a total of ${games.length} games from ${providers.length} providers`);
    console.log(`There is a total of ${this.disabledGames.length} not-working games:`);
    console.log(this.disabledGames);

    const bgaming = JSON.parse(fs.readFileSync('./b_games.json', 'utf8'));
    games = [...bgaming, ...games];
    fs.writeFileSync(`b_games_all2.json`, JSON.stringify(games));
    fs.writeFileSync(`disabledGames.json`, JSON.stringify(disabledGames));
  });
}

getAllProviderGames();



















