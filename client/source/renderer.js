const auth = () => {
  document.getElementById("ttt").hidden = false;
  document.getElementById("auth").hidden = true;
  const nickname = document.getElementById("nickname").value;
  Api.connect(nickname);
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
  if (!td.classList.contains(side)) td.classList.add(side);
};

document.addEventListener("recieveMove", handleMove);

const regame = (event) => {
  Api.connect(event.detail.nickname);
};

document.addEventListener("re", regame);
document.addEventListener("startGame", () => {
  for (const td of tds) {
    td.removeAttribute("class");
  }
});
