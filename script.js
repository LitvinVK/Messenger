const chatWindow = document.querySelector('.chat_window');
const chat = document.querySelector('.chat');
const users = document.querySelector('.users_online');
const ws = new WebSocket('ws://127.0.0.1:8000');

const inputMessage = document.querySelector('#message');
const submitMessae = document.querySelector('#submit_message');
inputMessage.disabled = 'true';
submitMessae.disabled = 'true';

const userForm = document.querySelector('#userForm');
const inputName = document.querySelector('#name');
const inputPassword = document.querySelector('#password');
const enter = document.querySelector('#submit_enter');
const register = document.querySelector('#submit_register');

function addInfo(parentClassName, status, message, timeout) {
    const className = document.createElement('div');
    className.classList.add(status);
    className.innerHTML = message;
    userForm.appendChild(className);
    setTimeout(() => {
        userForm.removeChild(className);
    }, timeout);
}


ws.onmessage = (message) => {
    const messages = JSON.parse(message.data);
    users.innerHTML = '';
    messages.forEach((item) => {
        if (item.action === 'loginIsBusy') {
            addInfo(userForm, 'error', 'Данный логин занят', 3000);
        } else if (item.action === 'registerSuccess') {
            addInfo(userForm, 'success', 'Вы успешно зарегистрированы', 3000);
        } else if (item.action === 'isNotRegistered') {
            addInfo(userForm, 'error', 'Неверный логин или пароль', 3000);
        } else if (item.action === 'enter') {
            inputName.disabled = true;
            inputPassword.disabled = true;
            enter.disabled = true;
            register.disabled = true;
            inputMessage.disabled = '';
            submitMessae.disabled = '';
        }

        if (item.action != 'exit') {
            users.innerHTML = '';
        }

        const messageEl = document.createElement('div');

        if (item.name && item.action == 'enter') {
            messageEl.innerHTML = `Клиент ${item.name} вступил в чат`;
        } else if (item.name && item.action == 'exit') {
            messageEl.innerHTML = `Клиент ${item.name} покинул чат`;
        } else if (item.name && item.message) {
            messageEl.innerHTML = `${item.name}: ${item.message}`;
        }

        chat.appendChild(messageEl);
        
        if (item.names) {
            item.names.forEach((item) => {
                const nameEl = document.createElement('div');
                nameEl.innerHTML = item;
                users.appendChild(nameEl);
            });
        }
    });
};

const sendMessage = (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const message = document.querySelector('#message').value;
    ws.send(JSON.stringify({name, message}));
    // document.querySelector('#message').value = '';
};

const enterUser = (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const password = document.querySelector('#password').value;
    const action = 'enter';
    ws.send(JSON.stringify({name, password, action}));
};

const registerUser = (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const password = document.querySelector('#password').value;
    const action = 'register';
    ws.send(JSON.stringify({name, password, action}));
};

window.onbeforeunload = () => {
    const name = document.querySelector('#name').value;
    const action = 'exit';
    ws.send(JSON.stringify({name, action}));
};

const formEl = document.querySelector('#messageForm');
formEl.addEventListener('submit', sendMessage);

const enterButton = document.querySelector('#submit_enter');
enterButton.addEventListener('click', enterUser);

const registerButton = document.querySelector('#submit_register');
registerButton.addEventListener('click', registerUser);