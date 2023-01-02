// imports
const events = require("events");

// main
class websocketConnection {
	constructor(client_id, socket, remove_callback) {
		this._removeCallback = remove_callback;
		this._websocketObj = socket;

		this.stream = new events.EventEmitter();
		this.clientId = client_id;
	}

	on(eventName, eventCallback) {
		this.stream.on(eventName, eventCallback);
	}

	send(eventName, data) {
		let rawData = {
			name: Buffer.from(eventName).toString("base64"),
			data: data,
			timestamp: new Date().getTime()
		};
		rawData = JSON.stringify(rawData);

		this._websocketObj.sendUTF(Buffer.from(rawData).toString("base64"));
	}

	// @internal
	_fireCallback(rawData) {
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
		this._removeCallback();
	}
}

module.exports = websocketConnection;