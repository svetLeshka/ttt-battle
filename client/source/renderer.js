const ip = "127.0.0.1";
let isGameEnd = false;
const animTimer = 2000;
let timer = null;

const auth = () => {
  document.getElementById("ttt").hidden = false;
  document.getElementById("auth").hidden = true;
  const nickname = document.getElementById("nickname").value;
  Api.connect(nickname, 1333, ip);
};

const table = document.querySelector("#ttt");

const drawFigure = (event) => {
  const td = event.target.closest("td");
  const role = Api.getRole();
  const side = Api.getSide();
  const ready = Api.getReady();
  if (
    td.classList.contains("krestik") ||
    td.classList.contains("nolik") ||
    role == "other" ||
    side != role ||
    !ready
  )
    return;
  td.classList.add(role);
  Api.drawFigure(td.dataset.row, td.dataset.column);
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (isGameEnd) gameOver();
    timer = null;
  }, animTimer);
};

const tds = document.querySelectorAll("#ttt td");
if (tds.length) {
  tds.forEach((td) => {
    td.addEventListener("click", drawFigure);
  });
}

window.addEventListener("beforeunload", Api.closeConnection);

document.getElementById("btnConnect").addEventListener("click", auth);

document.getElementById("nickname").addEventListener("keydown", (ev) => {
  if (ev.code == "Enter") {
    const click = new Event("click");
    document.getElementById("btnConnect").dispatchEvent(click);
  }
});

const handleMove = (event) => {
  const side = event.detail.side;
  const row = event.detail.row;
  const column = event.detail.column;
  const td = table.querySelector(
    `tbody > tr:nth-child(${row}) > td:nth-child(${column})`
  );
  if (!td.classList.contains(side)) {
    td.classList.add(side);
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (isGameEnd) gameOver();
      timer = null;
    }, animTimer);
  }
};

document.addEventListener("recieveMove", handleMove);

const gameOver = () => {
  const resp = confirm("go next?");
  Api.confirmed(resp);
};

const regame = (event) => {
  isGameEnd = false;
  document.getElementById("auth").hidden = false;
  document.getElementById("ttt").hidden = true;
  document.dispatchEvent(new CustomEvent("startGame"));
};

document.addEventListener("re", regame);
document.addEventListener("startGame", () => {
  for (const td of tds) {
    td.removeAttribute("class");
  }
});
document.addEventListener("gameOver", () => {
  isGameEnd = true;
  if (timer === null) {
    gameOver();
  }
});
