// imports
const backend = require("./server-backend.js")

// variables
const backendServer = new backend()

// functions
function broadcastToId(clientId, eventName, data) {
	let client = backendServer.connectors[clientId]

	if (client === undefined) { return };

	client.send(eventName, data);
};

function broadcastToOtherInstance(currentClientId, eventName, data) {
	for (const _connectionId of Object.keys(backendServer.connectors)) {
		if (_connectionId === currentClientId) { continue };
		
		broadcastToId(_connectionId, eventName, data);
	};
};

// main
backendServer.connection.on("connection", (newConnector) => {
    console.log(`Repliclient instance '${newConnector.clientId}' has connected!`);
    broadcastToId(newConnector.clientId, "connect", newConnector.clientId);

    newConnector.on("data_send", (data) => {
        broadcastToOtherInstance(newConnector.clientId, "data_recieve", data);
    });

    newConnector.on("disconnect", (data) => {
        console.log(`Repliclient instance '${newConnector.clientId}' has disconnected!`);
    });
});