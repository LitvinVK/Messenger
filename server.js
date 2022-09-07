import {v4 as uuid} from 'uuid';
import uws from 'uWebSockets.js';

const uWS = uws;
const port = 8000;
const clients = {};
const messages = [];
const names = [];
const passwords = [];
const wss = [];
let messagesToSend = [];
let isFirst = true;

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
    const {name, password, message, action, receiver} = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(rawMessage)));
    
    if (action === 'register') {
      let isBusy = false;

      passwords.forEach((item) => {
        if (item.name === name) {
          isBusy = true;
        }
      });

      if (!isBusy && name.length < 3) {
        const action = 'loginIsShort';
        ws.send(JSON.stringify([{action}]));
      } else if (!isBusy && password.length < 8) {
        const action = 'passwordIsShort';
        ws.send(JSON.stringify([{action}]));
       } else if (!isBusy) {
        wss.push(ws);
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
          messages.push({name, message, action, receiver});

          for (const id in clients) {
            clients[id].send(JSON.stringify([{name, message, action, names, receiver}]));
          }
        }
      });

      if (!isRegistered) {
        const action = 'isNotRegistered';
        ws.send(JSON.stringify([{action}]));
      }
    } else {

      messages.push({name, message, action, receiver});

      names.forEach((item, i) => {
        if (action === 'exit' && item === name) {
          delete names[i];
        }
      });

      messagesToSend.push({name, message, action, names, receiver});

      if (isFirst) {
        setInterval(() => {
          if (messagesToSend.length != 0) {
            for (const id in clients) {
              if (wss.includes(clients[id])) {
                  clients[id].send(JSON.stringify(messagesToSend));
              }
            }
          }
          messagesToSend = [];
        }, 2000);
        isFirst = false;
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