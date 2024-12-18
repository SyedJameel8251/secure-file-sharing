# Secure File Sharing System

This project allows users to securely upload, encrypt, and share files. It provides functionality to:
- Upload a file and encrypt it using a password.
- Generate a secure link to share the encrypted file.
- Decrypt the file using the password and download it.

## Features
- File encryption using AES-GCM algorithm.
- Password protection for both encryption and decryption.
- Link generation for sharing encrypted files.
- File decryption and download option.

## How to Use
1. Open `index.html` to encrypt a file.
2. Upload a file and enter a password.
3. Click on "Encrypt and Share" to generate a secure link.
4. Share the generated link for others to download and decrypt the file.

### Decrypting the File
1. Open `decrypt.html` to decrypt the file.
2. Paste the generated link in the "Paste link here" field.
3. Enter the password used for encryption.
4. Click on "Decrypt and Download" to get the decrypted file.

## Technologies Used
- HTML, CSS, JavaScript
- AES-GCM for file encryption and decryption
- GitHub Pages for hosting the project

## License
This project is licensed under the MIT License.
