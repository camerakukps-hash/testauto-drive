const BIN_URL = "https://api.jsonbin.io/v3/b/69d5e656856a6821890d8909";
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

// ====== ตั้งค่า Google Apps Script ======
// นำ URL ที่ได้จาก Google Apps Script มาวางในเครื่องหมายคำพูดด้านล่าง
const GAS_URL = "https://script.google.com/macros/s/AKfycbxXJYlJ-ycy0nXKV4JjAorFRVbvF2tJEDxn8xwIOItduv0MKpcOVnrkB79UgpKX2yBt/exec"; 

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('collectionName').value.trim();
    const dateAdded = new Date().toISOString();

    if (!name) return;

    if (GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL" || !GAS_URL) {
        alert("กรุณานำ Web App URL ของ Google Apps Script มาใส่ในไฟล์ admin/admin.js (บรรทัดที่ 84) ก่อนทำการสร้างอัลบั้มครับ!");
        return;
    }

    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสั่งสร้างโฟลเดอร์ใน Google Drive...';
    submitBtn.disabled = true;

    try {
        const payload = {
            folderName: name
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "text/plain;charset=utf-8" // ป้องกันปัญหา CORS
            }
        });

        const result = await response.json();

        if (result.success) {
            // 3. นำลิ้งก์ที่ Google ให้มา บันทึกลงระบบฐานข้อมูลหน้าเว็บ
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> บันทึกลงระบบหน้าเว็บ...';
            
            const newLink = {
                id: Date.now().toString(),
                name: name,
                url: result.url,
                dateAdded: dateAdded
            };

            const updatedData = [...collectionsTemp, newLink];
            await saveCollections(updatedData);

            // แสดงข้อความลิ้งก์สำเร็จ
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            successMsg.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 8px;"></i> <span style="color:var(--text-primary)">สร้างโฟลเดอร์เสร็จสิ้น!</span><br><br><a href="${result.url}" target="_blank" style="display:inline-block; padding: 0.75rem 1rem; background: var(--accent-color); color: white; border-radius: 8px; text-decoration: none; font-weight: bold;"><i class="fas fa-external-link-alt"></i> คลิกลิ้งก์นี้เพื่อเข้าไปอัปลงรูปภาพได้เลย</a>`;
            successMsg.style.display = 'block';
            form.reset();
            
            renderAdminList(updatedData);

        } else {
            throw new Error(result.error);
        }

    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการสร้างโฟลเดอร์: " + err.message + "\n(ลิ้งก์สคริปต์อาจไม่ได้รับการตั้งค่าอย่างถูกต้อง)");
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});
