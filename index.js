const BIN_URL = "https://api.jsonbin.io/v3/b/69d5e656856a6821890d8909";
const API_KEY = "$2a$10$/7rPjhs9VC0KmAsekZPVYeQhIkDfHoLsbB8bCWbDptzre/cXev1JK";

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('galleryGrid');
    
    // ระบบ Caching เพื่อให้โหลดหน้าเว็บได้ทันที
    const cacheKey = 'gallery_collections_cache';
    const cachedData = localStorage.getItem(cacheKey);
    let isInitialRender = true;

    function renderItems(collections) {
        if (!collections || collections.length === 0) {
            grid.innerHTML = '';
            return;
        }

        collections.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        grid.innerHTML = ''; // เคลียร์ของเก่าก่อนวาดใหม่

        collections.forEach((item, index) => {
            const dateOpt = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = new Date(item.dateAdded).toLocaleDateString('en-US', dateOpt);
            
            const isLatest = index === 0;
            const badgeHTML = isLatest ? '<span class="badge">LATEST</span>' : '';

            const card = document.createElement('div');
            card.className = `card ${isLatest ? 'card-featured' : ''}`;
            card.style.padding = '1.5rem';
            card.innerHTML = `
                ${badgeHTML}
                <div class="card-content" style="padding: 0;">
                <h2 class="card-title">${escapeHTML(item.name)}</h2>
                <div class="card-date">
                    <i class="far fa-clock"></i> ${formattedDate}
                </div>
                <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="card-btn">
                    <i class="fab fa-google-drive"></i> View Photos
                </a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // 1. ดึงข้อมูลจาก Cache มาแสดงทันทีที่เข้าเว็บ (ไม่ต้องรอโหลด)
    if (cachedData) {
        try {
            renderItems(JSON.parse(cachedData));
            isInitialRender = false;
        } catch(e) {}
    }

    // ถ้าไม่มี Cache ให้แสดงสถานะกำลังโหลด
    if (isInitialRender) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color: var(--accent-color);"></i><p style="margin-top: 1rem; color: var(--text-secondary);">กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...</p></div>';
    }
    
    // 2. ดึงข้อมูลล่าสุดจาก JSONBin เป็นเบื้องหลัง
    try {
        const response = await fetch(BIN_URL, {
            headers: { "X-Master-Key": API_KEY }
        });
        const data = await response.json();
        
        const collections = data.record || [];
        const newCacheData = JSON.stringify(collections);
        
        // ถ้าข้อมูลบนเซิร์ฟเวอร์มีการเปลี่ยนแปลง (ไม่เหมือนใน Cache) ค่อยวาดหน้าจอใหม่
        if (newCacheData !== cachedData) {
            localStorage.setItem(cacheKey, newCacheData);
            renderItems(collections);
        }
    } catch (e) {
        // ถ้าดึงข้อมูลพัง และไม่มีข้อมูลเก่าเลย
        if (isInitialRender) {
            grid.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">ไม่สามารถโหลดข้อมูลได้ หรือตู้คลังสินค้า (Bin) เพิ่งถูกสร้างใหม่ โปรดเพิ่มรูปลงคลังก่อนครับ</p>';
        }
    }
});

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag));
}
