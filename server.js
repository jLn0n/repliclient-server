// imports
const backend = require("./server-backend.js")

// variables
const backendServer = new backend

const serverConfig = {
	// packets
	// high value = smooth | low value = janky
	recievePerSecond: 30,
	characterUpdateHz: 20
}

// functions
function broadcastToId(clientId, eventName, data) {
	let client = backendServer.connectors[clientId]

	if (client !== undefined) {
		client.send(eventName, data);
	};
};

function broadcastToOtherInstance(currentClientId, eventName, data) {
	for (const _connectionId of Object.keys(backendServer.connectors)) {
		if (_connectionId === currentClientId) { continue };
		broadcastToId(_connectionId, eventName, data);
	};
};

// main
backendServer.connection.on("connect", (connector) => {
	let serverInfo = {
		clientId: connector.clientId,
		serverConfig: serverConfig
	}
	let lastPing = new Date()
	
    console.log(`Repliclient instance '${connector.clientId}' has connected!`);
    broadcastToId(connector.clientId, "connect", JSON.stringify(serverInfo));

    connector.on("data_send", (data) => {
        broadcastToOtherInstance(connector.clientId, "data_recieve", data);
    });

	connector.on("ping", () => {
		let expectedPingTime = new Date(new Date().getTime() - (1000 * 30));

		if (lastPing >= expectedPingTime) {
			broadcastToId(connector.clientId, "pong");
			lastPing = new Date();
		} else {
			connector.close(408, "took too long to ping");
		};
	});

    connector.on("disconnect", (reason, desc) => {
        console.log(`Repliclient instance '${connector.clientId}' has disconnected!`);
    });
});