import { v4 as uuidv4 } from 'uuid';
import { Peer } from 'peerjs';

import { hostInfo, peerOptions, systemName } from './constants.js';
import { handlePeerEvent } from './peer.js';
import { insertMessage } from './message.js';

export function handleNameDialog(inputElement) {
    const uuid = uuidv4();

    hostInfo.name = inputElement.value;
    hostInfo.id = uuid;
    hostInfo.peer = new Peer(uuid, peerOptions);

    handlePeerEvent(hostInfo.peer);

    insertMessage('Connecting to relay server...', systemName);

    const topNameElement = document.getElementById('top-name');
    const infoName = document.getElementById('info-name');
    const copyId = document.getElementById('copy-id');
    const container = document.getElementById('container');

    if (!topNameElement || !infoName || !copyId || !container) return;

    topNameElement.textContent = hostInfo.name;
    infoName.textContent = hostInfo.name;
    copyId.textContent = hostInfo.id;

    handleCopyId();

    // Show the chat
    container.style.display = 'flex';
}

function handleCopyId() {
    const copyId = document.getElementById('copy-id');

    if (!copyId) return;

    copyId.addEventListener('click', async () => {
        await navigator.clipboard.writeText(copyId.textContent);
    });
}