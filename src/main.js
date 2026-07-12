import {
    validate as uuidValidate,
    version as uuidVersion,
    v4 as uuidv4,
} from 'uuid';

const container = document.getElementById('container');

const topIdElement = document.querySelector('#chat .id');
const topNameElement = document.querySelector('#chat .name');

const chatContent = document.querySelector('#chat .content');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');

const nameDialog = document.getElementById('name-dialog');
const nameInput = document.getElementById('name');
const createAccountBtn = document.getElementById('create-account-btn');

const systemName = 'System';

let hostInfo, remoteInfo;

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

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();

        handleMessageSend(messageInput)
    };
});

sendButton.addEventListener('click', () => {
    handleMessageSend(document.getElementById('message-input'));
});



function handleNameDialog(inputElement) {
    const uuid = uuidv4();

    hostInfo = {
        name: inputElement.value,
        id: uuid,
    };

    console.log('Account name:', hostInfo.name);
    console.log('Generated host ID:', hostInfo.id);

    topIdElement.textContent = `Your ID: ${hostInfo.id}`;
    topNameElement.textContent = `Your name: ${hostInfo.name}`;

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

    if (!remoteInfo) {
        const noticeMessage = `\
        You are not connected to any account. Any message you sent will remain on your machine and won't be seen by others.
        `;

        insertMessageText(noticeMessage, systemName);

        noRemoteIdNotice = false;
    }
}

function insertMessageText(message, author) {
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

function handleCommandFromMessage(command) {
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

            break;

        default:
    }
}

function validateUuid(uuid) {
    return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}