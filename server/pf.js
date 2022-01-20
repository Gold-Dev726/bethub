const fs = require('fs');

let games = JSON.parse(fs.readFileSync('./b_games_all.json'));

console.log(`before: ${games.length}`);

for(let i in games) {
  if(games[i].identifier[games[i].identifier.length - 1] == '1' && games[i].producer == 'nolimit') {
  // if(games[i].producer == 'nolimit') {
    console.log(games[i].identifier);
    games.splice(i, 1);
  }
}


console.log(`after: ${games.length}`);

fs.writeFileSync('./b_games_all.json', JSON.stringify(games));