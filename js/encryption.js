document.addEventListener('DOMContentLoaded', function () {
    let encryptedFiles = {}; // Store encrypted files in memory

    // Utility function to convert ArrayBuffer to Base64
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 8192; // Process in smaller chunks
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }

    // Utility function to convert Base64 to ArrayBuffer
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            buffer[i] = binary.charCodeAt(i);
        }
        return buffer;
    }

    // Function to generate encryption key from password and salt
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

    // Function to encrypt the file and generate a link
    async function encryptFile(file, password) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await generateKey(password, salt);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const fileData = await file.arrayBuffer();
        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            fileData
        );

        return { encryptedData, salt, iv };
    }

    // Function to handle the file encryption and generate a link
    async function encryptFileAndGenerateLink(file, filePassword) {
        console.log('Encrypting file:', file.name); // Debugging line
        const { encryptedData, salt, iv } = await encryptFile(file, filePassword);

        // Generate a unique identifier (link)
        const fileId = Date.now().toString(); // Simple unique identifier
        encryptedFiles[fileId] = {
            encryptedData: arrayBufferToBase64(encryptedData),
            salt: arrayBufferToBase64(salt.buffer),
            iv: arrayBufferToBase64(iv.buffer),
            password: filePassword, // Store the password for decryption
            originalFilename: file.name // Store the original filename
        };

        // Store encrypted files in localStorage
        localStorage.setItem('encryptedFiles', JSON.stringify(encryptedFiles));

        console.log('File encrypted successfully. File ID:', fileId); // Debugging line

        // Generate a download link for the encrypted file
        const encryptedBlob = new Blob([encryptedData]);

        // Generate URL for the Blob (download link)
        const url = URL.createObjectURL(encryptedBlob);

        // Display the download button and the generated link
        const downloadButton = document.getElementById('downloadEncryptedButton');
        downloadButton.style.display = 'inline-block';
        downloadButton.onclick = function () {
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name + '.enc'; // Adding .enc extension to denote encrypted file
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // Display the generated link in the textarea
        const linkOutput = document.getElementById('linkOutput');
        linkOutput.value = `${window.location.href}?fileId=${fileId}`; // Display the generated link

        return fileId; // Return the unique identifier
    }

    // Listen to the encrypt button
    document.getElementById('encryptButton').addEventListener('click', async () => {
        const fileInput = document.getElementById('fileInput');
        const filePassword = document.getElementById('filePassword').value;

        if (fileInput.files.length === 0 || !filePassword) {
            alert('Please select a file and enter a password.');
            return;
        }

        const file = fileInput.files[0];
        try {
            await encryptFileAndGenerateLink(file, filePassword);
        } catch (error) {
            console.error('Error during encryption:', error);
            alert('Encryption failed: ' + error.message);
        }
    });

    // Function to copy the generated link to clipboard
    document.getElementById('copyLinkButton').addEventListener('click', () => {
        const linkOutput = document.getElementById('linkOutput');
        linkOutput.select();
        document.execCommand('copy');
        alert('Link copied to clipboard!');
    });
});
