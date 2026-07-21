import {
    validate as uuidValidate,
    version as uuidVersion,
    v4 as uuidv4,
} from 'uuid';

import { Peer } from 'peerjs';

import { handleNameDialog } from './components/dialog.js';
import { handleMessageSend, insertMessage } from './components/message.js';
import { handleDataConnectionEvent } from './components/peer.js';
import { formatBytes } from './components/util.js';
import { handleFilesSend } from './components/file.js';

const uploadFiles = document.getElementById('upload-files');
const files = document.getElementById('files');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');

const nameDialog = document.getElementById('name-dialog');
const nameInput = document.getElementById('name');
const createAccountBtn = document.getElementById('create-account-btn');

const infoDialog = document.getElementById('info-dialog');
const infoDialogCloseButton = document.querySelector('#info-dialog .close-button');

nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        nameDialog.close();

        handleNameDialog(nameInput);
    }
});

createAccountBtn.addEventListener('click', () => {
    const name = document.getElementById('name');
    if (!name) return;

    handleNameDialog(name);
});

uploadFiles.addEventListener('click', () => files.click());

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        handleMessageSend(messageInput);
    };
});

sendButton.addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    handleMessageSend(messageInput);
});

files.addEventListener('change', handleFilesSend);

infoDialog.addEventListener('beforetoggle', () => {
    infoDialog.classList.toggle('open');
});

infoDialogCloseButton.addEventListener('click', () => {
    const isOpen = infoDialog.classList.contains('open');

    if (isOpen) infoDialog.hidePopover();
});