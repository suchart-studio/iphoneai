// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

const targetClasses = ['person', 'dog', 'cat', 'car', 'motorcycle', 'truck', 'bus', 'bicycle'];
let currentCounts = {};
targetClasses.forEach(c => currentCounts[c] = 0);

const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
let model = null;
let isDetecting = false; 

// ตั้งค่าเวลาที่ต้องการให้ส่งอัตโนมัติ (5000 มิลลิวินาที = 5 วินาที)
const AUTO_UPLOAD_INTERVAL = 5000; 

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

async function detectFrame() {
    if(!model || !isDetecting) return;
    
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
    
    if(isDetecting) {
        requestAnimationFrame(detectFrame);
    }
}

// ฟังก์ชันสำหรับส่งข้อมูลอัตโนมัติ
async function autoUploadData() {
    if (!isDetecting) return; // ถ้าไม่ได้เปิดกล้อง หรือระบบหยุดทำงาน ไม่ต้องส่ง

    const btn = document.getElementById('upload-btn');
    
    try {
        btn.innerText = "กำลังอัปโหลดอัตโนมัติ...";
        btn.style.background = "#ff9500"; // เปลี่ยนเป็นสีส้มระหว่างส่ง
        
        // ส่งข้อมูลขึ้น Firebase
        const newLogRef = push(ref(db, 'object_counts'));
        await set(newLogRef, {
            counts: currentCounts,
            timestamp: serverTimestamp(),
            device: "iPhone 16 Pro (Auto)"
        });
        
        btn.innerText = "ระบบกำลังทำงานอัตโนมัติ (ส่งข้อมูลแล้ว)";
        btn.style.background = "#34c759"; // เปลี่ยนกลับเป็นสีเขียว
        
    } catch (e) {
        console.error("Auto Upload Error: ", e);
        btn.innerText = "⚠️ ส่งข้อมูลอัตโนมัติล้มเหลว";
        btn.style.background = "#ff3b30";
    }
}

window.addEventListener('passwordCorrect', async () => {
    updateUI();
    document.getElementById('upload-btn').innerText = "กำลังโหลดโมเดล AI...";
    
    model = await cocoSsd.load();
    
    document.getElementById('upload-btn').innerText = "กำลังเปิดกล้อง...";
    await setupCamera();
    
    document.getElementById('upload-btn').innerText = "ระบบทำงานอัตโนมัติ (ทุกๆ 5 วินาที)";
    
    isDetecting = true;
    detectFrame();

    // 🚀 เริ่มต้นระบบส่งข้อมูลอัตโนมัติแบบวนลูปต่อเนื่อง
    setInterval(autoUploadData, AUTO_UPLOAD_INTERVAL);
});
