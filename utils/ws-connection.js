// imports
const events = require("events");

// main
class websocketConnection {
	constructor(client_id, socket, remove_callback) {
		this._removeCallback = remove_callback;
		this._websocketObj = socket;
		this._lastPing = new Date();

		this.stream = new events.EventEmitter();
		this.clientId = client_id;

		this._pingInterval = setInterval(() => {
			if (this._lastPing <= new Date(new Date().getTime() - 1000 * 30)) {
				this._disconnect("keepalive ping failed");
			} else {
				this.send("internal_ping")
			}
		}, 1000 * 2.5)
	}

	on(eventName, eventCallback) {
		this.stream.on(eventName, eventCallback);
	}

	send(eventName, data) {
		this._lastPing = new Date();
		let rawData = {
			name: Buffer.from(eventName).toString("base64"),
			data: data
		};
		rawData = JSON.stringify(rawData);

		this._websocketObj.sendUTF(Buffer.from(rawData).toString("base64"));
	}

	// @internal
	_fireCallback(rawData) {
		this._lastPing = new Date();
		const msgData = JSON.parse(Buffer.from(rawData, "base64").toString("utf8"));

		if (msgData.name !== undefined) {
			const name = Buffer.from(msgData.name, "base64").toString("utf8");
			const data = (msgData.data || "null");

			this.stream.emit(name, data)
		}
	}

	// @internal
	_disconnect(reason) {
		this.stream.emit("disconnect", reason || "forced disconnection");
		clearInterval(this._pingInterval);
		this._removeCallback();
	}
}

module.exports = websocketConnection;