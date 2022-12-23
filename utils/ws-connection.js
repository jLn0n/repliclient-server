// imports
const events = require("events");

// main
class websocketConnection {
	constructor(client_id, remove_callback) {
		this._internal = {};
		this._internal.removeCallback = remove_callback;
		this._internal.sendQueue = [];

		this._websocketObj = null

		this.stream = new events.EventEmitter();
		this.clientId = client_id;

		this._internal.pingInterval = setInterval(() => {
            if (this._lastPing <= new Date(new Date().getTime() - 1000 * 30)) {
                this._disconnect();
                this.stream.emit("disconnect", "keepalive ping failed");
            } else {
                this.send("internal_ping")
            }
        }, 1000 * 2.5)
	}

	on(eventName, eventCallback) {
		this.stream.on(eventName, eventCallback);
	}

	send(eventName, data) {
		this._internal.sendQueue.push({
			name: eventName,
			data: data
		})
	}

	// @internal
	_fireCallback(rawData) {
		this._lastPing = new Date();
		const msgData = JSON.parse(rawData)

        if (msgData.name !== undefined) {
            const name = Buffer.from(msgData.name, "base64").toString("utf8");
            const data = Buffer.from(msgData.data || "null", "base64").toString("utf8");

            this.stream.emit(name, data)
        }
	}

	// @internal
	_sendCallback(wsObj) {
		this._lastPing = new Date();

		if (this._internal.sendQueue.length !== 0) {
			const removing = this._internal.sendQueue.shift()
			clearInterval(getInterval)

			if (!removing) { return; }
			const rawData = {
				name: Buffer.from(removing.name).toString("base64"),
				data: JSON.stringify(removing.data)
			};

			wsObj.sendUTF(JSON.stringify(rawData));
		};
	}

	// @internal
	_disconnect() {
        //this.stream.emit("disconnect", "forced disconnection");
        clearInterval(this._internal.pingInterval);
		this._internal.removeCallback();
    }
}

module.exports = websocketConnection;