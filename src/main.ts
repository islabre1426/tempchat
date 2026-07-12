import {
    validate as uuidValidate,
    version as uuidVersion,
    v4 as uuidv4,
} from 'uuid';

import { Peer } from 'peerjs';

const container = document.getElementById('container') as HTMLDivElement;

const topIdElement = document.querySelector('#chat .id') as HTMLSpanElement;
const topNameElement = document.querySelector('#chat .name') as HTMLSpanElement;

const chatContent = document.querySelector('#chat .content') as HTMLDivElement;
const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
const sendButton = document.getElementById('send-btn') as HTMLInputElement;

const nameDialog = document.getElementById('name-dialog') as HTMLDialogElement;
const nameInput = document.getElementById('name') as HTMLInputElement;
const createAccountBtn = document.getElementById('create-account-btn') as HTMLButtonElement;

const systemName = 'System';

type peerInfo = {
    name: string,
    id: string,
    peer: Peer,
};

let hostInfo: peerInfo;
let remoteInfo: peerInfo;

let noRemoteIdNotice: boolean = true;

nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        nameDialog.close();

        handleNameDialog(nameInput);
    }
});

createAccountBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('name') as HTMLInputElement;

    handleNameDialog(nameInput);
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        handleMessageSend(messageInput)
    };
});

sendButton.addEventListener('click', () => {
    const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;

    handleMessageSend(messageInput);
});



function handleNameDialog(inputElement: HTMLInputElement) {
    const uuid = uuidv4();

    hostInfo = {
        name: inputElement.value,
        id: uuid,
        peer: new Peer(uuid),
    };

    console.log('Account name:', hostInfo.name);
    console.log('Generated host ID:', hostInfo.id);

    topIdElement.textContent = `Your ID: ${hostInfo.id}`;
    topNameElement.textContent = `Your name: ${hostInfo.name}`;

    // Show the chat
    container.style.display = 'flex';
}

function handleMessageSend(messageElement: HTMLTextAreaElement) {
    let message = messageElement.value.trim();

    const commandRegex = /^\/[^\s\/].+$/m;

    const matchedCommand = commandRegex.exec(message);

    insertMessageText(message, hostInfo.name);

    messageElement.value = '';

    if (matchedCommand) {
        handleCommandFromMessage(matchedCommand[0]);
        return;
    }

    if (noRemoteIdNotice) {
        const noticeMessage = `\
        You are not connected to any account. Any message you sent will remain on your machine and won't be seen by others.
        `;

        insertMessageText(noticeMessage, systemName);

        noRemoteIdNotice = false;
    }
}

function insertMessageText(message: string, author: string) {
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
    <div class="message-content">
        <span>${message}</span>
    </div>
    `;

    chatContent.appendChild(messageContainer);
}

function handleCommandFromMessage(command: string) {
    const commandParts = command.split(' ');

    switch (commandParts[0]) {
        case '/help':
            const helpMessage = `\
            Available command:
            <table>
                <tr>
                    <td>/help</td>
                    <td>Show this message</td>
                </tr>

                <tr>
                    <td>/connect &lt;id&gt;</td>
                    <td>Connect to a remote account using &lt;id&gt;</td>
                </tr>
            </table>\
            `;

            insertMessageText(helpMessage, systemName);

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

            // TODO: Connect to remote peer
            // hostInfo.peer.connect(remoteId, {

            // });

            break;

        default:
    }
}

function validateUuid(uuid: string) {
    return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}