import { hostInfo, systemName } from './constants.js';
import { insertMessage } from './message.js';
import { formatBytes } from './util.js';

export function handleFilesSend() {
    const files = document.getElementById('files');
    if (!files) return;

    if (!hostInfo.conn) {
        insertMessage('You are not connected to anyone. Cannot send files.', systemName);

        files.value = '';
        return;
    }

    const fileList = Array.from(files.files);
    if (fileList.length === 0) return;

    // Combine all files into a single message
    const filesToSend = [];
    let combinedLinksHtml = '<div class="file-group">';

    fileList.forEach((file) => {
        const localUrl = URL.createObjectURL(file);

        combinedLinksHtml += `
        <div>
            <a href="${localUrl}" target="_blank">${file.name}</a>
            (${formatBytes(file.size)})
        </div>
        `;
        
        filesToSend.push({
            fileName: file.name,
            fileData: file,
            fileSize: file.size,
            fileType: file.type,
        });
    });

    combinedLinksHtml += '</div>';

    insertMessage(combinedLinksHtml, hostInfo.name);

    hostInfo.conn.send({
        type: 'filesBatch',
        files: filesToSend,
    });

    // Reset input so we can upload the same files again when needed
    files.value = '';
}