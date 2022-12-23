// imports
const events = require("events");
const express = require("express");
//const express_longpoll = require("express-longpoll");
const helmet = require("helmet");
const uuid = require("uuid").v4;
const lp_connection = require("./utils/long-poll.js")

// constants
const port = (process.env.PORT || 8080);

// variables
const clientIds = {};
const connections = {};
const stream = new events.EventEmitter()

// functions
function broadcastToId(clientId, eventName, data) {
	let client = connections[clientId]

	if (client === undefined) { return };

	client.send(eventName, data);
};

function broadcastToOtherInstance(currentClientId, eventName, data) {
	for (const _connectionId of Object.keys(connections)) {
		if (_connectionId === currentClientId) { return };
		
		broadcastToId(_connectionId, eventName, data);
	};
};

function disconnectId(clientId) {
	return broadcastToId(clientId, "disconnect");
};
// main
// (app)
const app = express()
app.use(express.json())
app.use(helmet())

// (routing)
app.get("/", (req, res) => {
	res.send("Repliclient server running!");
});

app.post("/connection", (req, res) => {
	const client_id = clientIds[req.ip] || uuid();
	clientIds[req.ip] = client_id;

	connections[client_id] = new lp_connection(client_id, () => {
		delete connections[client_id];
	});

	stream.emit('connection', connections[client_id]);
	res.json({
		success: true,
		socketId: client_id
	})
});

app.delete("/connection/:id", async (req, res) => {
	const client_id = req.params.id;
	if (connections[client_id] === undefined){
		return res.status(400).json({
			success: false,
			reason: "Not a valid connection"
		})
	};

	connections[client_id]._disconnect();
})

app.get("/poll/:id", (req, res) => {
	const client_id = req.params.id;
	if (connections[client_id] === undefined){
		return res.status(400).json({
			success: false,
			reason: "Not a valid connection"
		})
	};

	connections[client_id]._get(req, res);
});

app.post("/poll/:id", (req, res) => {
	const client_id = req.params.id;
	if (connections[client_id] === undefined){
		return res.status(400).json({
			success: false,
			reason: "Not a valid connection"
		})
	};

	connections[client_id]._post(req, res);
});

// (post-init)
app.listen(port, () => console.log(`Repliclient server launched on port ${port}!`))
stream.on("connection", (connection) => {
	if (true == true) { // check here if connection is a repliclient instance
		console.log(`Repliclient instance '${connection.clientId}' has connected!`);
		
		setTimeout(broadcastToId, 1000, connection.clientId, "connect", "uconek");
		//broadcastToOtherInstance(connection.id, "data_recieve", "ID_PLR_ADD packetBuffer here");
	} else {
		disconnectId(connection.clientId);
		return
	};

	connection.on("force_disconnect", () => {
		console.log(`Repliclient instance '${connection.clientId}' has disconnected!`);
		return disconnectId(connection.clientId);
	});
	
	connection.on("data_send", (data) => {
		broadcastToOtherInstance(connection.clientId, "data_recieve", data);
	});
});