const chatWindow = document.querySelector('.chat_window');
const chat = document.querySelector('.all_chat');
const users = document.querySelector('.users_online');
const ws = new WebSocket('ws://127.0.0.1:8000');

const inputMessage = document.querySelector('#message');
const submitMessae = document.querySelector('#submit_message');
inputMessage.disabled = 'true';
submitMessae.disabled = 'true';

const loginPassword = document.querySelector('.login_password');
const userForm = document.querySelector('#userForm');
const inputName = document.querySelector('#name');
const inputPassword = document.querySelector('#password');
const enter = document.querySelector('#submit_enter');
const register = document.querySelector('#submit_register');
const receivers = document.querySelector('.receivers');
const receiversChat = document.querySelector('.receivers_chat');
const allReceivers = document.querySelector('.all_receivers');
let wss;
const usersArray = [];

function addMessage(parentClassName, status, message, timeout) {
    const checkElementError = document.querySelector('.error');
    const checkElementSuccess = document.querySelector('.success');
    if (checkElementError) {
        checkElementError.style.display = 'none';
    } else if (checkElementSuccess) {
        checkElementSuccess.style.display = 'none';      
    }

    const element = document.createElement('div');
    element.classList.add(status);
    element.innerHTML = message;
    parentClassName.appendChild(element);
    setTimeout(() => {
        parentClassName.removeChild(element);
    }, timeout);
}

allReceivers.addEventListener('click', () => {
    allReceivers.classList.remove('not_readed');
    const receiver = document.querySelectorAll('.receiver');
    receiver.forEach((item) => {
        item.classList.remove('active_receiver');
    });
    allReceivers.classList.add('active_receiver');

    const chats = document.querySelectorAll('.chat');
    chats.forEach((item) => {
        item.classList.remove('active_chat');
    });
    chat.classList.add('active_chat');

    const chatForScroll = document.querySelector('.active_chat');
    chatForScroll.scrollTo(0, chatForScroll.scrollHeight);
});

ws.onmessage = (message) => {
    const messages = JSON.parse(message.data);
    users.innerHTML = '';
    messages.forEach((item) => {
        if (item.action === 'loginIsBusy') {
            addMessage(loginPassword, 'error', 'Данный логин занят', 3000);
        } else if (item.action === 'registerSuccess') {
            usersArray.push(ws);
            addMessage(loginPassword, 'success', 'Вы успешно зарегистрированы', 3000);
        } else if (item.action === 'isNotRegistered') {
            addMessage(loginPassword, 'error', 'Неверный логин или пароль', 3000);
        } else if (item.action === 'enter' && wss === ws) {
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
        let isPrivate = false;

        if (wss === ws) {
            if (item.name && item.action == 'enter') {
                messageEl.style.textAlign = 'center';
                messageEl.innerHTML = `Клиент ${item.name} вступил в чат`;
                messageEl.classList.add('message');
            } else if (item.name && item.action == 'exit') {
                messageEl.style.textAlign = 'center';
                messageEl.innerHTML = `Клиент ${item.name} покинул чат`;
                messageEl.classList.add('message');
            } else if (item.name && item.message) {
                if (item.receiver === 'All') {
                    if (inputName.value != item.name && !allReceivers.classList.contains('active_receiver')) {
                        allReceivers.classList.add('not_readed');
                    }
                    messageEl.innerHTML = `${item.name}: ${item.message}`;
                    messageEl.classList.add('message');
                } else if (item.name === inputName.value) {
                    messageEl.innerHTML = `${item.name}: ${item.message}`;
                    messageEl.classList.add('message');
                    isPrivate = true;
                } else if (item.receiver === inputName.value) {
                    const receiver = document.querySelectorAll('.receiver');
                    let isReceiver = false;
                    const sender = item.name;
                    receiver.forEach((item) => {
                        if (item.innerHTML === sender) {
                            isReceiver = true;
                            if (!item.classList.contains('active_receiver')) {
                                item.classList.add('not_readed');
                            }
                        }
                    });
                    if (!isReceiver) {
                        const receiverActRec = document.querySelectorAll('.receiver');
                        const userElement = document.createElement('div');
                        userElement.classList.add('receiver');
                        userElement.classList.add('not_readed');
                        userElement.innerHTML = sender;
                        receivers.appendChild(userElement);

                        const chatElement = document.createElement('div');
                        chatElement.classList.add('chat');
                        chatElement.classList.add(sender);
                        receiversChat.appendChild(chatElement);

                        const messageEl = document.createElement('div');
                        messageEl.innerHTML = `${item.name}: ${item.message}`;
                        messageEl.classList.add('message');
                        messageEl.style.textAlign = 'right';
                        chatElement.appendChild(messageEl);

                        userElement.addEventListener('click', () => {
                            userElement.classList.remove('not_readed');
                            const chats = document.querySelectorAll('.chat');
                            chats.forEach((item) => {
                                item.classList.remove('active_chat');
                            });
                            chatElement.classList.add('active_chat');

                            receiverActRec.forEach((item) => {
                                item.classList.remove('active_receiver');
                            });
                            userElement.classList.add('active_receiver');

                            const chatForScroll = document.querySelector('.active_chat');
                            chatForScroll.scrollTo(0, chatForScroll.scrollHeight);
                        });
                    } else {
                        const messageEl = document.createElement('div');
                        messageEl.innerHTML = `${item.name}: ${item.message}`;
                        messageEl.classList.add('message');
                        const chat = document.querySelectorAll('.chat');
                        chat.forEach((item) => {
                            if (item.classList.contains(sender)) {
                                messageEl.style.textAlign = 'right';
                                item.appendChild(messageEl);
                            }
                        });
                    }
                }
            }
        }

        if (item.name != inputName.value && messageEl.style.textAlign != 'center') {
            messageEl.style.textAlign = 'right';
        }

        if (isPrivate) {
            const activeChat = document.querySelector('.active_chat');
            activeChat.appendChild(messageEl);
        } else {
            chat.appendChild(messageEl);
        }
        
        if (item.names && wss === ws) {
            item.names.forEach((item) => {
                const nameEl = document.createElement('div');
                const userName = document.querySelector('#name').value;
                nameEl.classList.add('user');
                nameEl.innerHTML = item;
                users.appendChild(nameEl);
                nameEl.addEventListener('click', () => {
                    const receiver = document.querySelectorAll('.receiver');
                    let isReceiver = false;
                    receiver.forEach((item) => {         
                        if (item.innerHTML === nameEl.innerHTML) {
                            isReceiver = true;
                        }
                    });
                    if (nameEl.innerHTML === userName) {
                        isReceiver = true;
                    }
                    if (!isReceiver) {
                        const receiverActRec = document.querySelectorAll('.receiver');
                        receiverActRec.forEach((item) => {
                            item.classList.remove('active_receiver');
                        });
                        const userElement = document.createElement('div');
                        userElement.classList.add('receiver');
                        userElement.classList.add('active_receiver');
                        userElement.innerHTML = item;
                        receivers.appendChild(userElement);

                        const chats = document.querySelectorAll('.chat');
                        chats.forEach((item) => {
                            item.classList.remove('active_chat');
                        });
                        const chatElement = document.createElement('div');
                        chatElement.classList.add('chat');
                        chatElement.classList.add('active_chat');
                        chatElement.classList.add(item);
                        receiversChat.appendChild(chatElement);

                        userElement.addEventListener('click', () => {
                            userElement.classList.remove('not_readed');
                            const chats = document.querySelectorAll('.chat');
                            chats.forEach((item) => {
                                item.classList.remove('active_chat');
                            });
                            chatElement.classList.add('active_chat');

                            const chatForScroll = document.querySelector('.active_chat');
                            chatForScroll.scrollTo(0, chatForScroll.scrollHeight);
                        });
                        
                        const receiver = document.querySelectorAll('.receiver');
                        receiver.forEach((item) => {
                            item.addEventListener('click', () => {
                                const receivers = document.querySelectorAll('.receiver');
                                receivers.forEach((item) => {
                                    item.classList.remove('active_receiver');
                                });
                                item.classList.add('active_receiver');

                                const receiver = document.querySelectorAll('.receiver');
                                receiver.forEach((item) => {
                                    item.classList.remove('active_receiver');
                                });
                                item.classList.add('active_receiver');

                                const chatForScroll = document.querySelector('.active_chat');
                                chatForScroll.scrollTo(0, chatForScroll.scrollHeight);
                            });
                        });
                    }
                });
            });
        }

        const chatForScroll = document.querySelector('.active_chat');
        chatForScroll.scrollTo(0, chatForScroll.scrollHeight);
    });
};

const sendMessage = (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const message = document.querySelector('#message').value;
    let receiver = document.querySelector('.active_receiver');
    if (receiver) {
        receiver = receiver.innerHTML;
    }
    ws.send(JSON.stringify({name, message, receiver}));
    receiversChat.scrollHeight = 0;
    // document.querySelector('#message').value = '';
};

const enterUser = (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const password = document.querySelector('#password').value;
    const action = 'enter';
    let receiver = document.querySelector('.active_receiver');
    if (receiver) {
        receiver = receiver.innerHTML;
    }
    wss = ws;
    ws.send(JSON.stringify({name, password, action, receiver}));
};

const registerUser = (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const password = document.querySelector('#password').value;
    const action = 'register';
    ws.send(JSON.stringify({name, password, action}));
};

window.onbeforeunload = () => {
    if (usersArray.includes(ws)) {
        const name = document.querySelector('#name').value;
        const action = 'exit';
        ws.send(JSON.stringify({name, action}));
    }
};

const formEl = document.querySelector('#messageForm');
formEl.addEventListener('submit', sendMessage);

const enterButton = document.querySelector('#submit_enter');
enterButton.addEventListener('click', enterUser);

const registerButton = document.querySelector('#submit_register');
registerButton.addEventListener('click', registerUser);