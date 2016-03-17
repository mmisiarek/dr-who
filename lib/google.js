'use strict';



const got = require('got');
const readline = require('readline');
const fs       = require('./fs');


const TOKEN_DIR  = (process.env.HOME || process.env.HOMEPATH ||
                    process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'kala-api-token.json';
const KALA_API = 'http://localhost:4000';
//const KALA_API = 'http://kala-api.herokuapp.com';
//
const ROOMS = [
  'schibsted.pl_3534303234373930383335@resource.calendar.google.com',
  'schibsted.pl_32383536313330342d383736@resource.calendar.google.com',
  'schibsted.pl_35373139363931392d383530@resource.calendar.google.com',
  'schibsted.pl_31303133353237313436@resource.calendar.google.com'
];

module.exports = {
  getEvents,
  freeBusy
};

/**
 * getEvents
 *
 * @param {number} number getEvents for specified list of calendars
 * @returns {Promise}
 */
function getEvents(number){
  return getToken()
    .then(token => {
      return got.post(`${KALA_API}/getevents/${number}`, {
          body: JSON.parse(token)
        })
        .then(function(data){

          let events = JSON.parse(data.body).items;

          if (events.length === 0) {
            console.log('No upcoming events found.');
          } else {
            console.log('Upcoming 10 events:');
          }
        });
  })
  .catch(e => { console.log('E', e);});
}

function freeBusy(){
  console.log('A');
  return getToken()
    .then( token => {
      return got.post(`${KALA_API}/getrooms`, {
          body: JSON.parse({
            token: token,
            ids: ROOMS
          })
        })
        .then(function(data){
          console.log(JSON.parse(data.body));
        })
        .catch( console.log );
    });
}


function getToken(){

  return fs.readFile(TOKEN_PATH)
    .then(JSON.parse)
    .catch(function() {
      return got(`${KALA_API}/getauthurl`)
        .then(askUserForCode)
        .then(fetchToken)
        .then(storeToken)
        .catch( () => {
          console.log('Problem with authorization. Please try again.');
          process.exit(1);
        });
  });



  function askUserForCode(link){
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log('Authorize app by visiting this url');
    console.log(link.body);
    return new Promise( resolve => {
      rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        resolve(code);
      });
    });
  }

  function fetchToken(code){
    return got(`${KALA_API}/gettoken/${encodeURIComponent(code)}`);
  }

  function storeToken(token) {
    try {
      fs.native.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code !== 'EEXIST') { throw err; }
    }
    fs.native.writeFile(TOKEN_PATH, JSON.stringify(token.body));
    console.log('Token stored to ' + TOKEN_PATH);
    return Promise.resolve(token.body);
  }
}




