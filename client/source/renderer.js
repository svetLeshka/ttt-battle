const Messages = [];

const auth = () => {
    document.getElementById("chat").hidden = false;
    document.getElementById("auth").hidden = true;
    const nickname = document.getElementById("nickname").value;
    Api.connect(nickname);

    setInterval(() => {
        const msgs = Api.getMsgs(Messages.length);

        if(msgs) {
            Messages.push(...msgs);
            msgs.forEach(el => pushMessage(el));
        }
    }, 100);
};

const pushMessage = (message) => {
    messages.insertAdjacentHTML('beforeend', 
    `<div class='chat__message'><b>${message[0]}: </b>${message[1]}</div>`
    );
    const obj = document.getElementById("messages");
    obj.scrollTop = obj.scrollHeight;
};

const sendMessage = () => {
    const input = document.getElementById("messageInput");

    if(input == "") return;
    
    Api.sendMessage(input.value);
    input.value = "";
};

document.getElementById('btnConnect').addEventListener("click", auth);
document.getElementById('btnSendMsg').addEventListener("click", sendMessage);

document.getElementById('messageInput').addEventListener("keydown", (ev) => {
    if(ev.code == 'Enter') {
        sendMessage();
    } 
});