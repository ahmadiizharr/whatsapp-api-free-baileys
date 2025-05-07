// Initialize Bootstrap modals and QR code instance
let addAutoreplyModal = null;
let qrcode = null;

document.addEventListener('DOMContentLoaded', () => {
    addAutoreplyModal = new bootstrap.Modal(document.getElementById('addAutoreplyModal'));
    loadAutoreplies();
    checkConnectionStatus();
    
    // Initialize QR Code instance
    qrcode = new QRCode("qr-code", {
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
});

// Load autoreply rules
async function loadAutoreplies() {
    try {
        const response = await fetch('/api/autoreplies');
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('autoreply-list');
            tbody.innerHTML = '';
            
            data.data.forEach(rule => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escapeHtml(rule.trigger)}</td>
                    <td>${escapeHtml(rule.response)}</td>
                    <td>${rule.isExactMatch ? 'Yes' : 'No'}</td>
                    <td>
                        <span class="badge ${rule.isActive ? 'bg-success' : 'bg-danger'}">
                            ${rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-${rule.isActive ? 'warning' : 'success'}" 
                                onclick="toggleAutoreply(${rule.id}, ${!rule.isActive})">
                            ${rule.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAutoreply(${rule.id})">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            showAlert('Error loading autoreplies: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error loading autoreplies:', error);
        showAlert('Error loading autoreplies', 'danger');
    }
}

// Delete WhatsApp session
async function deleteSession() {
    if (!confirm('Are you sure you want to delete the current session? This will disconnect WhatsApp and require re-scanning the QR code.')) {
        return;
    }

    try {
        const response = await fetch('/api/devices/session', {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showAlert('Session deleted successfully. Please wait for the QR code.', 'success');
            setTimeout(checkConnectionStatus, 2000); // Check status after 2 seconds
        } else {
            showAlert('Error deleting session: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        showAlert('Error deleting session', 'danger');
    }
}

// Check WhatsApp connection status
async function checkConnectionStatus() {
    try {
        const response = await fetch('/api/devices/status');
        const data = await response.json();
        
        const statusDiv = document.getElementById('connection-status');
        const qrDiv = document.getElementById('qr-code');
        
        if (data.success) {
            if (data.isConnected) {
                statusDiv.innerHTML = '<div class="alert alert-success">Connected to WhatsApp</div>';
                qrDiv.innerHTML = ''; // Clear QR code
                if (qrcode) {
                    qrcode.clear(); // Clear QR code instance
                }
            } else if (data.qr) {
                statusDiv.innerHTML = '<div class="alert alert-warning">Waiting for WhatsApp connection. Scan the QR code below:</div>';
                if (qrcode) {
                    qrcode.clear(); // Clear previous QR code
                    qrcode.makeCode(data.qr); // Generate new QR code
                }
            } else {
                statusDiv.innerHTML = '<div class="alert alert-warning">Waiting for connection...</div>';
                qrDiv.innerHTML = ''; // Clear QR code
                if (qrcode) {
                    qrcode.clear(); // Clear QR code instance
                }
            }
        } else {
            statusDiv.innerHTML = '<div class="alert alert-danger">Error checking connection status</div>';
            qrDiv.innerHTML = ''; // Clear QR code
            if (qrcode) {
                qrcode.clear(); // Clear QR code instance
            }
        }
    } catch (error) {
        console.error('Error checking connection status:', error);
        document.getElementById('connection-status').innerHTML = 
            '<div class="alert alert-danger">Error checking connection status</div>';
        if (qrcode) {
            qrcode.clear(); // Clear QR code instance
        }
    }
}

// Save new autoreply rule
async function saveAutoreply() {
    const form = document.getElementById('autoreply-form');
    const formData = new FormData(form);
    
    const data = {
        trigger: formData.get('trigger'),
        response: formData.get('response'),
        isExactMatch: formData.get('isExactMatch') === 'on'
    };

    try {
        const response = await fetch('/api/autoreplies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            addAutoreplyModal.hide();
            form.reset();
            showAlert('Autoreply rule created successfully', 'success');
            loadAutoreplies();
        } else {
            showAlert('Error creating autoreply: ' + result.message, 'danger');
        }
    } catch (error) {
        console.error('Error saving autoreply:', error);
        showAlert('Error saving autoreply', 'danger');
    }
}

// Toggle autoreply active status
async function toggleAutoreply(id, isActive) {
    try {
        const response = await fetch(`/api/autoreplies/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive })
        });

        const data = await response.json();
        
        if (data.success) {
            showAlert('Autoreply status updated successfully', 'success');
            loadAutoreplies();
        } else {
            showAlert('Error updating autoreply: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error toggling autoreply:', error);
        showAlert('Error updating autoreply', 'danger');
    }
}

// Delete autoreply rule
async function deleteAutoreply(id) {
    if (!confirm('Are you sure you want to delete this autoreply rule?')) {
        return;
    }

    try {
        const response = await fetch(`/api/autoreplies/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showAlert('Autoreply rule deleted successfully', 'success');
            loadAutoreplies();
        } else {
            showAlert('Error deleting autoreply: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting autoreply:', error);
        showAlert('Error deleting autoreply', 'danger');
    }
}

// Helper function to show alerts
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

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}
