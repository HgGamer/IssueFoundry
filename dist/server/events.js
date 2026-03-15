import { WebSocketServer, WebSocket } from "ws";
let wss;
export function initWebSocket(server) {
    wss = new WebSocketServer({ server });
}
export function broadcast(event) {
    if (wss) {
        // We're in the HTTP server process — broadcast directly
        const msg = JSON.stringify({ event });
        console.log(`[broadcast] direct WS broadcast to ${wss.clients.size} clients, event=${event}`);
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    }
    else {
        // We're in the MCP process — notify the HTTP server via HTTP
        const port = parseInt(process.env.PORT || "37696");
        console.error(`[broadcast] no wss, sending HTTP notify to localhost:${port}, event=${event}`);
        fetch(`http://localhost:${port}/api/_notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event }),
        }).then((r) => {
            console.error(`[broadcast] HTTP notify response: ${r.status}`);
        }).catch((err) => {
            console.error(`[broadcast] HTTP notify failed: ${err}`);
        });
    }
}
