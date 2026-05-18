// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// คอนฟิกจริงของคุณที่คุณส่งมา
const firebaseConfig = {
  apiKey: "AIzaSyDMMwciq6QoLSaWK6xfdr0U3ynyahtoaSk",
  authDomain: "studio-a33fe.firebaseapp.com",
  databaseURL: "https://studio-a33fe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-a33fe",
  storageBucket: "studio-a33fe.firebasestorage.app",
  messagingSenderId: "753539109404",
  appId: "1:753539109404:web:e3ea4214849d4bd7e645d9",
  measurementId: "G-P7Q5TTLS5Y"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// วัตถุที่ต้องการตรวจจับตามเงื่อนไข
const targetClasses = ['person', 'dog', 'cat', 'car', 'motorcycle', 'truck', 'bus', 'bicycle'];
let currentCounts = {};
targetClasses.forEach(c => currentCounts[c] = 0);

const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
let model = null;

// ตั้งค่ากล้องหลัง iPhone 16 Pro
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => { resolve(video); };
        });
    } catch (err) {
        console.error("Camera error:", err);
        alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องบน iPhone ของคุณ");
    }
}

function updateUI() {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = '';
    targetClasses.forEach(cls => {
        statsDiv.innerHTML += `
            <div class="stat-box">
                ${cls.toUpperCase()}
                <span>${currentCounts[cls]}</span>
            </div>
        `;
    });
}

// ตรวจจับวัตถุด้วย AI เฟรมต่อเฟรม
async function detectFrame() {
    if(!model) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const predictions = await model.detect(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let frameCounts = {};
    targetClasses.forEach(c => frameCounts[c] = 0);

    predictions.forEach(prediction => {
        if (targetClasses.includes(prediction.class) && prediction.score > 0.5) {
            frameCounts[prediction.class]++;
            
            const [x, y, width, height] = prediction.bbox;
            ctx.strokeStyle = "#0a84ff";
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = "#0a84ff";
            ctx.fillRect(x, y - 20, width, 20);
            ctx.fillStyle = "#ffffff";
            ctx.font = "16px Arial";
            ctx.fillText(`${prediction.class} (${Math.round(prediction.score * 100)}%)`, x + 5, y - 5);
        }
    });

    currentCounts = frameCounts;
    updateUI();
    requestAnimationFrame(detectFrame);
}

// เริ่มทำงานเมื่อปลดล็อกรหัสผ่านสำเร็จ
window.addEventListener('passwordCorrect', async () => {
    updateUI();
    document.getElementById('upload-btn').innerText = "กำลังโหลดโมเดล AI...";
    
    model = await cocoSsd.load();
    
    document.getElementById('upload-btn').innerText = "กำลังเปิดกล้อง...";
    await setupCamera();
    
    document.getElementById('upload-btn').innerText = "บันทึกข้อมูลขึ้น Firebase";
    detectFrame();
});

// บันทึกข้อมูลเข้า Realtime Database
document.getElementById('upload-btn').addEventListener('click', async () => {
    try {
        const btn = document.getElementById('upload-btn');
        btn.innerText = "กำลังบันทึก...";
        
        // ใช้ push() เพื่อสร้าง ID แบบสุ่มอัตโนมัติ และเซ็ตข้อมูลลงไป
        const newLogRef = push(ref(db, 'object_counts'));
        await set(newLogRef, {
            counts: currentCounts,
            timestamp: serverTimestamp(),
            device: "iPhone 16 Pro"
        });
        
        alert("บันทึกข้อมูลสำเร็จ!");
        btn.innerText = "บันทึกข้อมูลขึ้น Firebase";
    } catch (e) {
        console.error("Firebase Error: ", e);
        alert("เกิดข้อผิดพลาด: " + e.message);
    }
});