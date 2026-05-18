// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// คอนฟิกจริงของคุณ
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
let chartInstance = null;

function renderChart(totalCounts) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const dataValues = targetClasses.map(c => totalCounts[c] || 0);

    if(chartInstance) {
        chartInstance.data.datasets[0].data = dataValues;
        chartInstance.update();
        return;
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: targetClasses.map(c => c.toUpperCase()),
            datasets: [{
                label: 'จำนวนรวมสะสม',
                data: dataValues,
                backgroundColor: '#0a84ff',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#fff' } },
                x: { ticks: { color: '#fff' } }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
}

// ฟังการอัปเดตข้อมูลแบบ Real-time (เมื่อฝั่งกล้องกดส่ง กราฟจะขยับทันที)
const countsRef = ref(db, 'object_counts');
onValue(countsRef, (snapshot) => {
    let totalCounts = {};
    targetClasses.forEach(c => totalCounts[c] = 0);

    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            if(data.counts) {
                targetClasses.forEach(c => {
                    totalCounts[c] += (data.counts[c] || 0);
                });
            }
        });
    }
    
    renderChart(totalCounts);
});