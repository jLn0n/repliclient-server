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

function disconnectId(id) {
	return broadcastToId(id, "disconnect")
};

function isRepliclientInstance(origin) {
	// TODO: figure out how to do this
	return true;
};

poll.on("connection", (connection) => {
	console.log(`Repliclient instance '${connection.id}' has connected!`);

	if (isRepliclientInstance() === true) {
		broadcastToId(connection.id, "connect", "data here needed!");
	} else {
		disconnectId();
		return
	};
	
	connection.on("data_send", (msgData) => {
		poll.connections.forEach((_connection) => {
			if (_connection === connection) {
				return;
			}

			_connection.send("data_recieve", msgData)
		});
	});
})