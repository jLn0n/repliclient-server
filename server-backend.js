// imports
const events = require("events");
const http = require("http");
const wsServer = require("websocket").server;
const uuid = require("uuid").v4;
const wsConnection = require("./utils/ws-connection.js")

// variables
const port = (process.env.PORT || 80);

const clientIds = {}
const clientConnectors = {}

const backendEmitter = new events.EventEmitter()

// functions
function isRepliclientInstance(origin) {
	return true || origin; // always returns true lol
};

// main
const server = http.createServer((req, res) => {
	res.writeHead(200);
	res.end("Repliclient server running!");
});

server.listen(port, () => {
	console.log(`Repliclient server started on port: ${port}`);
});

const wssObj = new wsServer({
	httpServer: server,
	autoAcceptConnections: false,
})

wssObj.on("request", (req) => {
	if (!isRepliclientInstance(req.origin)) {
		req.reject(403, "Connecting origin is not a Repliclient instance.");
		return;
	}

	let connection = req.accept(undefined, req.origin);
	const clientId = clientIds[connection.socket.remoteAddress] || uuid();
	clientConnectors[clientId] = new wsConnection(clientId, connection, () => {
		delete clientConnectors[clientId];
	});
	const connector = clientConnectors[clientId];

	backendEmitter.emit("connection", connector);
	connection.on("message", (message) => {
		if (message.type !== "utf8") {
			return;
		};

		connector._fireCallback(message.utf8Data);
	});

	connection.on("close", (reasonCode, desc) => {
		connector._disconnect()
	});
});

// module init
class serverBackend {
	constructor() {
		this.connection = backendEmitter;
		this.clientIds = clientIds;

		this.connectors = clientConnectors
	}
}

module.exports = serverBackend