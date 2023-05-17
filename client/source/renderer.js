const auth = () => {
  //Api.connect();
  /*setInterval(() => {
    const msgs = Api.getMsgs(Messages.length);

    if (msgs) {
      Messages.push(...msgs);
      msgs.forEach((el) => pushMessage(el));
    }
  }, 100);*/
};

Api.connect();

const pushMessage = (message) => {
  messages.insertAdjacentHTML(
    "beforeend",
    `<div class='chat__message'><b>${message[0]}: </b>${message[1]}</div>`
  );
  const obj = document.getElementById("messages");
  obj.scrollTop = obj.scrollHeight;
};

const sendMessage = () => {
  const input = document.getElementById("messageInput");

  if (input == "") return;

  Api.sendMessage(input.value);
  input.value = "";
};

const drawFigure = (event) => {
  const td = event.target.closest("td");
  const role = Api.getRole();
  if (
    td.classList.contains("cross") ||
    td.classList.contains("circle") ||
    role == "other"
  )
    return;
  td.classList.add(role);
  Api.drawFigure(td.dataset.row, td.dataset.column);
};

const tds = document.querySelectorAll("#ttt td");
if (tds.length) {
  tds.forEach((td) => {
    td.addEventListener("click", drawFigure);
  });
}

window.addEventListener("beforeunload", Api.closeConnection);
