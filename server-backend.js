// imports
const events = require("events");
const http = require("http");
const wsServer = require("websocket").server;
const uuid = require("uuid").v4;
const wsConnection = require("./utils/ws-connection.js")

// variables
const port = (process.env.PORT || 8080);

const clientIds = {}
const clientConnectors = {}

const backendEmitter = new events.EventEmitter()

// functions
function isRepliclientInstance(origin) {
	return true || origin
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
	const clientId = clientIds[connection.remoteAddress] || uuid();
	const connector = wsConnection(clientId, () => {
		delete clientConnectors[clientId];
	});
	clientConnectors[clientId] = connector

	console.log(`Peer '${connection.remoteAdress}' has connected!`)
	backendEmitter.emit("connection", clientConnectors[clientId])
	
	connection.on("message", (message) => {
		if (message.type !== "utf8") {
			return;
		};
		/*wssObj.connections.forEach((_connection) => {
            // checks if the connection object is same as the connection object by the client
			if (_connection === connection) {
				return;
			};
			_connection.sendUTF(message.utf8Data);
		});*/
		connector._fireCallback(message.utf8Data)
	});

	connection.on("close", (reasonCode, desc) => {
		console.log(`Peer '${connection.remoteAdress}' disconnected!`)
	});
});

module.exports = backendEmitter