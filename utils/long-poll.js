// imports
const events = require("events");

// main
class longpollConnection {
	constructor(client_id, remove_callback) {
		this._internal = {};
		this._internal.removeCallback = remove_callback;
		this._internal.sendQueue = [];
		this._internal.lastPing = new Date();
		
		this._longpoll = {}
		this._longpoll.readyToRecieve = false;
		this._longpoll.isSending = false;
		
		this.stream = new events.EventEmitter();
		this.clientId = client_id;

		this._internal.pingInterval = setInterval(() => {
            if (this.lastPing <= new Date(new Date().getTime() - 1000 * 30)) {
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
	_get(req, res) {
		this._internal.lastPing = new Date()
		this._longpoll.readyToRecieve = true;
		this._longpoll.isSending = true;

		const getInterval = setInterval(() => {
            if (this._internal.sendQueue.length !== 0) {
                const removing = this._internal.sendQueue.shift()
                clearInterval(getInterval)
                this.lastPing = new Date();

				if (!removing) { return; }
				res.json({
					success: true,
					event: {
						name: Buffer.from(removing.name).toString("base64"),
						data: JSON.stringify(removing.data)
					}
				});
            }
        }, 60);
		
		res.on('end', () => {
            clearInterval(getInterval);
            this._longpoll.readyToRecieve = false;
			this._longpoll.isSending = false;
        })
	}

	// @internal
	_post(req, res) {
        this.lastPing = new Date();

        if (req.body.name !== undefined) {
            const name = Buffer.from(req.body.name, "base64").toString("utf8");
            const data = Buffer.from(req.body.data || "null", "base64").toString("utf8");
            this.stream.emit(name, data)

            res.json({
                success: true
            })
        } else {
            res.status(400).json({
                success: false,
                reason: "Missing params."
            })
        }
    }

	// @internal
	_disconnect() {
        this.stream.emit("disconnect", "forced disconnection");
        clearInterval(this._internal.pingInterval);
		this._internal.removeCallback();
    }
}

module.exports = longpollConnection;