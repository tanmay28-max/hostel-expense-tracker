// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCwv7bNt8RpUFSfKf-1YtzcfPukP7So4",
    authDomain: "hostelexpense-c5dd8.firebaseapp.com",
    projectId: "hostelexpense-c5dd8",
    storageBucket: "hostelexpense-c5dd8.firebasestorage.app",
    messagingSenderId: "992900368817",
    appId: "1:992900368817:web:ac8865f1685e8ec51c9590"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const totalBalanceEl = document.getElementById('totalBalance');
const tanmayBalEl = document.getElementById('tanmayBal');
const mrinmayBalEl = document.getElementById('mrinmayBal');
const expenseListEl = document.getElementById('expenseList');
const depositListEl = document.getElementById('depositList');
const expenseForm = document.getElementById('expenseForm');
const monthFilterEl = document.getElementById('monthFilter');

// Modals
const addFundBtn = document.getElementById('addFundBtn');
const fundModal = document.getElementById('fundModal');
const closeFundModal = document.getElementById('closeFundModal');
const submitFundBtn = document.getElementById('submitFundBtn');

const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');

let selectedMonth = "all";

// Modal Toggles
addFundBtn.addEventListener('click', () => fundModal.classList.remove('hidden'));
closeFundModal.addEventListener('click', () => fundModal.classList.add('hidden'));
viewHistoryBtn.addEventListener('click', () => historyModal.classList.remove('hidden'));
closeHistoryModal.addEventListener('click', () => historyModal.classList.add('hidden'));

monthFilterEl.addEventListener('change', (e) => {
    selectedMonth = e.target.value;
    calculateAndUpdateUI();
});

async function initData() {
    const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        window.currentExpenses = [];
        snapshot.forEach((docItem) => {
            window.currentExpenses.push({ id: docItem.id, ...docItem.data() });
        });
        updateMonthDropdown();
        calculateAndUpdateUI();
    });
}

function updateMonthDropdown() {
    const uniqueMonths = new Set();
    window.currentExpenses.forEach(item => {
        if(item.timestamp) {
            const d = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
            const monthYear = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
            uniqueMonths.add(monthYear);
        }
    });

    const currentVal = monthFilterEl.value;
    monthFilterEl.innerHTML = `<option value="all">All Months</option>`;
    
    const monthsArr = Array.from(uniqueMonths);
    monthsArr.forEach(m => {
        monthFilterEl.innerHTML += `<option value="${m}">${m}</option>`;
    });

    if(uniqueMonths.has(currentVal)) {
        monthFilterEl.value = currentVal;
        selectedMonth = currentVal;
    } else if(monthsArr.length > 0 && selectedMonth === "all") {
        selectedMonth = monthsArr[0];
        monthFilterEl.value = selectedMonth;
    }
}

function calculateAndUpdateUI() {
    let tanmayBal = 0, mrinmayBal = 0;
    expenseListEl.innerHTML = '';
    depositListEl.innerHTML = '';

    let hasExpenses = false, hasDeposits = false;

    if (window.currentExpenses) {
        window.currentExpenses.forEach(item => {
            let name = item.paidBy ? item.paidBy.toLowerCase() : "";
            let amt = Number(item.amount);
            let isDeposit = item.type === "deposit";

            if (name.includes("tanmay")) {
                if (isDeposit) tanmayBal += amt; else tanmayBal -= amt;
            } else if (name.includes("mrinmay")) {
                if (isDeposit) mrinmayBal += amt; else mrinmayBal -= amt;
            }

            let formattedDate = "Just now";
            let itemMonthYear = "";
            if (item.timestamp) {
                const dateObj = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
                formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                itemMonthYear = dateObj.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
            }

            if (selectedMonth !== "all" && itemMonthYear !== selectedMonth) {
                return;
            }

            let itemHtml = `
                <div class="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full flex items-center justify-center ${isDeposit ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400'} text-lg font-black">
                            ${isDeposit ? '↓' : '↑'}
                        </div>
                        <div>
                            <p class="font-bold text-sm text-slate-800 dark:text-slate-100">${item.note}</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">${isDeposit ? 'Added by' : 'Paid by'}: <span class="font-bold text-slate-700 dark:text-slate-300">${item.paidBy}</span></p>
                                <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded pl-1">📅 ${formattedDate}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right flex flex-col items-end gap-1">
                        <span class="font-black ${isDeposit ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'} text-[15px]">${isDeposit ? '+' : '-'}₹${item.amount}</span>
                        <button class="delete-btn text-[10px] text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 font-semibold transition-colors" data-id="${item.id}">Delete</button>
                    </div>
                </div>
            `;

            if (isDeposit) {
                depositListEl.innerHTML += itemHtml;
                hasDeposits = true;
            } else {
                expenseListEl.innerHTML += itemHtml;
                hasExpenses = true;
            }
        });
    }

    tanmayBalEl.innerText = `₹ ${tanmayBal}`;
    mrinmayBalEl.innerText = `₹ ${mrinmayBal}`;
    totalBalanceEl.innerText = `₹ ${tanmayBal + mrinmayBal}`;

    if (!hasExpenses) expenseListEl.innerHTML = `<p class="text-slate-400 text-sm text-center mt-10 font-medium">No expenses found for this month.</p>`;
    if (!hasDeposits) depositListEl.innerHTML = `<p class="text-slate-400 text-sm text-center mt-10 font-medium">No deposits found for this month.</p>`;

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const id = this.getAttribute('data-id');
            if (confirm("Are you sure you want to delete this record?")) {
                await deleteDoc(doc(db, "expenses", id));
            }
        });
    });
}

submitFundBtn.addEventListener('click', async function() {
    const amount = parseFloat(document.getElementById('fundAmount').value);
    const paidBy = document.getElementById('fundMember').value;
    if(!amount) return;

    submitFundBtn.innerText = "Adding...";
    await addDoc(collection(db, "expenses"), { amount, paidBy, note: "💰 Money Added to Wallet", type: "deposit", timestamp: new Date() });
    
    document.getElementById('fundAmount').value = '';
    fundModal.classList.add('hidden');
    submitFundBtn.innerText = "Add Fund";
});

expenseForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const paidBy = document.getElementById('paidBy').value;
    const note = document.getElementById('note').value;

    document.getElementById('submitBtn').innerText = "Processing...";
    await addDoc(collection(db, "expenses"), { amount, paidBy, note, type: "expense", timestamp: new Date() });

    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    document.getElementById('submitBtn').innerText = "Cut from Balance";
});

initData();