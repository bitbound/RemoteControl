import * as UI from "./UI.js";
import { ViewerApp } from "./App.js";
import { RemoteControlMode } from "./Enums/RemoteControlMode.js";
import { ShowMessage } from "./UI.js";
import { ChunkDto } from "./DtoChunker.js";
var signalR = window["signalR"];
export class ViewerHubConnection {
    constructor() {
        this.MessagePack = window['msgpack5']();
        this.PartialCaptureFrames = [];
    }
    Connect() {
        this.Connection = new signalR.HubConnectionBuilder()
            .withUrl("/hubs/viewer")
            .withHubProtocol(new signalR.protocols.msgpack.MessagePackHubProtocol())
            .configureLogging(signalR.LogLevel.Information)
            .build();
        this.ApplyMessageHandlers(this.Connection);
        this.Connection.start().then(() => {
            this.SendScreenCastRequestToDevice();
        }).catch(err => {
            console.error(err.toString());
            console.log("Connection closed.");
            UI.StatusMessage.innerHTML = `Connection error: ${err.message}`;
            UI.ToggleConnectUI(true);
        });
        this.Connection.onclose(() => {
            UI.ToggleConnectUI(true);
        });
        ViewerApp.ClipboardWatcher.WatchClipboard();
    }
    ChangeWindowsSession(sessionID) {
        if (ViewerApp.Mode == RemoteControlMode.Unattended) {
            this.Connection.invoke("ChangeWindowsSession", sessionID);
        }
    }
    SendDtoToClient(dto, type) {
        var _a;
        if (((_a = this.Connection) === null || _a === void 0 ? void 0 : _a.state) != "Connected") {
            return;
        }
        let chunks = ChunkDto(dto, type);
        for (var i = 0; i < chunks.length; i++) {
            const chunk = this.MessagePack.encode(chunks[i]);
            this.Connection.invoke("SendDtoToClient", chunk);
        }
    }
    SendScreenCastRequestToDevice() {
        this.Connection.invoke("SendScreenCastRequestToDevice", ViewerApp.SessionId, ViewerApp.AccessKey, ViewerApp.RequesterName);
    }
    ApplyMessageHandlers(hubConnection) {
        hubConnection.on("SendDtoToViewer", (dto) => {
            ViewerApp.DtoMessageHandler.ParseBinaryMessage(dto);
        });
        hubConnection.on("ConnectionFailed", () => {
            UI.ConnectButton.removeAttribute("disabled");
            UI.StatusMessage.innerHTML = "Connection failed or was denied.";
            ShowMessage("Connection failed.  Please reconnect.");
            this.Connection.stop();
        });
        hubConnection.on("ConnectionRequestDenied", () => {
            this.Connection.stop();
            UI.StatusMessage.innerHTML = "Connection request denied.";
            ShowMessage("Connection request denied.");
        });
        hubConnection.on("Unauthorized", () => {
            UI.ConnectButton.removeAttribute("disabled");
            UI.StatusMessage.innerHTML = "Authorization failed.";
            ShowMessage("Authorization failed.");
            this.Connection.stop();
        });
        hubConnection.on("ViewerRemoved", () => {
            UI.ConnectButton.removeAttribute("disabled");
            UI.StatusMessage.innerHTML = "The session was stopped by your partner.";
            ShowMessage("Session ended.");
            this.Connection.stop();
        });
        hubConnection.on("SessionIDNotFound", () => {
            UI.ConnectButton.removeAttribute("disabled");
            UI.StatusMessage.innerHTML = "Session ID not found.";
            this.Connection.stop();
        });
        hubConnection.on("ScreenCasterDisconnected", () => {
            UI.StatusMessage.innerHTML = "The host has disconnected.";
            this.Connection.stop();
        });
        hubConnection.on("RelaunchedScreenCasterReady", (newSessionId, newAccessKey) => {
            ViewerApp.SessionId = newSessionId;
            ViewerApp.AccessKey = newAccessKey;
            this.Connection.stop();
            this.Connect();
        });
        hubConnection.on("Reconnecting", () => {
            ShowMessage("Reconnecting...");
        });
        hubConnection.on("CursorChange", (cursor) => {
            UI.UpdateCursor(cursor.ImageBytes, cursor.HotSpot.X, cursor.HotSpot.Y, cursor.CssOverride);
        });
        hubConnection.on("RequestingScreenCast", () => {
            ShowMessage("Requesting remote control...");
        });
        hubConnection.on("ShowMessage", (message) => {
            ShowMessage(message);
        });
        hubConnection.on("WindowsSessions", (windowsSessions) => {
            UI.UpdateWindowsSessions(windowsSessions);
        });
    }
}
//# sourceMappingURL=ViewerHubConnection.js.map