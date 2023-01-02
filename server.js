// imports
const backend = require("./server-backend.js")

// variables
const backendServer = new backend

const serverConfig = {
	recievePerSecond: 30
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
    console.log(`Repliclient instance '${connector.clientId}' has connected!`);
	let serverInfo = {
		clientId: connector.clientId
	}
	serverInfo = Object.assign(serverInfo, serverConfig)
	
    broadcastToId(connector.clientId, "connect", JSON.stringify(serverInfo));

    connector.on("data_send", (data) => {
        broadcastToOtherInstance(connector.clientId, "data_recieve", data);
    });

	connector.on("ping", (pingStartTime) => {
		broadcastToId(connector.clientId, "pong", pingStartTime)
	});

    connector.on("disconnect", (data) => {
        console.log(`Repliclient instance '${connector.clientId}' has disconnected!`);
    });
});