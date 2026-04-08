const BIN_URL = "https://api.jsonbin.io/v3/b/69d64d85aaba882197d7b2d3";
const API_KEY = "$2a$10$/7rPjhs9VC0KmAsekZPVYeQhIkDfHoLsbB8bCWbDptzre/cXev1JK";

const form = document.getElementById('addLinkForm');
const successMsg = document.getElementById('successMessage');
const adminList = document.getElementById('adminList');

let collectionsTemp = [];

async function fetchCollections() {
    try {
        const response = await fetch(BIN_URL, {
            headers: { "X-Master-Key": API_KEY }
        });
        const data = await response.json();
        // Since we created an empty array "[]", data.record could technically be empty. Check structure:
        collectionsTemp = Array.isArray(data.record) ? data.record : (Array.isArray(data) ? data : []);
    } catch(e) {
        collectionsTemp = [];
    }
    renderAdminList(collectionsTemp);
}

async function saveCollections(newData) {
    try {
        await fetch(BIN_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify(newData)
        });
        collectionsTemp = newData;
    } catch(e) {
        alert("เซฟรูปลงฐานข้อมูลล้มเหลว กรุณาลองใหม่");
    }
}

function renderAdminList(collections) {
    if (collections.length === 0) {
        adminList.innerHTML = '<p style="color: var(--text-secondary);">No collections yet.</p>';
        return;
    }
    
    // Sort cloned array
    const sorted = [...collections].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    adminList.innerHTML = '';
    
    sorted.forEach(item => {
        const escapeHTML = str => String(str || '').replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag));
        const row = document.createElement('div');
        row.className = 'admin-list-item';
        row.innerHTML = `
            <div class="admin-item-info">
            <img src="https://picsum.photos/seed/${item.id}/200/200" alt="Preview" class="admin-item-img">
            <span><strong>${escapeHTML(item.name)}</strong> <br><small>${new Date(item.dateAdded).toLocaleDateString()}</small></span>
            </div>
            <button onclick="deleteCollection('${item.id}')" class="delete-btn" title="Delete">
            <i class="fas fa-trash"></i>
            </button>
        `;
        adminList.appendChild(row);
    });
}

window.deleteCollection = async function(id) {
    if(confirm('Are you sure you want to delete this collection?')) {
        const adminBtn = document.querySelector(`button[onclick="deleteCollection('${id}')"]`);
        if (adminBtn) adminBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 

        let updatedData = collectionsTemp.filter(c => c.id !== id);
        await saveCollections(updatedData);
        renderAdminList(updatedData);
    }
};

// Initial Render
adminList.innerHTML = '<p style="color:var(--text-secondary);">กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...</p>';
fetchCollections();

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('collectionName').value.trim();
    const url = document.getElementById('driveUrl').value.trim();
    const dateAdded = new Date().toISOString();

    if (name && url) {
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัปโหลด...';
        submitBtn.disabled = true;

        const newLink = {
            id: Date.now().toString(),
            name: name,
            url: url,
            dateAdded: dateAdded
        };

        const updatedData = [...collectionsTemp, newLink];
        await saveCollections(updatedData);

        // Show success msg
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        successMsg.style.display = 'block';
        form.reset();
        
        // Render updated list
        renderAdminList(updatedData);

        // Hide success message after 3 seconds
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }
});
