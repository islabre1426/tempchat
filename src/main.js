import {
    validate as uuidValidate,
    version as uuidVersion,
    v4 as uuidv4,
} from 'uuid';

import { Peer } from 'peerjs';

const container = document.getElementById('container');

const topNameElement = document.getElementById('top-name');

const chatContent = document.querySelector('#chat .content');
const uploadFiles = document.getElementById('upload-files');
const files = document.getElementById('files');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');

const nameDialog = document.getElementById('name-dialog');
const nameInput = document.getElementById('name');
const createAccountBtn = document.getElementById('create-account-btn');

const infoDialog = document.getElementById('info-dialog');
const infoDialogCloseButton = document.querySelector('#info-dialog .close-button');
const infoName = document.getElementById('info-name');
const copyId = document.getElementById('copy-id');

const systemName = 'System';

let hostInfo;
let noRemoteIdNotice = true;
let pendingConnection = null;

nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        nameDialog.close();

        handleNameDialog(nameInput);
    }
});

createAccountBtn.addEventListener('click', () => {
    handleNameDialog(document.getElementById('name'));
});

uploadFiles.addEventListener('click', () => files.click());

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        handleMessageSend(messageInput);
    };
});

sendButton.addEventListener('click', () => {
    handleMessageSend(document.getElementById('message-input'));
});

files.addEventListener('change', () => {
    if (!hostInfo.conn) {
        insertMessageText('You are not connected to anyone. Cannot send files.', systemName);
        files.value = '';
        return;
    }

    const fileListArray = Array.from(files.files);
    if (fileListArray.length === 0) return;

    const filesDataToSend = [];
    let combinedLinksHtml = '<div class="file-group">';

    fileListArray.forEach((file) => {
        const localUrl = URL.createObjectURL(file);

        combinedLinksHtml += `<div><a href="${localUrl}">${file.name}</a> (${formatBytes(file.size)})</div>`;
        
        filesDataToSend.push({
            fileName: file.name,
            fileData: file,
            fileSize: file.size,
            fileType: file.type,
        });
    });

    combinedLinksHtml += '</div>';

    // Show all download links as a single message
    insertMessageText(combinedLinksHtml, hostInfo.name);

    hostInfo.conn.send({
        type: 'filesBatch',
        files: filesDataToSend,
    });

    // Reset input so we can upload the same files again when needed
    files.value = '';
});

infoDialog.addEventListener('beforetoggle', () => {
    infoDialog.classList.toggle('open');
});

infoDialogCloseButton.addEventListener('click', () => {
    if (infoDialog.classList.contains('open')) {
        infoDialog.hidePopover();
    }
});



function handleNameDialog(inputElement) {
    const uuid = uuidv4();

    hostInfo = {
        name: inputElement.value,
        id: uuid,
        peer: new Peer(uuid),
        conn: null,
    };

    handlePeerEvent(hostInfo.peer);

    console.log('Account name:', hostInfo.name);
    console.log('Generated host ID:', hostInfo.id);

    topNameElement.textContent = `${hostInfo.name}`;
    infoName.textContent = `${hostInfo.name}`;
    copyId.textContent = `${hostInfo.id}`;

    handleCopyId();

    // Show the chat
    container.style.display = 'flex';
}

function handleMessageSend(messageElement) {
    let message = messageElement.value.trim();

    const commandRegex = /^\/[^\s\/].+$/m;
    const matchedCommand = commandRegex.exec(message);

    insertMessageText(message, hostInfo.name);

    messageElement.value = '';

    if (matchedCommand) {
        handleCommandFromMessage(matchedCommand[0]);
        return;
    }

    // Only send normal messages to remote
    if (hostInfo.conn) {
        hostInfo.conn.send(message);
    }

    if (noRemoteIdNotice) {
        const noticeMessage = `\
        You are not connected to any account. Any message you sent will remain on your machine and won't be seen by others.
        `;

        insertMessageText(noticeMessage, systemName);

        noRemoteIdNotice = false;
    }
}

function insertMessageText(message, author) {
    const threshold = 10;
    const isAtBottom = (chatContent.scrollHeight - chatContent.scrollTop - chatContent.clientHeight) <= threshold;

    const lastMessage = document.querySelector('.message-content.last');

    if (lastMessage) {
        lastMessage.classList.remove('last');
    }

    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');

    const currentTime = new Date();

    messageContainer.innerHTML = `
    <div class="header">
        <span class="time">
            <time datetime="${currentTime.toISOString()}">
                ${currentTime.toTimeString().split(' ')[0]}
            </time>
        </span>
        &mdash;
        <span class="author">${author}</span>
    </div>
    <div class="message-content last">
        <span>${message}</span>
    </div>
    `;

    chatContent.appendChild(messageContainer);

    if (isAtBottom) {
        chatContent.scrollTop = chatContent.scrollHeight;
    }
}

function handleCommandFromMessage(command) {
    const commandParts = command.split(' ');

    switch (commandParts[0]) {
        case '/help':
            insertMessageText('Available commands:', systemName);

            const messageContentLast = document.querySelector('.message-content.last');
            const commandsList = {
                '/help': 'Show this message',
                '/connect <id>': 'Connect to a remote peer with the ID <id>',
                '/accept': 'Accept an incoming connection',
                '/deny': 'Deny an incoming connection',
            };

            buildHelpMessage(commandsList, messageContentLast);

            break;

        case '/connect':
            const remoteId = commandParts[1];

            console.log('Input remote ID:', remoteId);

            if (remoteId === hostInfo.id) {
                const errorMessage = `You cannot connect to yourself.`;

                insertMessageText(errorMessage, systemName);

                break;
            }

            if (!validateUuid(remoteId)) {
                const errorMessage = `Invalid id for /connect command. Please make sure the id is correct.`;

                insertMessageText(errorMessage, systemName);

                break;
            }

            insertMessageText(
                `Connecting to ${remoteId}...`,
                systemName,
            )

            hostInfo.conn = hostInfo.peer.connect(remoteId, {
                metadata: {
                    name: hostInfo.name,
                },
            });

            handleDataConnectionEvent(hostInfo.conn);

            noRemoteIdNotice = false;

            break;

        case '/accept':
            if (pendingConnection) {
                hostInfo.conn = pendingConnection;

                handleDataConnectionEvent(pendingConnection);

                insertMessageText(
                    `Accepted connection from ${pendingConnection.metadata.name}.`,
                    systemName,
                );

                pendingConnection = null;
                noRemoteIdNotice = false;
            } else {
                insertMessageText('No incoming connection to accept.', systemName);
            }

            break;

        case '/deny':
            if (pendingConnection) {
                insertMessageText(
                    `Denied connection from ${pendingConnection.metadata.name}.`,
                    systemName,
                );

                // Explicitly close/reject the connection
                pendingConnection.close();
                pendingConnection = null;
            } else {
                insertMessageText('No incoming connection to deny.', systemName);
            }

            break;

        default:
    }
}

function handlePeerEvent(peer) {
    peer.on('open', (id) => {
        insertMessageText(
            `Connected to relay server with the ID ${id}.`,
            systemName,
        );
    });

    peer.on('connection', (incomingConn) => {
        insertMessageText(
            `Connection attempt from ID ${incomingConn.peer} with name ${incomingConn.metadata.name}. Use /accept or /deny to accept or deny.`,
            systemName,
        );

        pendingConnection = incomingConn;
    });

    peer.on('disconnected', () => {
        insertMessageText(
            `Connection to relay server disconnected. Attempting to reconnect...`,
            systemName,
        );

        peer.reconnect();
    });

    peer.on('error', (err) => {
        insertMessageText(
            `Error: ${err}`,
            systemName,
        )
    });
}

function handleDataConnectionEvent(conn) {
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
            // Handle handshake message
            if (typeof data === 'object') {
                if (data.type === 'handshake') {
                    remoteName = data.name;
                    insertMessageText(`Connected to ${remoteName}.`, systemName);
                    return;
                }

                if (data.type === 'filesBatch' && Array.isArray(data.files)) {
                    let combinedLinksHtml = '<div class="file-group">';

                    data.files.forEach((file) => {
                        const blob = new Blob([file.fileData], { type: file.fileType });
                        const downloadUrl = URL.createObjectURL(blob);

                        combinedLinksHtml += `<div><a href="${downloadUrl}">${file.fileName}</a> (${formatBytes(file.fileSize)})</div>`;
                    });

                    combinedLinksHtml += '</div>';

                    // Insert the bundled payload message once
                    insertMessageText(combinedLinksHtml, remoteName);
                    return;
                }
            }

            // Handle regular message
            insertMessageText(data, remoteName);
        });
    };

    if (conn.open) {
        onConnectionOpen();
    } else {
        conn.on('open', onConnectionOpen);
    }

    conn.on('close', () => {
        insertMessageText(`Connection to ${conn.peer} closed.`, systemName);

        noRemoteIdNotice = true;
    });
}

function buildHelpMessage(commands, element) {
    const table = document.createElement('table');

    Object.keys(commands).forEach((cmd) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = cmd;

        const tdInfo = document.createElement('td');
        tdInfo.textContent = commands[cmd];

        tr.append(tdName, tdInfo);

        table.appendChild(tr);
    });

    element.appendChild(table);
}

function handleCopyId() {
    const copyId = document.getElementById('copy-id');

    copyId.addEventListener('click', async () => {
        await navigator.clipboard.writeText(copyId.textContent);
    });
}

function validateUuid(uuid) {
    return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}

function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    // Math.log determines which index of the array to use based on powers of 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}