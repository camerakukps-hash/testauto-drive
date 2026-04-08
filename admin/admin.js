const BIN_URL = "https://api.jsonbin.io/v3/b/69d5e656856a6821890d8909";
const API_KEY = "$2a$10$/7rPjhs9VC0KmAsekZPVYeQhIkDfHoLsbB8bCWbDptzre/cXev1JK";

const form = document.getElementById('addLinkForm');
const successMsg = document.getElementById('successMessage');
const adminList = document.getElementById('adminList');
const gasUrlsList = document.getElementById('gasUrlsList');
const addGasUrlForm = document.getElementById('addGasUrlForm');

let collectionsTemp = [];
let GAS_URLS = [];

async function fetchCollections() {
    try {
        const response = await fetch(BIN_URL, {
            headers: { "X-Master-Key": API_KEY }
        });
        const data = await response.json();
        const allRecords = Array.isArray(data.record) ? data.record : (Array.isArray(data) ? data : []);
        
        // กรองการตั้งค่าระบบออกจากลิ้งก์ปกติ
        const settingsRecord = allRecords.find(item => item.id === "SYSTEM_SETTINGS");
        if (settingsRecord && settingsRecord.urls) {
            // โอนย้ายข้อมูลจาก String ให้กลายเป็น Object ที่รองรับสถานะเปิด/ปิด
            GAS_URLS = settingsRecord.urls.map(u => {
                if(typeof u === 'string') return { url: u, active: true, note: "" };
                return u;
            });
        } else {
            // ค่าเริ่มต้น ถ้ายังไม่มีการตั้งค่า
            GAS_URLS = [{ 
                url: "https://script.google.com/macros/s/AKfycbxXJYlJ-ycy0nXKV4JjAorFRVbvF2tJEDxn8xwIOItduv0MKpcOVnrkB79UgpKX2yBt/exec", 
                active: true, 
                note: "ไดรฟ์ดั้งเดิม" 
            }];
        }

        collectionsTemp = allRecords.filter(item => item.id !== "SYSTEM_SETTINGS");
    } catch(e) {
        collectionsTemp = [];
        GAS_URLS = [{ 
            url: "https://script.google.com/macros/s/AKfycbxXJYlJ-ycy0nXKV4JjAorFRVbvF2tJEDxn8xwIOItduv0MKpcOVnrkB79UgpKX2yBt/exec", 
            active: true, 
            note: "ไดรฟ์ดั้งเดิม" 
        }];
    }
    
    renderAdminList(collectionsTemp);
    renderGasUrls();
}

async function saveCollections(galleriesData) {
    try {
        // ห่อพ่วงการตั้งค่าทุกครั้งที่เซฟขึ้นฐานข้อมูล
        const settingsObj = {
            id: "SYSTEM_SETTINGS",
            urls: GAS_URLS
        };
        const payload = [...galleriesData, settingsObj];

        await fetch(BIN_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify(payload)
        });
        collectionsTemp = galleriesData;
    } catch(e) {
        alert("เซฟข้อมูลลงฐานข้อมูลล้มเหลว กรุณาลองใหม่");
    }
}

// ---------------- UI: จัดการลิ้งก์หน้าเว็บรูปภาพ ---------------- //

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
    if(confirm('คุณต้องการลบอัลบั้มนี้ออกจากการแสดงผลใช่หรือไม่?')) {
        const adminBtn = document.querySelector(`button[onclick="deleteCollection('${id}')"]`);
        if (adminBtn) adminBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 

        let updatedData = collectionsTemp.filter(c => c.id !== id);
        await saveCollections(updatedData);
        renderAdminList(updatedData);
    }
};

// ---------------- UI: จัดการตั้งค่า GAS URLs ---------------- //

function renderGasUrls() {
    if (GAS_URLS.length === 0) {
        gasUrlsList.innerHTML = '<p style="color: var(--text-secondary);">ไม่มีลิ้งก์ Google Script ในระบบ ระบบจะไม่สามารถสร้างอัลบั้มได้</p>';
        return;
    }

    gasUrlsList.innerHTML = '';
    
    GAS_URLS.forEach((item, index) => {
        const isActive = item.active;
        const color = isActive ? 'var(--text-primary)' : 'var(--text-secondary)';
        const textDeco = isActive ? 'none' : 'line-through';
        const opacity = isActive ? '1' : '0.6';

        const row = document.createElement('div');
        row.className = 'admin-list-item';
        row.style.padding = '0.75rem 1rem';
        row.style.opacity = opacity;
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        
        row.innerHTML = `
            <div class="admin-item-info" style="overflow: hidden; flex: 1; text-decoration: ${textDeco}; display: flex; flex-direction: column; gap: 4px;">
              <span style="font-size: 0.95rem; color: ${color};">
                <strong>บัญชีที่ ${index + 1}</strong> 
                ${item.note ? `<span style="background: rgba(76,175,80,0.15); color: var(--accent-color); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 8px; text-decoration: none !important; display: inline-block;">📋 ${item.note}</span>` : ''}
              </span>
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; color: ${color}; opacity: 0.7;">
                ${item.url}
              </span>
            </div>
            
            <button type="button" onclick="toggleGasUrl(${index})" class="submit-btn" style="padding: 0.5rem 1rem; margin: 0 0.5rem 0 1rem; width: auto; flex-shrink: 0; background: ${isActive ? '#f44336' : '#4CAF50'}; border-radius: 6px;" title="เปิด/ปิด การใช้งาน">
              <i class="fas ${isActive ? 'fa-pause' : 'fa-play'}"></i> ${isActive ? 'พักใช้งาน' : 'เปิดรับงาน'}
            </button>
            <button type="button" onclick="deleteGasUrl(${index})" class="delete-btn" style="padding: 0.5rem; flex-shrink: 0;" title="ลบลิ้งก์">
              <i class="fas fa-trash"></i>
            </button>
        `;
        gasUrlsList.appendChild(row);
    });
}

window.toggleGasUrl = async function(index) {
    GAS_URLS[index].active = !GAS_URLS[index].active;
    gasUrlsList.innerHTML = '<p style="color:var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> กำลังบันทึกสถานะ...</p>';
    await saveCollections(collectionsTemp);
    renderGasUrls();
};

window.deleteGasUrl = async function(index) {
    if(confirm('ระวัง: ถ้าลบลิ้งก์นี้ ระบบจะไม่สามารถไปสร้างรูปในไดรฟ์นี้ได้อีก \nคุณแน่ใจหรือไม่ว่าจะลบลิ้งก์นี้? (หากกลัวหาไม่เจอ แนะนำให้คลิก "พักการใช้งาน" แทนนะครับ)')) {
        GAS_URLS.splice(index, 1);
        
        gasUrlsList.innerHTML = '<p style="color:var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> กำลังลบและบันทึก...</p>';
        await saveCollections(collectionsTemp);
        renderGasUrls();
    }
};

if (addGasUrlForm) {
    addGasUrlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUrlInput = document.getElementById('newGasUrl');
        const newNoteInput = document.getElementById('newGasNote');
        
        const url = newUrlInput.value.trim();
        const note = newNoteInput ? newNoteInput.value.trim() : "";
        
        if(url) {
            const submitBtn = addGasUrlForm.querySelector('button');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            GAS_URLS.push({
                url: url,
                active: true,
                note: note
            });
            
            await saveCollections(collectionsTemp);
            
            newUrlInput.value = '';
            if(newNoteInput) newNoteInput.value = '';
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            renderGasUrls();
        }
    });
}

// Initial Render
adminList.innerHTML = '<p style="color:var(--text-secondary);">กำลังโหลดรายชื่อ...</p>';
if (gasUrlsList) gasUrlsList.innerHTML = '<p style="color:var(--text-secondary);">กำลังโหลดการตั้งค่า...</p>';
fetchCollections();


// ---------------- ระบบสร้างไดรฟ์อัตโนมัติ ---------------- //

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('collectionName').value.trim();
    const dateAdded = new Date().toISOString();

    if (!name) return;

    if (GAS_URLS.length === 0) {
        alert("คุณไม่เหลือลิ้งก์ Google Script ให้ระบบทำงานแล้วครับ กรุณาเพิ่มลิ้งก์ในตั้งค่าก่อนครับ!");
        return;
    }

    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสั่งสร้างไฟล์...';
    submitBtn.disabled = true;

    let successResult = null;
    let lastError = null;

    // ระบบพยายามวนสร้างโฟลเดอร์จากลิ้งก์ทีละอัน (เผื่ออันแรกเต็ม/เสีย)
    for (let i = 0; i < GAS_URLS.length; i++) {
        const gasObj = GAS_URLS[i];
        
        // ข้ามลิ้งก์ที่ถูก "ปิดพักใช้งาน"
        if(!gasObj.active) continue;
        
        const gasUrl = gasObj.url;
        if(!gasUrl || gasUrl.trim() === "" || gasUrl.startsWith("//") || gasUrl === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") continue;

        try {
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> กำลังติดต่อไดรฟ์ที่ ${i + 1}...`;
            const payload = { folderName: name };

            const response = await fetch(gasUrl, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                }
            });

            const result = await response.json();

            if (result.success) {
                // สร้างสำเร็จแล้ว หยุดการค้นหา
                successResult = result;
                break;
            } else {
                console.warn(`ลิ้งก์ไดรฟ์ที่ ${i + 1} ไม่สามารถสร้างได้ (${result.error}) กำลังสลับไปไดรฟ์ถัดไป...`);
                lastError = result.error;
            }
        } catch (err) {
            console.error(`ไดรฟ์ที่ ${i + 1} ล้มเหลว: ` + err.message);
            lastError = err.message;
        }
    }

    try {
        if (successResult) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> บันทึกลงระบบหน้าเว็บ...';
            
            const newLink = {
                id: Date.now().toString(),
                name: name,
                url: successResult.url,
                dateAdded: dateAdded
            };

            const updatedData = [...collectionsTemp, newLink];
            await saveCollections(updatedData); // ตัวนี้จะห่อพก GAS_URLS ไปเซฟให้ด้วย

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            successMsg.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 8px;"></i> <span style="color:var(--text-primary)">สร้างในไดรฟ์สำเร็จ!</span><br><br><a href="${successResult.url}" target="_blank" style="display:inline-block; padding: 0.75rem 1rem; background: var(--accent-color); color: white; border-radius: 8px; text-decoration: none; font-weight: bold;"><i class="fas fa-external-link-alt"></i> คลิกลิ้งก์นี้เพื่อเข้าไปอัปลงรูปภาพได้เลย</a>`;
            successMsg.style.display = 'block';
            form.reset();
            
            renderAdminList(updatedData);

        } else {
            throw new Error(lastError || "ไม่สามารถสร้างโฟลเดอร์ได้จากทุกลิ้งก์ที่เปิดใช้งานอยู่ (อาจเป็นเพราะลิ้งก์เสียหรือไดรฟ์เต็มทั้งหมด)");
        }

    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด: " + err.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});
