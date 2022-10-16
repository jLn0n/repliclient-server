const rLongPolling = require("roblox-long-polling");

const poll = new rLongPolling({
	port: process.env.PORT || 8080,
	password: null
})

function broadcastToId(id, name, data) {
	let client = poll.connections[id]

	if (!client == null) {
		return
	};

	client.send(name, data);
};

function broadcastToOtherInstance(currentConnectionId, name, data) {
	for (const _connection of Object.keys(poll.connections)) {
		if (_connection.id === currentConnectionId) {
			return;
		}

		_connection.send(name, data);
	};
};

function disconnectId(id) {
	return broadcastToId(id, "disconnect");
};

function isRepliclientInstance(origin) {
	// TODO: figure out how to do this
	return true;
};

poll.on("connection", (connection) => {
	console.log(`Repliclient instance '${connection.id}' has connected!`);

	if (isRepliclientInstance() === true) {
		broadcastToId(connection.id, "connect", "data here needed!");
		broadcastToOtherInstance(connection.id, "data_recieve", "ID_PLR_ADD packetBuffer here");
		
		console.log(`${connection.id} connected!`);
	} else {
		disconnectId(connection.id);
		return
	};

	connection.on("force_disconnect", () => {
		console.log(`${id} disconnected!`);
		return disconnectId(connection.id);
	});
	
	connection.on("data_send", (msgData) => {
		broadcastToOtherInstance(connection.id, "data_recieve", msgData);
	});
})