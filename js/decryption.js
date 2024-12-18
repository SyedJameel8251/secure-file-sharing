// Utility function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
}

// Function to generate decryption key from password and salt
async function generateKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    const key = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return key;
}

// Function to decrypt the file
async function decryptFile(fileId, password) {
    // Retrieve encrypted files from localStorage
    const encryptedFiles = JSON.parse(localStorage.getItem('encryptedFiles'));
    
    if (!encryptedFiles) {
        throw new Error('Encrypted files not found in localStorage.');
    }

    const fileData = encryptedFiles[fileId];
    if (!fileData) {
        throw new Error('File not found.');
    }

    const salt = base64ToArrayBuffer(fileData.salt);
    const iv = base64ToArrayBuffer(fileData.iv);
    const encryptedData = base64ToArrayBuffer(fileData.encryptedData);

    const key = await generateKey(password, salt);
    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encryptedData
    );

    return {
        decryptedBlob: new Blob([decryptedData]),
        originalFilename: fileData.originalFilename
    }; // Return decrypted data and original filename
}

// Listen to the decrypt button
document.getElementById('decryptButton').addEventListener('click', async () => {
    const linkInput = document.getElementById('linkInput');
    const filePassword = document.getElementById('decryptPassword').value;

    if (!linkInput.value || !filePassword) {
        alert('Please paste the link and enter a password.');
        return;
    }

    // Extract fileId from the link
    const urlParams = new URLSearchParams(linkInput.value.split('?')[1]);
    const fileId = urlParams.get('fileId');

    if (!fileId) {
        console.error('Error: fileId not found in the link.');
        alert('File ID not found in the provided link.');
        return;
    }

    try {
        const { decryptedBlob, originalFilename } = await decryptFile(fileId, filePassword);
        const url = URL.createObjectURL(decryptedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalFilename; // Use the original filename for download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error during decryption:', error);
        alert('Decryption failed: ' + error.message);
    }
});
