// Initialize Bootstrap modal
let editWebhookModal = null;
document.addEventListener('DOMContentLoaded', () => {
    editWebhookModal = new bootstrap.Modal(document.getElementById('editWebhookModal'));
    loadWebhooks();

    // Setup form handlers
    document.getElementById('webhook-form').addEventListener('submit', handleCreateWebhook);
    document.getElementById('edit-webhook-form').addEventListener('submit', handleEditWebhook);
});

async function loadWebhooks() {
    try {
        const response = await fetch('/api/webhooks');
        const data = await response.json();

        const tbody = document.getElementById('webhooks-table').getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';

        if (data.success && Array.isArray(data.data)) {
            data.data.forEach(webhook => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escapeHtml(webhook.name)}</td>
                    <td>${escapeHtml(webhook.url)}</td>
                    <td>${escapeHtml(webhook.events.join(', '))}</td>
                    <td>
                        <span class="badge ${webhook.isActive ? 'bg-success' : 'bg-danger'}">
                            ${webhook.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>${webhook.lastTrigger ? new Date(webhook.lastTrigger).toLocaleString() : 'Never'}</td>
                    <td>${webhook.failureCount}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-info" onclick="testWebhook('${webhook.id}')">
                                Test
                            </button>
                            <button class="btn btn-primary" onclick="showEditWebhook('${webhook.id}', ${JSON.stringify(webhook).replace(/"/g, '"')})">
                                Edit
                            </button>
                            <button class="btn btn-danger" onclick="deleteWebhook('${webhook.id}')">
                                Delete
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No webhooks found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading webhooks:', error);
        showAlert('Error loading webhooks', 'danger');
    }
}

async function handleCreateWebhook(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            url: formData.get('url'),
            events: formData.get('events').split(',').map(e => e.trim()).filter(e => e),
            secret: formData.get('secret') || undefined
        };

        const response = await fetch('/api/webhooks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Webhook created successfully', 'success');
            form.reset();
            loadWebhooks();
        } else {
            showAlert('Error creating webhook: ' + result.message, 'danger');
        }
    } catch (error) {
        console.error('Error creating webhook:', error);
        showAlert('Error creating webhook', 'danger');
    } finally {
        submitButton.disabled = false;
    }
}

function showEditWebhook(id, webhook) {
    document.getElementById('edit-webhook-id').value = id;
    document.getElementById('edit-webhook-name').value = webhook.name;
    document.getElementById('edit-webhook-url').value = webhook.url;
    document.getElementById('edit-webhook-events').value = webhook.events.join(', ');
    document.getElementById('edit-webhook-secret').value = webhook.secret || '';
    document.getElementById('edit-webhook-active').checked = webhook.isActive;
    editWebhookModal.show();
}

async function handleEditWebhook(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        const id = document.getElementById('edit-webhook-id').value;
        const data = {
            name: document.getElementById('edit-webhook-name').value,
            url: document.getElementById('edit-webhook-url').value,
            events: document.getElementById('edit-webhook-events').value.split(',').map(e => e.trim()).filter(e => e),
            secret: document.getElementById('edit-webhook-secret').value || undefined,
            isActive: document.getElementById('edit-webhook-active').checked
        };

        const response = await fetch(`/api/webhooks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Webhook updated successfully', 'success');
            editWebhookModal.hide();
            loadWebhooks();
        } else {
            showAlert('Error updating webhook: ' + result.message, 'danger');
        }
    } catch (error) {
        console.error('Error updating webhook:', error);
        showAlert('Error updating webhook', 'danger');
    } finally {
        submitButton.disabled = false;
    }
}

async function deleteWebhook(id) {
    if (!confirm('Are you sure you want to delete this webhook?')) {
        return;
    }

    try {
        const response = await fetch(`/api/webhooks/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Webhook deleted successfully', 'success');
            loadWebhooks();
        } else {
            showAlert('Error deleting webhook: ' + result.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting webhook:', error);
        showAlert('Error deleting webhook', 'danger');
    }
}

async function testWebhook(id) {
    try {
        const response = await fetch(`/api/webhooks/${id}/test`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Webhook test completed successfully', 'success');
            loadWebhooks(); // Refresh to update last trigger time
        } else {
            showAlert('Error testing webhook: ' + result.message, 'danger');
        }
    } catch (error) {
        console.error('Error testing webhook:', error);
        showAlert('Error testing webhook', 'danger');
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
