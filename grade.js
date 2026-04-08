document.addEventListener('DOMContentLoaded', () => {
    const gradeForm = document.getElementById('gradeForm');
    const resultBox = document.getElementById('resultBox');

    // Load from LocalStorage
    const savedData = JSON.parse(localStorage.getItem('photo_agext_grades')) || {};
    
    if (savedData['quickCreds']) {
        document.getElementById('quickCreds').value = savedData['quickCreds'];
    }
    if (savedData['quickGPA']) {
        document.getElementById('quickGPA').value = savedData['quickGPA'];
    }

    const calculateRequiredGPA = (currentCredits, currentGPA, nextCredits, targetGPA) => {
        // (CC * CG) + (NC * X) = (CC + NC) * Target
        // NC * X = ((CC + NC) * Target) - (CC * CG)
        // X = (((CC + NC) * Target) - (CC * CG)) / NC
        const totalTargetPoints = (currentCredits + nextCredits) * targetGPA;
        const currentPoints = currentCredits * currentGPA;
        let required = (totalTargetPoints - currentPoints) / nextCredits;
        return required;
    };

    gradeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const curCredsStr = document.getElementById('quickCreds').value;
        const curGPAStr = document.getElementById('quickGPA').value;
        
        if (!curCredsStr || !curGPAStr) {
            alert('กรุณากรอกข้อมูล เกรดและหน่วยกิตสะสมปัจจุบัน ให้ครบถ้วนครับ!');
            return;
        }

        const baselineCredits = parseFloat(curCredsStr);
        const baselineGPA = parseFloat(curGPAStr);

        let dataToSave = {};
        dataToSave['quickCreds'] = curCredsStr;
        dataToSave['quickGPA'] = curGPAStr;
        localStorage.setItem('photo_agext_grades', JSON.stringify(dataToSave));

        const nextCredits = parseFloat(document.getElementById('nextCredits').value);

        // 2. Setup Targets
        const minSafeLow = 1.76;
        const targetNormal = 2.00;

        const reqLow = calculateRequiredGPA(baselineCredits, baselineGPA, nextCredits, minSafeLow);
        const reqNormal = calculateRequiredGPA(baselineCredits, baselineGPA, nextCredits, targetNormal);

        // 3. Render Results
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<h3>สรุปผลการประเมิน (ลงทะเบียน ${nextCredits} หน่วยกิต)</h3><p style="margin-bottom:1rem; color:var(--text-secondary)">ฐานปัจจุบัน: สะสม ${baselineCredits} หน่วยกิต | เกรดเฉลี่ย ${baselineGPA.toFixed(2)}</p>`;

        // Format rules bounded to reality 0.00 - 4.00
        const renderRequirement = (reqVal, title, desc, type) => {
            if (reqVal > 4.00) {
                return `<div class="result-box result-danger" style="display:block;">
                            <h4 style="color:#d32f2f;"><i class="fas fa-exclamation-triangle"></i> ${title}</h4>
                            <p>คุณต้องทำเกรดเทอมหน้าถึง <strong>${reqVal.toFixed(2)}</strong> ซึ่งเป็นไปไม่ได้! (เกิน 4.00) <br><em>${desc}</em></p>
                        </div>`;
            } else if (reqVal <= 0) {
                return `<div class="result-box result-good" style="display:block;">
                            <h4 style="color:#388e3c;"><i class="fas fa-check-circle"></i> ${title}</h4>
                            <p>เกรดลอยตัวแล้ว! ต่อให้เทอมหน้าทำเกรดได้ <strong>0.00</strong> เกรดสะสมก็ยังผ่านเกณฑ์นี้ครับ <br><em>${desc}</em></p>
                        </div>`;
            } else {
                let clz = type === 'prob' ? 'result-low' : 'result-good';
                let icon = type === 'prob' ? 'fa-exclamation-circle' : 'fa-star';
                return `<div class="result-box ${clz}" style="display:block;">
                            <h4 style="color:var(--text-primary);"><i class="fas ${icon}"></i> ${title}</h4>
                            <p>ต้องทำในเทอมหน้าให้ได้เฉลี่ยอย่างน้อย: <span style="font-size:1.5rem; font-weight:700;">${reqVal.toFixed(2)}</span> <br><em>${desc}</em></p>
                        </div>`;
            }
        };

        if (baselineGPA >= 2.00) {
            resultBox.innerHTML += `<div class="result-box result-good" style="display:block;"><h4 style="color:#388e3c;"><i class="fas fa-shield-alt"></i> สถานะปัจจุบัน: ปกติ</h4><p>เกรดของคุณพ้นโปรอยู่แล้ว รักษามาตรฐานไว้นะครับ</p></div>`;
            resultBox.innerHTML += renderRequirement(reqNormal, 'เป้าหมายรักษาสถานะปกติ (GPAX 2.00)', 'เพื่อไม่ให้เกรดสะสมตกลงมาติดโปร', 'normal');
        } else {
            resultBox.innerHTML += renderRequirement(reqLow, 'เป้าหมายหนีโปรต่ำสุด (GPAX 1.76)', 'เพื่อให้รอดพ้นจากการโดนรีไทร์ขั้นต่ำสุด', 'prob');
            resultBox.innerHTML += renderRequirement(reqNormal, 'เป้าหมายพ้นโปรสมบูรณ์ (GPAX 2.00)', 'เพื่อให้หลุดจากสถานะโปรเบชั่นทั้งหมด กลับเป็นปกติ', 'normal');
        }
        
        // Scroll to result
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
});
