'use strict';

let log4js = require('log4js');
let logger = log4js.getLogger('Helper');
logger.level = 'DEBUG';


let hfc = require('fabric-client');


let getClientForOrg = async function(org){
  logger.debug('getClientForOrg %s', org);

  // build a client context and load it with a connection profile
  // lets only load the network settings and save the client for later
  let client = hfc.loadFromConfig('config/network-config.yaml');

  // This will load a connection profile over the top of the current one one
  // since the first one did not have a client section and the following one does
  // nothing will actually be replaced.
  // This will also set an admin identity because the organization defined in the
  // client section has one defined

  client.loadFromConfig('config/' + org + '.yaml');

  // this will create both the state store and the crypto store based
  // on the settings in the client section of the connection profile
  await client.initCredentialStores();

  // The getUserContext call tries to get the user from persistence.
  // If the user has been saved to persistence then that means the user has
  // been registered and enrolled. If the user is found in persistence
  // the call will then assign the user to the client object.
  // if(username) {
  //   let user = await client.getUserContext(username, true);
  //   if(!user) {
  //     throw new Error(util.format('User was not found :', username));
  //   } else {
  //     logger.debug('User %s was found to be registered and enrolled', username);
  //   }
  // }
  // logger.debug('getClientForOrg - ****** END %s %s \n\n', userorg, username);
  let user = await client.getUserContext('admin', true);
  if (!user) {
    await client.setUserContext({username:'admin', password:'adminpw'});
  }

  return client;
};


exports.getClientForOrg = getClientForOrg;
