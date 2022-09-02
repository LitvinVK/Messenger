// import { WebSocketServer } from 'ws';
// import {v4 as uuid} from 'uuid';
// import { writeFileSync } from 'fs';
// import process from 'process';
// const clients = {};
// const messages = [];

// const wss = new WebSocketServer({port: 8000});
// wss.on('connection', (ws) => {
//     const id = uuid();
//     clients[id] = ws;

//     console.log(`New client ${id}`);
//     ws.send(JSON.stringify(messages));

//     ws.on('message', (rawMessage) => {
//         const {name, message} = JSON.parse(rawMessage);
//         messages.push({name, message});
//         for (const id in clients) {
//             clients[id].send(JSON.stringify([{name, message}]));
//         }
//     });

//     ws.on('close', () => {
//         delete clients[id];
//         console.log(`Client is closed ${id}`);
//     });
// });

// process.on('SIGINT', (e) => {
//     try {
//         writeFileSync('log', JSON.stringify(messages));
//       } catch (err) {
//         console.log(err);
//       }
//     wss.close();
//     process.exit();
// });

import {v4 as uuid} from 'uuid';
import uws from 'uWebSockets.js';

const uWS = uws;
const port = 8000;
const clients = {};
const messages = [];
const names = [];
const passwords = [];
const wss = [];

const app = uWS.App({
  key_file_name: 'misc/key.pem',
  cert_file_name: 'misc/cert.pem',
  passphrase: '1234'
}).ws('/*', {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 10,
  open: (ws) => {
    const id = uuid();
    clients[id] = ws;
    console.log(`New client ${id}`);
  },
  message: (ws, rawMessage) => {
    const {name, password, message, action} = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(rawMessage)));

    if (action === 'register') {
      let isBusy = false;
      wss.push(ws);

      passwords.forEach((item) => {
        if (item.name === name) {
          isBusy = true;
        }
      });

      if (!isBusy) {
        passwords.push({name, password});
        const action = 'registerSuccess';
        ws.send(JSON.stringify([{action}]));
      } else {
        const action = 'loginIsBusy';
        ws.send(JSON.stringify([{action}]));
      }
    } else if (action === 'enter') {
      let isRegistered = false;
      passwords.forEach((item) => {
        if (item.name === name && item.password === password) {
          isRegistered = true;
          ws.send(JSON.stringify(messages));
          names.push(name);
          messages.push({name, message, action});

          for (const id in clients) {
            clients[id].send(JSON.stringify([{name, message, action, names}]));
          }
        }
      });

      if (!isRegistered) {
        const action = 'isNotRegistered';
        ws.send(JSON.stringify([{action}]));
      }
    } else {

      messages.push({name, message, action});

      names.forEach((item, i) => {
        if (action === 'exit' && item === name) {
          delete names[i];
        }
      });

      for (const id in clients) {
        if (wss.includes(clients[id])) {
          clients[id].send(JSON.stringify([{name, message, action, names}]));
        }
      }
    }
  },
  close: (ws) => {
    for (const id in clients) {
      if (clients[id] == ws) {
        console.log(`Client ${id} is closed`);
        delete clients[id];
      }
    }
    for (const i in wss) {
      if (wss[i] == ws) {
        delete wss[i];
      }
    }
  }
}).any('/*', (res, req) => {
  res.end('Nothing to see here!');
}).listen(port, (token) => {
  if (token) {
    console.log('Listening to port ' + port);
  } else {
    console.log('Failed to listen to port ' + port);
  }
});