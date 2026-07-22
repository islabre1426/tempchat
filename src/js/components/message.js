import {
    validate as uuidValidate,
    version as uuidVersion,
} from 'uuid';

import { hostInfo, state, systemName } from './constants.js';
import { handleDataConnectionEvent } from './peer.js';

export function insertMessage(message, author) {
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

    const lastMessage = document.querySelector('.message-content.last');

    if (lastMessage) {
        lastMessage.classList.remove('last');
    }

    const chatContent = document.querySelector('#chat .content');
    if (!chatContent) return;

    // Measure threshold before inserting
    const isAtBottom = isElementAtBottom(chatContent);

    chatContent.appendChild(messageContainer);

    // Keep it fixed when inserting message
    if (isAtBottom) {
        scrollToBottom(chatContent);
    }
}

export function handleMessageSend(messageElement) {
    let message = messageElement.value.trim();

    const commandRegex = /^\/[^\s\/].+$/m;
    const matchedCommand = commandRegex.exec(message);

    insertMessage(message, hostInfo.name);

    messageElement.value = '';

    if (matchedCommand) {
        handleCommandFromMessage(matchedCommand[0]);
        return;
    }

    // Only send normal messages to remote
    if (hostInfo.conn) {
        hostInfo.conn.send(message);
    }

    if (state.noRemoteIdNotice) {
        const noticeMessage = `\
        You are not connected to any account. Any message you sent will remain on your machine and won't be seen by others.
        `;

        insertMessage(noticeMessage, systemName);

        state.noRemoteIdNotice = false;
    }
}

function handleCommandFromMessage(command) {
    const commandParts = command.split(' ');

    switch (commandParts[0]) {
        case '/help':
            insertMessage('Available commands:', systemName);

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

            if (remoteId === hostInfo.id) {
                insertMessage(
                    `You cannot connect to yourself.`,
                    systemName
                );

                break;
            }

            if (!validateUuid(remoteId)) {
                insertMessage(
                    `Invalid id for /connect command. Please make sure the id is correct.`,
                    systemName
                );

                break;
            }

            insertMessage(`Connecting to ${remoteId}...`, systemName);

            hostInfo.conn = hostInfo.peer.connect(remoteId, {
                metadata: {
                    name: hostInfo.name,
                },
            });

            handleDataConnectionEvent(hostInfo.conn);

            state.noRemoteIdNotice = false;

            break;

        case '/accept':
            if (state.pendingConnection) {
                hostInfo.conn = state.pendingConnection;

                handleDataConnectionEvent(state.pendingConnection);

                insertMessage(
                    `Accepted connection from ${state.pendingConnection.metadata.name}.`,
                    systemName,
                );

                state.pendingConnection = null;
                state.noRemoteIdNotice = false;
            } else {
                insertMessage('No incoming connection to accept.', systemName);
            }

            break;

        case '/deny':
            if (state.pendingConnection) {
                insertMessage(
                    `Denied connection from ${state.pendingConnection.metadata.name}.`,
                    systemName,
                );

                // Explicitly close/reject the connection
                state.pendingConnection.close();
                state.pendingConnection = null;
            } else {
                insertMessage('No incoming connection to deny.', systemName);
            }

            break;

        default:
    }
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

    const chatContent = document.querySelector('#chat .content');
    if (!chatContent) return;

    const isAtBottom = isElementAtBottom(chatContent);

    element.appendChild(table);

    if (isAtBottom) {
        scrollToBottom(chatContent);
    }
}

function validateUuid(uuid) {
    return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}

function isElementAtBottom(element, threshold = 5) {
    return Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < threshold;
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}