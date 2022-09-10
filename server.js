const WebSocketServer = require("websocket").server;
const http = require("http");

const port = process.env.PORT || 8080

const server = http.createServer((req, res) => {
	res.writeHead(400)
	res.end()
});
server.listen(8080)

const wss = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false,
})

function isRepliclientOrigin(origin) {
	// TODO: figure out how to do this
	return true;
};

wss.on("request", (req) => {
	if (!isRepliclientOrigin(req.origin)) {
		req.reject();
		return;
	}

	let connection = req.accept(undefined, req.origin);

	console.log("Peer '" + connection.socket.remoteAdress + "' has connected.")
	connection.on("message", (message) => {
		if (message.type !== "utf8") {
			return;
		};
		wss.connections.forEach((_connection) => {
            // checks if the connection object is same as the connection object by the client
			if (_connection === connection) {
				return;
			};
			_connection.sendUTF(message.utf8Data);
		});
	});

	connection.on("close", (reasonCode, desc) => {
		console.log("Peer '" + connection.socket.remoteAdress + "' disconnected.")
	});
});