'use strict';

const got = require('got');
const readline = require('readline');
const fs       = require('./fs');

const TOKEN_DIR  = (process.env.HOME || process.env.HOMEPATH ||
                    process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'kala-api-token.json';
const KALA_API = 'http://kala-api.herokuapp.com';

module.exports = {
  getEvents
};

function getEvents(number){
  return getToken()
    .then(token => {
      return got.post(`${KALA_API}/getevents/${number}`, {
          body: JSON.parse(token)
        })
        .then(function(data){

          let events = JSON.parse(data.body).items;

          if (events.length == 0) {
            console.log('No upcoming events found.');
          } else {
            console.log('Upcoming 10 events:');
            for (var i = 0; i < events.length; i++) {
              var event = events[i];
              var start = event.start.dateTime || event.start.date;
              console.log('%s - %s - %s', start, event.summary, event.location);
            }
          }
        });
  })
  .catch(e => { console.log('E', e);});
}


function getToken(){

  return fs.readFile(TOKEN_PATH)
    .then(JSON.parse)
    .catch(function(err, token) {
      console.log('hejeh');
      return got(`${KALA_API}/getauthurl`)
        .then(askUserForCode)
        .then(fetchToken)
        .then(storeToken)
        .catch( (e) => {
          console.log('Problem with authorization. Please try again.');
          process.exit(1);
        })
  });



  function askUserForCode(link){
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log("Authorize app by visiting this url")
    console.log(link.body);
    return new Promise( resolve => {
      rl.question("Enter the code from that page here: ", function(code) {
        rl.close();
        resolve(code);
      });
    });
  }

  function fetchToken(code){
    return got(`${KALA_API}/gettoken/${encodeURIComponent(code)}`)
  }

  function storeToken(token) {
    try {
      fs.native.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') { throw err; }
    }
    fs.native.writeFile(TOKEN_PATH, JSON.stringify(token.body));
    console.log('Token stored to ' + TOKEN_PATH);
    return Promise.resolve(token.body);
  }
}




