// imports
const backend = require("./server-backend.js")

// variables
const backendConnection = backend()

// functions
function broadcastToId(clientId, eventName, data) {
	let client = backendConnection.connectors[clientId]

	if (client === undefined) { return };

	client.send(eventName, data);
};

function broadcastToOtherInstance(currentClientId, eventName, data) {
	for (const _connectionId of Object.keys(backendConnection.connectors)) {
		if (_connectionId === currentClientId) { continue };
		
		broadcastToId(_connectionId, eventName, data);
	};
};

// main
backendConnection.on("connection", (newConnector) => {
    console.log(`Repliclient instance '${newConnector.clientId}' has connected!`);
    broadcastToId(newConnector.clientId, "connect");

    newConnector.on("data_send", (data) => {
        broadcastToOtherInstance(newConnector.clientId, "data_recieve", data);
    });

    newConnector.on("send_disconnect", (data) => {
        console.log(`Repliclient instance '${newConnector.clientId}' has disconnected!`);
        newConnector._disconnect();
    });
});