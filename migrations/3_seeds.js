/*

    Copyright 2018 dYdX Trading Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

global.artifacts = artifacts;
global.web3 = web3;

const fs = require('fs');
const promisify = require("es6-promisify");
const Margin = artifacts.require('Margin');
const { isDevNetwork } = require('./helpers');
const { doOpenPosition, getPosition } = require('../test/helpers/MarginHelper');
const {
  createShortToken,
  createBuyOrderForToken,
  createSellOrderForToken
} = require('../test/helpers/ERC20PositionHelper');
const mkdirp = require('mkdirp');

const mkdirAsync = promisify(mkdirp);
web3.currentProvider.sendAsync = web3.currentProvider.send;

const writeFileAsync = promisify(fs.writeFile);

async function doMigration(deployer, network, accounts) {
  if (isDevNetwork(network)) {
    const directory = __dirname + '/../build/';
    await mkdirAsync(directory);

    const seeds = {};

    // Needs to complete before createSeedOrders
    const positions = await createSeedPositions(accounts);

    const orders = await createSeedOrders(accounts);

    seeds.positions = positions;
    seeds.orders = orders;

    const json = JSON.stringify(seeds, null, 4);
    await writeFileAsync(directory + '/seeds.json', json, 'utf8');
  }
}

async function createSeedPositions(accounts) {
  let salt = 729436712;
  let nonce = 238947238;
  const openTransactions = [];
  const trader = accounts[8]

  openTransactions.push(await doOpenPosition(accounts, { salt: salt++, nonce: nonce++ }));
  openTransactions.push(await doOpenPosition(accounts, { salt: salt++, nonce: nonce++ }));
  openTransactions.push(await doOpenPosition(accounts, { salt: salt++, nonce: nonce++ }));
  openTransactions.push(await createShortToken(accounts, { nonce: nonce++, trader }));
  openTransactions.push(await createShortToken(accounts, { nonce: nonce++, trader }));

  const margin = await Margin.deployed();

  const positionPromises = openTransactions.map(t => getPosition(margin, t.id));
  const balancePromises = openTransactions.map(t => margin.getPositionBalance.call(t.id));

  const [positions, balances] = await Promise.all([
    Promise.all(positionPromises),
    Promise.all(balancePromises)
  ]);

  for (let i = 0; i < openTransactions.length; i++) {
    positions[i].id = openTransactions[i].id;
    positions[i].balance = balances[i];

    if (i === 3 || i === 4) {
      positions[i].isTokenized = true;
      positions[i].positionOpener = trader;
    }
  }

  return positions;
}

async function createSeedOrders(accounts) {
  const orders = await Promise.all([
    createBuyOrderForToken(accounts),
    createSellOrderForToken(accounts),
  ]);

  return orders;
}

module.exports = (deployer, network, accounts) => {
  deployer.then(() => doMigration(deployer, network, accounts));
};
