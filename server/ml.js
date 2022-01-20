const fs = require('fs');

function getWelcomeMail(keyy) {
  let ml = fs.readFileSync('./scripts/emails/welcome.html', 'utf8').toString();
  ml = ml.replace('[VERIFY_URL]', keyy);

  return ml;
}

console.log(getWelcomeMail('TEST'));