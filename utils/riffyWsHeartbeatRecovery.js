const { Riffy } = require('riffy');

const HEARTBEAT_INTERVAL_MS = 30000;
const PONG_TIMEOUT_MS = 12000;
const WS_CONNECTING = 0;
const WS_OPEN = 1;

function isNodeMapped(riffy, node) {
    if (!riffy?.nodeMap?.values || !node) return false;
    for (const mappedNode of riffy.nodeMap.values()) {
        if (mappedNode === node) return true;
    }
    return false;
}

function isNodeTransportHealthy(riffy, node) {
    return !!(
        node &&
        isNodeMapped(riffy, node) &&
        node.connected === true &&
        node.ws?.readyState === WS_OPEN
    );
}

function attachHeartbeatSocket(node) {
    const ws = node?.ws;
    if (!ws || node.__dfordogHeartbeatAttachedWs === ws) return;

    node.__dfordogHeartbeatAttachedWs = ws;
    node.__dfordogHeartbeatPingAt = null;
    node.__dfordogHeartbeatLastAliveAt = Date.now();

    const markAlive = () => {
        if (node.ws !== ws) return;
        node.__dfordogHeartbeatLastAliveAt = Date.now();
        node.__dfordogHeartbeatPingAt = null;
    };

    ws.on('open', markAlive);
    ws.on('pong', markAlive);
    // A Lavalink payload also proves the TCP/WebSocket path is alive even if the
    // protocol-level pong is delayed by the event loop.
    ws.on('message', markAlive);

    ws.on('close', (code) => {
        if (node.ws !== ws) return;
        node.__dfordogHeartbeatPingAt = null;
        node.__dfordogHeartbeatLastCloseAt = Date.now();
        node.__dfordogHeartbeatLastCloseCode = code;
    });
}

function patchNode(node) {
    if (!node) return;

    // Riffy forwards resumeTimeout directly to Lavalink in seconds. The old bot
    // configured 30000, keeping dead sessions resumable for more than eight hours.
    // Keep enough time for a normal reconnect without allowing an old REST session
    // to survive for most of the day.
    node.resumeTimeout = 180;
    node.reconnectTries = Math.max(Number(node.reconnectTries) || 0, 12);

    if (!node.__dfordogHeartbeatConnectPatchInstalled && typeof node.connect === 'function') {
        const previousConnect = node.connect.bind(node);

        node.connect = function(...args) {
            const result = previousConnect(...args);
            // Node.connect() assigns node.ws synchronously before its returned promise
            // settles, so attach immediately to every replacement websocket.
            attachHeartbeatSocket(this);
            return result;
        };

        node.__dfordogHeartbeatConnectPatchInstalled = true;
    }

    attachHeartbeatSocket(node);
}

function terminateUnresponsiveSocket(node, reason) {
    const ws = node?.ws;
    if (!ws) return;

    console.warn(`[ RIFFY HEARTBEAT ] ${reason} for node ${node.name || node.host}; terminating local websocket so Riffy's reconnect path can run.`);

    node.connected = false;
    node.__dfordogHeartbeatPingAt = null;

    try {
        if (typeof ws.terminate === 'function') {
            ws.terminate();
        } else {
            ws.close();
        }
    } catch (error) {
        console.warn(`[ RIFFY HEARTBEAT ] Failed to terminate websocket for ${node.name || node.host}: ${error?.message || error}`);
        try {
            node.reconnect?.();
        } catch (_) {}
    }
}

function installHeartbeatForRiffy(riffy) {
    if (!riffy || riffy.__dfordogHeartbeatRecoveryInstalled) return;

    const patchExistingNodes = () => {
        for (const node of riffy.nodeMap?.values?.() || []) {
            patchNode(node);
        }
    };

    patchExistingNodes();
    riffy.on('nodeCreate', patchNode);
    riffy.on('nodeConnect', patchNode);

    const interval = setInterval(() => {
        const now = Date.now();

        for (const node of riffy.nodeMap?.values?.() || []) {
            patchNode(node);
            const ws = node.ws;
            const wsState = ws?.readyState;

            if (!ws) {
                node.connected = false;
                if (!node.reconnectAttempt && typeof node.connect === 'function') {
                    console.warn(`[ RIFFY HEARTBEAT ] Node ${node.name || node.host} has no websocket; reconnecting.`);
                    try { node.connect(); } catch (_) {}
                }
                continue;
            }

            if (wsState === WS_CONNECTING) continue;

            if (wsState !== WS_OPEN) {
                node.connected = false;
                if (!node.reconnectAttempt && typeof node.reconnect === 'function') {
                    console.warn(`[ RIFFY HEARTBEAT ] Node ${node.name || node.host} websocket state=${wsState}; scheduling reconnect.`);
                    try { node.reconnect(); } catch (_) {}
                }
                continue;
            }

            const pendingPingAt = node.__dfordogHeartbeatPingAt;
            if (pendingPingAt && now - pendingPingAt >= PONG_TIMEOUT_MS) {
                terminateUnresponsiveSocket(
                    node,
                    `No pong received within ${Math.round(PONG_TIMEOUT_MS / 1000)}s`
                );
                continue;
            }

            if (!pendingPingAt) {
                try {
                    node.__dfordogHeartbeatPingAt = now;
                    ws.ping();
                } catch (error) {
                    terminateUnresponsiveSocket(node, `WebSocket ping failed: ${error?.message || error}`);
                }
            }
        }
    }, HEARTBEAT_INTERVAL_MS);

    interval.unref?.();

    riffy.__dfordogHeartbeatRecoveryInstalled = true;
    riffy.__dfordogHeartbeatRecoveryInterval = interval;
    console.log('[ RIFFY HEARTBEAT ] v9 transport heartbeat installed (30s ping / 12s pong timeout).');
}

function removePlayerBoundToDeadNode(riffy, options) {
    const guildId = options?.guildId;
    const existingPlayer = guildId ? riffy.players?.get(guildId) : null;
    if (!existingPlayer) return;

    const nodeHealthy = isNodeTransportHealthy(riffy, existingPlayer.node);
    if (nodeHealthy) return;

    const wsState = existingPlayer.node?.ws?.readyState;
    const mapped = isNodeMapped(riffy, existingPlayer.node);

    console.warn(`[ RIFFY HEARTBEAT ] Removing player bound to dead/unmapped node before createConnection for guild ${guildId}; nodeConnected=${existingPlayer.node?.connected === true} wsState=${wsState ?? 'none'} mapped=${mapped}.`);

    try {
        existingPlayer.playing = false;
        existingPlayer.paused = false;
        existingPlayer.connected = false;
        existingPlayer.destroy();
    } catch (error) {
        console.warn(`[ RIFFY HEARTBEAT ] Dead-node player cleanup failed for guild ${guildId}: ${error?.message || error}`);
    } finally {
        riffy.players?.delete(guildId);
    }
}

function installRiffyPrototypeHeartbeatPatch() {
    if (!Riffy?.prototype || Riffy.prototype.__dfordogHeartbeatPrototypeInstalled) return;

    const previousInit = Riffy.prototype.init;
    const previousCreateNode = Riffy.prototype.createNode;
    const previousCreateConnection = Riffy.prototype.createConnection;

    Riffy.prototype.init = function(...args) {
        const result = previousInit.apply(this, args);
        installHeartbeatForRiffy(this);
        return result;
    };

    Riffy.prototype.createNode = function(options) {
        const node = previousCreateNode.call(this, options);
        patchNode(node);
        return node;
    };

    Riffy.prototype.createConnection = function(options) {
        removePlayerBoundToDeadNode(this, options);
        return previousCreateConnection.call(this, options);
    };

    Object.defineProperty(Riffy.prototype, '__dfordogHeartbeatPrototypeInstalled', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
    });

    console.log('[ RIFFY HEARTBEAT ] v9 prototype patch loaded.');
}

function installManagerTransportTruthPatch() {
    let lavalinkModule;
    try {
        lavalinkModule = require('../lavalink.js');
    } catch (error) {
        console.warn(`[ RIFFY HEARTBEAT ] Unable to preload Lavalink manager transport patch: ${error?.message || error}`);
        return;
    }

    const previousInitialize = lavalinkModule.initializeLavalinkManager;
    if (typeof previousInitialize !== 'function' || previousInitialize.__dfordogHeartbeatWrapped) return;

    const patchManager = (manager) => {
        if (!manager || manager.__dfordogHeartbeatTransportTruthInstalled) return manager;

        const originalGetConnectedNodeCount = manager.getConnectedNodeCount?.bind(manager);
        const originalIsNodeConnected = manager.isNodeConnected?.bind(manager);

        manager.getConnectedNodeCount = function() {
            const runtimeNodes = this._getRiffyRuntimeNodes?.();
            if (!runtimeNodes) {
                return originalGetConnectedNodeCount ? originalGetConnectedNodeCount() : 0;
            }

            let nodes = [];
            if (runtimeNodes instanceof Map) nodes = [...runtimeNodes.values()];
            else if (Array.isArray(runtimeNodes)) nodes = runtimeNodes;
            else if (typeof runtimeNodes === 'object') nodes = Object.values(runtimeNodes);

            let count = 0;
            for (const node of nodes) {
                patchNode(node);
                if (node?.connected === true && node?.ws?.readyState === WS_OPEN) count++;
            }
            return count;
        };

        manager.hasConnectedNodes = function() {
            return this.getConnectedNodeCount() > 0;
        };

        manager.isNodeConnected = function(nodeId) {
            const nodeConfig = this.nodes?.get?.(nodeId);
            if (!nodeConfig) return false;

            const runtimeNode = this._findRiffyNodeObjectByConfig?.(nodeConfig);
            if (runtimeNode) {
                patchNode(runtimeNode);
                return runtimeNode.connected === true && runtimeNode.ws?.readyState === WS_OPEN;
            }

            return originalIsNodeConnected ? originalIsNodeConnected(nodeId) && false : false;
        };

        manager.__dfordogHeartbeatTransportTruthInstalled = true;
        console.log('[ LAVALINK ][RECOVERY] v9 node availability now requires an OPEN websocket, not only node.connected.');
        return manager;
    };

    const wrappedInitialize = async function(client) {
        const manager = await previousInitialize(client);
        patchManager(manager);
        return manager;
    };

    wrappedInitialize.__dfordogHeartbeatWrapped = true;
    lavalinkModule.initializeLavalinkManager = wrappedInitialize;

    try {
        patchManager(lavalinkModule.getLavalinkManager?.());
    } catch (_) {}
}

installRiffyPrototypeHeartbeatPatch();
installManagerTransportTruthPatch();

module.exports = {
    installHeartbeatForRiffy,
    installRiffyPrototypeHeartbeatPatch,
    installManagerTransportTruthPatch
};
