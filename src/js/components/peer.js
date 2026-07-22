import { insertMessage } from './message.js';
import { systemName, state, hostInfo } from './constants.js';
import { formatBytes } from './util.js';

export function handlePeerEvent(peer) {
    peer.on('open', (id) => {
        insertMessage(
            `Connected to relay server with the ID ${id}.`,
            systemName,
        );

        insertMessage(
            'Welcome to tempchat! Send a message or use /help for a list of commands.',
            systemName,
        );
    });

    peer.on('connection', (incomingConn) => {
        insertMessage(
            `Connection attempt from ID ${incomingConn.peer} with name ${incomingConn.metadata.name}. Use /accept or /deny to accept or deny.`,
            systemName,
        );

        state.pendingConnection = incomingConn;
    });

    peer.on('disconnected', () => {
        insertMessage(
            `Connection to relay server disconnected. Attempting to reconnect...`,
            systemName,
        );

        peer.reconnect();
    });

    peer.on('error', (err) => {
        insertMessage(err, systemName);
    });
}

export function handleDataConnectionEvent(conn) {
    // We don't immediately know the remote's name,
    // so we should fallback to remote's ID until they introduce themselves.
    let remoteName = conn.metadata?.name || `Peer ${conn.peer}`;

    const onConnectionOpen = () => {
        // Send host info to the remote so they know who we are
        conn.send({
            type: 'handshake',
            name: hostInfo.name,
        });

        conn.on('data', (data) => {
            if (typeof data === 'object') {
                if (data.type === 'handshake') {
                    remoteName = data.name;

                    insertMessage(
                        `Connected to ${remoteName}.`,
                        systemName
                    );

                    return;
                }

                if (data.type === 'filesBatch' && Array.isArray(data.files)) {
                    // Bundle multiple files payload into one message
                    let combinedLinksHtml = '<div class="file-group">';

                    data.files.forEach((file) => {
                        const blob = new Blob([file.fileData], { type: file.fileType });
                        const downloadUrl = URL.createObjectURL(blob);

                        combinedLinksHtml += `
                        <div>
                            <a href="${downloadUrl}" target="_blank">${file.fileName}</a>
                            (${formatBytes(file.fileSize)})
                        </div>
                        `;
                    });

                    combinedLinksHtml += '</div>';

                    insertMessage(combinedLinksHtml, remoteName);

                    return;
                }
            }

            // Handle regular message
            insertMessage(data, remoteName);
        });
    };

    // Connection may or may not be already opened
    if (conn.open) {
        onConnectionOpen();
    } else {
        conn.on('open', onConnectionOpen);
    }

    conn.on('close', () => {
        insertMessage(`Connection to ${conn.peer} closed.`, systemName);
        state.noRemoteIdNotice = true;
    });
}