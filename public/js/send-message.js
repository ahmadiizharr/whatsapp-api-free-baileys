// Initialize QR code instance
let qrcode = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize QR Code instance
    qrcode = new QRCode("qr-code", {
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    loadConnectionStatus();
    loadMessageHistory();

    const form = document.getElementById('message-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendMessage();
    });

    // Check connection status every 10 seconds
    setInterval(loadConnectionStatus, 10000);
});

async function loadConnectionStatus() {
    try {
        const response = await fetch('/api/devices/status');
        const data = await response.json();
        const statusDiv = document.getElementById('connection-status');
        const qrDiv = document.getElementById('qr-code');
        const sendButton = document.getElementById('send-button');

        if (data.success) {
            if (data.isConnected) {
                statusDiv.className = 'alert alert-success';
                statusDiv.textContent = 'Connected to WhatsApp';
                qrDiv.style.display = 'none';
                if (qrcode) {
                    qrcode.clear();
                }
                sendButton.disabled = false;
            } else if (data.qr) {
                statusDiv.className = 'alert alert-warning';
                statusDiv.textContent = 'Not connected. Scan the QR code below to connect:';
                qrDiv.style.display = 'block';
                if (qrcode) {
                    qrcode.clear();
                    qrcode.makeCode(data.qr);
                }
                sendButton.disabled = true;
            } else {
                statusDiv.className = 'alert alert-warning';
                statusDiv.textContent = 'Waiting for connection...';
                qrDiv.style.display = 'none';
                if (qrcode) {
                    qrcode.clear();
                }
                sendButton.disabled = true;
            }
        } else {
            statusDiv.className = 'alert alert-danger';
            statusDiv.textContent = 'Error checking connection status';
            qrDiv.style.display = 'none';
            if (qrcode) {
                qrcode.clear();
            }
            sendButton.disabled = true;
        }
    } catch (error) {
        console.error('Error loading connection status:', error);
        const statusDiv = document.getElementById('connection-status');
        statusDiv.className = 'alert alert-danger';
        statusDiv.textContent = 'Error checking connection status';
        document.getElementById('qr-code').style.display = 'none';
        if (qrcode) {
            qrcode.clear();
        }
        document.getElementById('send-button').disabled = true;
    }
}

async function sendMessage() {
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send-button');

    const phone = phoneInput.value.trim();
    const message = messageInput.value.trim();

    if (!phone || !message) {
        showAlert('Please enter both phone number and message.', 'warning');
        return;
    }

    sendButton.disabled = true;
    sendButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

    try {
        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to: phone, message })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Message sent successfully', 'success');
            phoneInput.value = '';
            messageInput.value = '';
            loadMessageHistory();
        } else {
            showAlert('Failed to send message: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showAlert('Error sending message', 'danger');
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = 'Send Message';
    }
}

async function loadMessageHistory() {
    try {
        const response = await fetch('/api/messages/history');
        const data = await response.json();

        const tbody = document.getElementById('message-history');
        tbody.innerHTML = '';

        if (data.success && Array.isArray(data.data)) {
            data.data.forEach(msg => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(msg.createdAt).toLocaleString()}</td>
                    <td>${escapeHtml(msg.to)}</td>
                    <td>${escapeHtml(msg.message)}</td>
                    <td>
                        <span class="badge ${getBadgeClass(msg.status)}">
                            ${escapeHtml(msg.status)}
                        </span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No message history available</td></tr>';
        }
    } catch (error) {
        console.error('Error loading message history:', error);
        const tbody = document.getElementById('message-history');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading message history</td></tr>';
    }
}

function getBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'sent':
        case 'completed':
            return 'bg-success';
        case 'pending':
            return 'bg-warning';
        case 'failed':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}
