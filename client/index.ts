import { ClientChat } from "./source/ClientChat";
import { app, BrowserWindow } from "electron";
import path from "path";

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "\\source\\preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  win.maximize();
  win.loadFile("index.html");
  win.once("ready-to-show", win.show);
  win.webContents.openDevTools();
});

app.on("window-all-closed", app.quit);
