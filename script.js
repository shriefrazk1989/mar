
// Simple client-side storage using localStorage
const STORAGE_KEY = 'connect_missing_phones_v1';

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveData(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function readImageFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    if(!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject('خطأ في قراءة الصورة');
    reader.readAsDataURL(file);
  });
}

function renderTable(filterText=''){
  const tbody = document.querySelector('#phonesTable tbody');
  tbody.innerHTML = '';
  const data = loadData();
  const q = filterText.trim().toLowerCase();
  const filtered = q ? data.filter(item => {
    return (item.phoneName||'').toLowerCase().includes(q) ||
           (item.ownerName||'').toLowerCase().includes(q) ||
           (item.contactNumber||'').toLowerCase().includes(q);
  }) : data;

  if(filtered.length === 0){
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8">لا توجد نتائج</td>';
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ item.image ? '<img src="'+item.image+'" alt="صورة">' : '—'}</td>
      <td>${escapeHtml(item.phoneName)}</td>
      <td>${escapeHtml(item.phoneColor||'—')}</td>
      <td>${escapeHtml(item.ownerName||'—')}</td>
      <td>${escapeHtml(item.contactNumber||'—')}</td>
      <td>${escapeHtml(item.lostDate||'—')}</td>
      <td>${escapeHtml(item.lostPlace||'—')}</td>
      <td><button data-idx="${idx}" class="btn delete-btn">حذف</button></td>
    `;
    tbody.appendChild(tr);
  });

  // attach delete handlers (indexes correspond to filtered array, but deletion should remove the actual item)
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      // find the actual object in storage by matching fields (simple approach)
      const filteredItem = filtered[idx];
      if(!filteredItem) return;
      if(!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
      let base = loadData();
      base = base.filter(it => !(it._id === filteredItem._id));
      saveData(base);
      renderTable(document.getElementById('searchInput').value);
    });
  });
}

function escapeHtml(s){
  if(!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.getElementById('reportForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phoneName = document.getElementById('phoneName').value.trim();
  if(!phoneName){ alert('أدخل اسم الموبايل'); return; }
  const phoneColor = document.getElementById('phoneColor').value.trim();
  const ownerName = document.getElementById('ownerName').value.trim();
  const contactNumber = document.getElementById('contactNumber').value.trim();
  const lostDate = document.getElementById('lostDate').value;
  const lostPlace = document.getElementById('lostPlace').value.trim();
  const fileInput = document.getElementById('phoneImage');
  const file = fileInput.files && fileInput.files[0];
  let imageData = null;
  try {
    imageData = await readImageFileAsDataURL(file);
  } catch(err){
    console.error(err);
    alert('حدث خطأ أثناء تحميل الصورة');
  }

  const data = loadData();
  const record = {
    _id: Date.now().toString(),
    phoneName, phoneColor, ownerName, contactNumber, lostDate, lostPlace,
    image: imageData
  };
  data.unshift(record); // add newest on top
  saveData(data);
  document.getElementById('reportForm').reset();
  renderTable();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if(confirm('هل تريد مسح الحقول؟')) document.getElementById('reportForm').reset();
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const q = document.getElementById('searchInput').value || '';
  renderTable(q);
});

document.getElementById('showAllBtn').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  renderTable();
});

// run initially
renderTable();
