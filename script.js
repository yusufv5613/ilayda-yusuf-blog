// Firebase SDK importları (bu satırlar dosyanın en başında olmalı)
// Bu importlar, Firebase servislerine erişim sağlar.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Yapılandırma Bilgileri (Canvas ortamından güvenli bir şekilde yüklenecek)
// Bu bilgiler, uygulamanızın hangi Firebase projesine bağlanacağını belirtir.
// __firebase_config global değişkeni Canvas tarafından sağlanır.
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Canvas ortamından gelen global değişkenler (varsa kullanılır, yoksa varsayılan değerler)
// Bu değişkenler Canvas ortamında otomatik sağlanır, normal web'de undefined olabilir.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase Uygulaması ve Servisleri için global değişkenler
let app;
let db; // Firestore veritabanı referansı
let auth; // Firebase kimlik doğrulama referansı
let userId; // Mevcut kullanıcının ID'si (anonim veya kimliği doğrulanmış)

// Firestore koleksiyon referansı (Tüm veriler bu ortak koleksiyon altında saklanacak)
// Bu yol, Firebase güvenlik kurallarınızla eşleşmelidir.
const SHARED_COLLECTION_BASE_PATH = `shared_memories_blog/data`;

// Veri dizileri (artık Firestore'dan yüklenecek ve gerçek zamanlı güncellenecek)
// Bu diziler, Firestore'dan gelen verileri depolamak için kullanılır.
let memories = [];
let poems = [];
let galleryItems = [];
let todoList = [];
let movieList = [];
let specialDays = [];
let moods = [];
let aboutContentHtml = ''; // Hakkımızda içeriği için

// --- Genel Yardımcı Fonksiyonlar ---

// Mesaj Kutusu Fonksiyonları (alert yerine)
// Kullanıcıya bilgi mesajları göstermek için kullanılır.
function showMessageBox(message) {
    const messageBox = document.getElementById('messageBox');
    const messageBoxText = document.getElementById('messageBoxText');
    messageBoxText.textContent = message;
    messageBox.style.display = 'flex'; // Mesaj kutusunu görünür yapar
}

function closeMessageBox() {
    document.getElementById('messageBox').style.display = 'none'; // Mesaj kutusunu gizler
}

// --- Firebase Başlatma ve Kimlik Doğrulama ---
// Uygulama başlatıldığında Firebase'i başlatır ve kullanıcı kimlik doğrulamasını yönetir.
async function initializeFirebaseAndAuth() {
    try {
        app = initializeApp(firebaseConfig); // Firebase uygulamasını başlat
        db = getFirestore(app); // Firestore servisini al
        auth = getAuth(app); // Kimlik doğrulama servisini al

        // Kullanıcı kimlik doğrulama durumu değiştiğinde tetiklenir.
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Kullanıcı oturum açmışsa, UID'sini al.
                userId = user.uid;
                console.log("Firebase kullanıcı ID:", userId);
                // Kullanıcı kimliği doğrulandıktan sonra verileri yükle (sadece main.html yüklüyse)
                if (document.getElementById('currentDate')) {
                    loadAllData();
                }
            } else {
                // Kullanıcı oturum açmamışsa, anonim olarak oturum açmayı dene.
                // Canvas ortamında özel bir kimlik doğrulama token'ı varsa onu kullan.
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth); // Anonim oturum aç
                }
            }
        });

        // Eğer main.html'de değilsek ve auth zaten hazırsa (hızlı yüklemede)
        // Bu, sayfa yenilendiğinde veya hızlıca açıldığında auth state'in zaten mevcut olma durumunu kapsar.
        if (auth.currentUser && document.getElementById('currentDate')) {
             userId = auth.currentUser.uid;
             loadAllData();
        }

    } catch (error) {
        console.error("Firebase başlatılırken veya kimlik doğrulanırken hata oluştu:", error);
        showMessageBox("Uygulama başlatılırken bir sorun oluştu. Lütfen konsolu kontrol edin.");
    }
}

// --- index.html ve password.html için olan fonksiyonlar ---

function goToSecondPage(user) {
    window.location.href = `password.html?user=${user}`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Sadece password.html sayfasında çalışacak kodlar
    if (document.getElementById('passwordTitle')) {
        const urlParams = new URLSearchParams(window.location.search);
        const user = urlParams.get('user');

        const passwordTitle = document.getElementById('passwordTitle');
        const passwordDescription = document.getElementById('passwordDescription');
        const birthdayInput = document.getElementById('birthdayInput');
        const errorMessage = document.getElementById('errorMessage');

        if (user === 'yusuf') {
            passwordTitle.textContent = "Yusuf'un Şifresi";
            passwordDescription.textContent = "Lütfen İlayda'nın doğum gününü (Ay ve Gün, 4 rakam) girin.";
        } else if (user === 'ilayda') {
            passwordTitle.textContent = "İlayda'nın Şifresi";
            passwordDescription.textContent = "Lütfen Yusuf'un doğum gününü (Ay ve Gün, 4 rakam) girin.";
        }

        if (birthdayInput) {
            birthdayInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
    }

    // Sadece main.html sayfasında çalışacak kodlar
    if (document.getElementById('currentDate')) {
        initializeFirebaseAndAuth(); // Firebase'i başlat ve kimlik doğrulamayı yap
        updateCurrentDate();
        calculateAnniversary();
        renderCalendar(currentMonth, currentYear); // Takvimi başlangıçta çiz
        showSection('home'); // Başlangıçta Ana Sayfa bölümünü göster
    }
});

function checkPassword() {
    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get('user');
    const birthdayInput = document.getElementById('birthdayInput');
    const errorMessage = document.getElementById('errorMessage');
    const enteredPassword = birthdayInput.value;

    let correctPassword = '';
    if (user === 'yusuf') {
        correctPassword = '0411'; // İlayda'nın doğum günü (Ay: 04, Gün: 11)
    } else if (user === 'ilayda') {
        correctPassword = '0210'; // Yusuf'un doğum günü (Ay: 02, Gün: 10)
    }

    if (enteredPassword === correctPassword) {
        errorMessage.textContent = '';
        window.location.href = 'main.html';
    } else {
        errorMessage.textContent = 'Yanlış doğum günü! Lütfen tekrar deneyin.';
        errorMessage.style.color = '#e66465';
    }
}

// --- Ana Sayfa (main.html) JavaScript Kodları ---

// Menü İşlevselliği
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('active');
}

// Bölümler Arası Geçiş
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    toggleMenu(); // Menüyü kapat
}

// Tarih ve Yıl Dönümü Hesaplama
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('tr-TR', options);
}

const firstMeetingDate = new Date('2024-07-15T00:00:00');

function calculateAnniversary() {
    const anniversaryTextElement = document.getElementById('anniversaryText');
    const today = new Date();
    const diffTime = Math.abs(today - firstMeetingDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    anniversaryTextElement.textContent = `İlk Tanışma Günümüzden Beri ${diffDays} Gün Geçti! ❤️`;
}

// --- Takvim ve Anılar İşlevselliği (Firestore ile güncellendi) ---
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderCalendar(month, year) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearSpan = document.getElementById('monthYear');
    calendarGrid.innerHTML = '';

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

    monthYearSpan.textContent = `${monthNames[month]} ${year}`;

    dayNames.forEach(day => {
        const dayNameDiv = document.createElement('div');
        dayNameDiv.classList.add('day-name');
        dayNameDiv.textContent = day;
        calendarGrid.appendChild(dayNameDiv);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'inactive');
        calendarGrid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = day;

        const currentDayDate = new Date(year, month, day);
        const formattedDate = currentDayDate.toISOString().split('T')[0];

        const hasMemory = memories.some(memory => memory.date === formattedDate);
        if (hasMemory) {
            dayDiv.classList.add('has-memory');
            const heartIcon = document.createElement('i');
            heartIcon.classList.add('fas', 'fa-heart', 'heart-icon');
            dayDiv.appendChild(heartIcon);
        }

        const today = new Date();
        if (currentDayDate.getDate() === today.getDate() &&
            currentDayDate.getMonth() === today.getMonth() &&
            currentDayDate.getFullYear() === today.getFullYear()) {
            dayDiv.classList.add('current-day');
        }

        dayDiv.addEventListener('click', () => selectDay(formattedDate));
        calendarGrid.appendChild(dayDiv);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
}

function openCalendarModal() {
    document.getElementById('calendarModal').style.display = 'flex';
    renderCalendar(currentMonth, currentYear);
}

function closeCalendarModal() {
    document.getElementById('calendarModal').style.display = 'none';
}

let selectedDateForMemory = null;

function selectDay(date) {
    selectedDateForMemory = date;
    closeCalendarModal();
    displayMemory(date);
}

async function displayMemory(date) {
    const memoryContentDiv = document.getElementById('memoryContent');
    const selectedMemoryDateElement = document.getElementById('selectedMemoryDate');
    const memoryInfoElement = document.querySelector('.memory-info');

    const memory = memories.find(m => m.date === date);

    selectedMemoryDateElement.textContent = new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    memoryContentDiv.innerHTML = '';

    if (memory) {
        memoryContentDiv.innerHTML += `<p class="memory-title">${memory.title}</p>`;
        memoryContentDiv.innerHTML += `<p>${memory.text}</p>`;
        if (memory.image) {
            memoryContentDiv.innerHTML += `<div class="image-placeholder"><img src="${memory.image}" alt="Anı Fotoğrafı"></div>`;
        }
        if (memory.video) {
            memoryContentDiv.innerHTML += `<div class="image-placeholder"><video controls src="${memory.video}"></video></div>`;
        }
        memoryInfoElement.style.display = 'none';
    } else {
        memoryContentDiv.innerHTML = `
            <p>Bu Güne Ait Bir Anı Yok</p>
            <div class="image-placeholder">İçerik Yok</div>
        `;
        memoryInfoElement.style.display = 'block';
    }
}

function openMemoryModal() {
    if (!selectedDateForMemory) {
        selectedDateForMemory = new Date().toISOString().split('T')[0];
    }
    document.getElementById('memoryModal').style.display = 'flex';
    document.getElementById('memoryTitleInput').value = '';
    document.getElementById('memoryTextInput').value = '';
    document.getElementById('memoryImageInput').value = '';
    document.getElementById('memoryVideoInput').value = '';
}

function closeMemoryModal() {
    document.getElementById('memoryModal').style.display = 'none';
}

async function saveMemory() {
    const title = document.getElementById('memoryTitleInput').value;
    const text = document.getElementById('memoryTextInput').value;
    const imageFile = document.getElementById('memoryImageInput').files[0];
    const videoFile = document.getElementById('memoryVideoInput').files[0];

    if (!selectedDateForMemory || (!title && !text && !imageFile && !videoFile)) {
        showMessageBox('Lütfen bir başlık veya metin girin, ya da bir fotoğraf/video seçin.');
        return;
    }

    const readerImage = new FileReader();
    const readerVideo = new FileReader();

    let imageData = '';
    let videoData = '';
    let filesToLoad = 0;

    if (imageFile) filesToLoad++;
    if (videoFile) filesToLoad++;

    const saveAfterFilesLoaded = async () => {
        const newMemory = {
            date: selectedDateForMemory,
            title: title,
            text: text,
            image: imageData,
            video: videoData,
            createdAt: new Date() // Oluşturulma zamanı
        };

        try {
            const memoryRef = collection(db, SHARED_COLLECTION_BASE_PATH, 'memories');
            const existingMemoryQuery = query(memoryRef, where("date", "==", selectedDateForMemory));
            const existingMemorySnapshot = await getDocs(existingMemoryQuery);

            if (!existingMemorySnapshot.empty) {
                // Mevcut anıyı güncelle
                const docToUpdate = existingMemorySnapshot.docs[0];
                await setDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'memories', docToUpdate.id), newMemory, { merge: true });
            } else {
                // Yeni anı ekle
                await addDoc(collection(db, SHARED_COLLECTION_BASE_PATH, 'memories'), newMemory);
            }
            showMessageBox('Anı başarıyla kaydedildi!');
            closeMemoryModal();
            // displayMemory ve renderCalendar onSnapshot tarafından otomatik güncellenecek
        } catch (e) {
            console.error("Anı kaydedilirken hata oluştu: ", e);
            showMessageBox("Anı kaydedilirken bir sorun oluştu.");
        }
    };

    if (filesToLoad > 0) {
        let loadedCount = 0;

        if (imageFile) {
            readerImage.onload = (e) => {
                imageData = e.target.result;
                loadedCount++;
                if (loadedCount === filesToLoad) saveAfterFilesLoaded();
            };
            readerImage.readAsDataURL(imageFile);
        }

        if (videoFile) {
            readerVideo.onload = (e) => {
                videoData = e.target.result;
                loadedCount++;
                if (loadedCount === filesToLoad) saveAfterFilesLoaded();
            };
            readerVideo.readAsDataURL(videoFile);
        }
    } else {
        saveAfterFilesLoaded();
    }
}

// --- Ruh Hali İşlevselliği (Firestore ile güncellendi) ---

async function saveMood() {
    const myMood = document.getElementById('myMood').value;
    const moodReason = document.getElementById('moodReason').value;
    const today = new Date().toISOString().split('T')[0];

    const newMood = {
        date: today,
        mood: myMood,
        reason: moodReason,
        user: userId // Kimlik doğrulanan kullanıcının ID'si
    };

    try {
        const moodRef = collection(db, SHARED_COLLECTION_BASE_PATH, 'moods');
        const existingMoodQuery = query(moodRef, where("date", "==", today), where("user", "==", userId));
        const existingMoodSnapshot = await getDocs(existingMoodQuery);

        if (!existingMoodSnapshot.empty) {
            const docToUpdate = existingMoodSnapshot.docs[0];
            await setDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'moods', docToUpdate.id), newMood, { merge: true });
        } else {
            await addDoc(collection(db, SHARED_COLLECTION_BASE_PATH, 'moods'), newMood);
        }
        showMessageBox('Ruh haliniz kaydedildi!');
        // displayMoods onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Ruh hali kaydedilirken hata oluştu: ", e);
        showMessageBox("Ruh hali kaydedilirken bir sorun oluştu.");
    }
}

function displayMoods() {
    const myMoodStatus = document.getElementById('myMoodStatus');
    const partnerMoodStatus = document.getElementById('partnerMoodStatus');
    const today = new Date().toISOString().split('T')[0];

    const myTodayMood = moods.find(m => m.date === today && m.user === userId);
    // Partnerin ruh halini bulmak için farklı bir kullanıcı ID'si veya varsayılan bir isim kullanabiliriz.
    // Anonim giriş olduğu için burada sadece "Partner" diyebiliriz.
    const partnerTodayMood = moods.find(m => m.date === today && m.user !== userId);


    if (myTodayMood) {
        myMoodStatus.textContent = `Senin son ruh halin: ${myTodayMood.mood} (${myTodayMood.reason})`;
    } else {
        myMoodStatus.textContent = 'Senin son ruh halin: Henüz kaydetmedin.';
    }

    if (partnerTodayMood) {
        partnerMoodStatus.textContent = `Partnerin son ruh hali: ${partnerTodayMood.mood} (${partnerTodayMood.reason})`;
    } else {
        partnerMoodStatus.textContent = 'Partnerin son ruh hali: Henüz kaydetmedi.';
    }
}


// --- Şiirler İşlevselliği (Firestore ile güncellendi) ---

async function addPoem() {
    const titleInput = document.getElementById('poemTitleInput');
    const textInput = document.getElementById('poemTextInput');
    const title = titleInput.value.trim();
    const text = textInput.value.trim();

    if (!title || !text) {
        showMessageBox('Lütfen şiir başlığı ve metni girin.');
        return;
    }

    const newPoem = {
        title: title,
        text: text,
        date: new Date().toLocaleDateString('tr-TR'),
        createdAt: new Date()
    };

    try {
        await addDoc(collection(db, SHARED_COLLECTION_BASE_PATH, 'poems'), newPoem);
        titleInput.value = '';
        textInput.value = '';
        showMessageBox('Şiir başarıyla eklendi!');
        // displayPoems onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Şiir eklenirken hata oluştu: ", e);
        showMessageBox("Şiir eklenirken bir sorun oluştu.");
    }
}

function displayPoems() {
    const poemsList = document.getElementById('poemsList');
    poemsList.innerHTML = '';
    if (poems.length === 0) {
        poemsList.innerHTML = '<p class="no-content">Henüz bir şiir eklenmedi.</p>';
        return;
    }
    // Tarihe göre tersten sırala (en yeni en üstte)
    const sortedPoems = [...poems].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()); // Firestore timestamp'i Date objesine çevir

    sortedPoems.forEach(poem => {
        const poemDiv = document.createElement('div');
        poemDiv.classList.add('poem-item');
        poemDiv.innerHTML = `
            <h3>${poem.title}</h3>
            <p>${poem.text}</p>
            <p style="font-size: 0.8em; color: #999; text-align: right;">Eklenme Tarihi: ${poem.date}</p>
            <button class="delete-button" onclick="deletePoem('${poem.id}')"><i class="fas fa-trash"></i></button>
        `;
        poemsList.appendChild(poemDiv);
    });
}

async function deletePoem(id) {
    try {
        await deleteDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'poems', id));
        showMessageBox('Şiir silindi.');
        // displayPoems onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Şiir silinirken hata oluştu: ", e);
        showMessageBox("Şiir silinirken bir sorun oluştu.");
    }
}

// --- Galeri İşlevselliği (Firestore ile güncellendi) ---

async function addGalleryItem() {
    const fileInput = document.getElementById('galleryFileInput');
    const files = fileInput.files;

    if (files.length === 0) {
        showMessageBox('Lütfen galeriye eklemek için dosya seçin.');
        return;
    }

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const newItem = {
                type: file.type.startsWith('image') ? 'image' : 'video',
                data: e.target.result, // Base64 verisi
                name: file.name,
                createdAt: new Date()
            };
            try {
                await addDoc(collection(db, SHARED_COLLECTION_BASE_PATH, 'galleryItems'), newItem);
                showMessageBox('Galeriye başarıyla eklendi!');
                // displayGallery onSnapshot tarafından otomatik güncellenecek
            } catch (e) {
                console.error("Galeri öğesi eklenirken hata oluştu: ", e);
                showMessageBox("Galeri öğesi eklenirken bir sorun oluştu.");
            }
        };
        reader.readAsDataURL(file);
    }
    fileInput.value = ''; // Inputu temizle
}

function displayGallery() {
    const galleryContent = document.getElementById('galleryContent');
    galleryContent.innerHTML = '';
    if (galleryItems.length === 0) {
        galleryContent.innerHTML = '<p class="no-content">Henüz galeriye fotoğraf veya video eklenmedi.</p>';
        return;
    }

    // En yeni en üstte olacak şekilde sırala
    const sortedGalleryItems = [...galleryItems].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

    sortedGalleryItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('gallery-item');
        let mediaElement;
        if (item.type === 'image') {
            mediaElement = document.createElement('img');
            mediaElement.src = item.data;
            mediaElement.alt = item.name;
        } else if (item.type === 'video') {
            mediaElement = document.createElement('video');
            mediaElement.src = item.data;
            mediaElement.controls = true;
        }
        itemDiv.appendChild(mediaElement);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => deleteGalleryItem(item.id);
        itemDiv.appendChild(deleteBtn);

        galleryContent.appendChild(itemDiv);
    });
}

async function deleteGalleryItem(id) {
    try {
        await deleteDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'galleryItems', id));
        showMessageBox('Galeri öğesi silindi.');
        // displayGallery onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Galeri öğesi silinirken hata oluştu: ", e);
        showMessageBox("Galeri öğesi silinirken bir sorun oluştu.");
    }
}

// --- Yapılacaklar Listesi İşlevselliği (Firestore ile güncellendi) ---

async function addTodoItem() {
    const todoInput = document.getElementById('todoInput');
    const text = todoInput.value.trim();
    if (!text) {
        showMessageBox('Lütfen bir görev girin.');
        return;
    }
    const newItem = {
        text: text,
        completed: false,
        createdAt: new Date()
    };
    try {
        await addDoc(collection(db, SHARED_COLLECTION_BASE_PATH, 'todoList'), newItem);
        todoInput.value = '';
        showMessageBox('Görev eklendi!');
        // displayTodoList onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Görev eklenirken hata oluştu: ", e);
        showMessageBox("Görev eklenirken bir sorun oluştu.");
    }
}

function displayTodoList() {
    const listElement = document.getElementById('todoList');
    listElement.innerHTML = '';
    if (todoList.length === 0) {
        listElement.innerHTML = '<p class="no-content">Henüz yapılacak bir görev yok.</p>';
        return;
    }
    // Tamamlanmamışları üste, sonra tamamlanmışları sırala
    const sortedTodoList = [...todoList].sort((a, b) => {
        if (a.completed === b.completed) {
            return b.createdAt.toDate() - a.createdAt.toDate(); // Aynı durumdaysa oluşturulma tarihine göre
        }
        return a.completed ? 1 : -1; // Tamamlanmışlar sona
    });

    sortedTodoList.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('list-item');
        if (item.completed) {
            itemDiv.classList.add('completed');
        }
        itemDiv.innerHTML = `
            <input type="checkbox" class="item-checkbox" ${item.completed ? 'checked' : ''} onchange="toggleTodoCompleted('${item.id}', ${item.completed})">
            <span class="item-text">${item.text}</span>
            <button class="delete-button" onclick="deleteTodoItem('${item.id}')"><i class="fas fa-trash"></i></button>
        `;
        listElement.appendChild(itemDiv);
    });
}

async function toggleTodoCompleted(id, currentStatus) {
    try {
        await updateDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'todoList', id), {
            completed: !currentStatus
        });
        // displayTodoList onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Görev durumu güncellenirken hata oluştu: ", e);
        showMessageBox("Görev durumu güncellenirken bir sorun oluştu.");
    }
}

async function deleteTodoItem(id) {
    try {
        await deleteDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'todoList', id));
        showMessageBox('Görev silindi.');
        // displayTodoList onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Görev silinirken hata oluştu: ", e);
        showMessageBox("Görev silinirken bir sorun oluştu.");
    }
}

// --- İzlenecek Filmler İşlevselliği (Firestore ile güncellendi) ---

async function addMovieItem() {
    const movieInput = document.getElementById('movieInput');
    const text = movieInput.value.trim();
    if (!text) {
        showMessageBox('Lütfen bir film adı girin.');
        return;
    }
    const newItem = {
        text: text,
        watched: false,
        createdAt: new Date()
    };
    try {
        await addDoc(collection(db, SHARED_COLLECTION_BASE_PATH, 'movieList'), newItem);
        movieInput.value = '';
        showMessageBox('Film eklendi!');
        // displayMovieList onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Film eklenirken hata oluştu: ", e);
        showMessageBox("Film eklenirken bir sorun oluştu.");
    }
}

function displayMovieList() {
    const listElement = document.getElementById('movieList');
    listElement.innerHTML = '';
    if (movieList.length === 0) {
        listElement.innerHTML = '<p class="no-content">Henüz izlenecek bir film yok.</p>';
        return;
    }
    // İzlenmemişleri üste, sonra izlenmişleri sırala
    const sortedMovieList = [...movieList].sort((a, b) => {
        if (a.watched === b.watched) {
            return b.createdAt.toDate() - a.createdAt.toDate(); // Aynı durumdaysa oluşturulma tarihine göre
        }
        return a.watched ? 1 : -1; // İzlenmişler sona
    });

    sortedMovieList.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('list-item');
        if (item.watched) {
            itemDiv.classList.add('completed');
        }
        itemDiv.innerHTML = `
            <input type="checkbox" class="item-checkbox" ${item.watched ? 'checked' : ''} onchange="toggleMovieWatched('${item.id}', ${item.watched})">
            <span class="item-text">${item.text}</span>
            <button class="delete-button" onclick="deleteMovieItem('${item.id}')"><i class="fas fa-trash"></i></button>
        `;
        listElement.appendChild(itemDiv);
    });
}

async function toggleMovieWatched(id, currentStatus) {
    try {
        await updateDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'movieList', id), {
            watched: !currentStatus
        });
        // displayMovieList onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Film izlenme durumu güncellenirken hata oluştu: ", e);
        showMessageBox("Film izlenme durumu güncellenirken bir sorun oluştu.");
    }
}

async function deleteMovieItem(id) {
    try {
        await deleteDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'movieList', id));
        showMessageBox('Film silindi.');
        // displayMovieList onSnapshot tarafından otomatik güncellenecek
    }
}

// --- Özel Günler İşlevselliği (Firestore ile güncellendi) ---

async function addSpecialDay() {
    const nameInput = document.getElementById('specialDayNameInput');
    const dateInput = document.getElementById('specialDayDateInput');
    const name = nameInput.value.trim();
    const date = dateInput.value; // YYYY-MM-DD formatında

    if (!name || !date) {
        showMessageBox('Lütfen özel gün adı ve tarihini girin.');
        return;
    }

    const newItem = {
        name: name,
        date: date,
        createdAt: new Date()
    };
    try {
        await addDoc(collection(db, SHARED_COLLECTION_BASE_PATH, 'specialDays'), newItem);
        nameInput.value = '';
        dateInput.value = '';
        showMessageBox('Özel gün eklendi!');
        // displaySpecialDays onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Özel gün eklenirken hata oluştu: ", e);
        showMessageBox("Özel gün eklenirken bir sorun oluştu.");
    }
}

function displaySpecialDays() {
    const listElement = document.getElementById('specialDaysList');
    listElement.innerHTML = '';
    if (specialDays.length === 0) {
        listElement.innerHTML = '<p class="no-content">Henüz özel bir gün eklenmedi.</p>';
        return;
    }
    // Tarihe göre sırala
    const sortedSpecialDays = [...specialDays].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedSpecialDays.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('list-item');
        const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        itemDiv.innerHTML = `
            <span class="item-text">${item.name} - ${formattedDate}</span>
            <button class="delete-button" onclick="deleteSpecialDay('${item.id}')"><i class="fas fa-trash"></i></button>
        `;
        listElement.appendChild(itemDiv);
    });
}

async function deleteSpecialDay(id) {
    try {
        await deleteDoc(doc(db, SHARED_COLLECTION_BASE_PATH, 'specialDays', id));
        showMessageBox('Özel gün silindi.');
        // displaySpecialDays onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Özel gün silinirken hata oluştu: ", e);
        showMessageBox("Özel gün silinirken bir sorun oluştu.");
    }
}

// --- Hakkımızda İşlevselliği (Firestore ile güncellendi) ---

async function editAboutContent() {
    const aboutContent = document.getElementById('aboutContent');
    const editBtn = document.querySelector('#about .button:nth-of-type(1)');
    const saveBtn = document.querySelector('#about .button:nth-of-type(2)');

    aboutContent.contentEditable = true;
    aboutContent.focus();
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    showMessageBox('Hakkımızda bölümünü düzenleyebilirsiniz.');
}

async function saveAboutContent() {
    const aboutContent = document.getElementById('aboutContent');
    const editBtn = document.querySelector('#about .button:nth-of-type(1)');
    const saveBtn = document.querySelector('#about .button:nth-of-type(2)');

    aboutContent.contentEditable = false;
    try {
        // Hakkımızda içeriği için tek bir belge kullanacağız
        const aboutDocRef = doc(db, SHARED_COLLECTION_BASE_PATH, 'aboutContent', 'mainContent');
        await setDoc(aboutDocRef, { htmlContent: aboutContent.innerHTML, lastUpdated: new Date() }, { merge: true });
        showMessageBox('Hakkımızda bölümü kaydedildi.');
        // Hakkımızda içeriği onSnapshot tarafından otomatik güncellenecek
    } catch (e) {
        console.error("Hakkımızda bölümü kaydedilirken hata oluştu: ", e);
        showMessageBox("Hakkımızda bölümü kaydedilirken bir sorun oluştu.");
    }
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
}

function loadAboutContent() {
    // Hakkımızda içeriği onSnapshot ile gerçek zamanlı yüklenecek
    // Bu fonksiyon sadece ilk yüklemede çağrılacak, sonra listener devralacak.
}

// --- Sürpriz Anılar İşlevselliği ---
function showRandomMemory() {
    const randomMemoryDisplay = document.getElementById('randomMemoryDisplay');
    randomMemoryDisplay.innerHTML = '';

    if (memories.length === 0) {
        randomMemoryDisplay.innerHTML = '<p class="no-content">Henüz kaydedilmiş bir anı yok.</p>';
        return;
    }

    const randomIndex = Math.floor(Math.random() * memories.length);
    const randomMemory = memories[randomIndex];

    randomMemoryDisplay.innerHTML = `
        <h3 class="section-title">${randomMemory.title}</h3>
        <p class="selected-memory-date">${new Date(randomMemory.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div class="memory-content">
            <p>${randomMemory.text}</p>
            ${randomMemory.image ? `<div class="image-placeholder"><img src="${randomMemory.image}" alt="Anı Fotoğrafı"></div>` : ''}
            ${randomMemory.video ? `<div class="image-placeholder"><video controls src="${randomMemory.video}"></video></div>` : ''}
        </div>
    `;
}

// --- Firestore Gerçek Zamanlı Dinleyiciler ve Veri Yükleme ---
// Bu fonksiyon, Firestore'daki verilerde herhangi bir değişiklik olduğunda otomatik olarak tetiklenir.
function setupFirestoreListeners() {
    // Anılar için dinleyici
    onSnapshot(collection(db, SHARED_COLLECTION_BASE_PATH, 'memories'), (snapshot) => {
        memories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Anılar güncellendi:", memories);
        // Takvimi ve mevcut anıyı güncelle
        renderCalendar(currentMonth, currentYear);
        if (selectedDateForMemory) {
            displayMemory(selectedDateForMemory);
        } else {
            displayMemory(new Date().toISOString().split('T')[0]); // Varsayılan olarak bugünün anısı
        }
    }, (error) => {
        console.error("Anılar dinlenirken hata oluştu:", error);
        showMessageBox("Anılar yüklenirken bir sorun oluştu.");
    });

    // Şiirler için dinleyici
    onSnapshot(collection(db, SHARED_COLLECTION_BASE_PATH, 'poems'), (snapshot) => {
        poems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Şiirler güncellendi:", poems);
        displayPoems();
    }, (error) => {
        console.error("Şiirler dinlenirken hata oluştu:", error);
        showMessageBox("Şiirler yüklenirken bir sorun oluştu.");
    });

    // Galeri için dinleyici
    onSnapshot(collection(db, SHARED_COLLECTION_BASE_PATH, 'galleryItems'), (snapshot) => {
        galleryItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Galeri güncellendi:", galleryItems);
        displayGallery();
    }, (error) => {
        console.error("Galeri dinlenirken hata oluştu:", error);
        showMessageBox("Galeri yüklenirken bir sorun oluştu.");
    });

    // Yapılacaklar Listesi için dinleyici
    onSnapshot(collection(db, SHARED_COLLECTION_BASE_PATH, 'todoList'), (snapshot) => {
        todoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Yapılacaklar listesi güncellendi:", todoList);
        displayTodoList();
    }, (error) => {
        console.error("Yapılacaklar listesi dinlenirken hata oluştu:", error);
        showMessageBox("Yapılacaklar listesi yüklenirken bir sorun oluştu.");
    });

    // İzlenecek Filmler için dinleyici
    onSnapshot(collection(db, SHARED_COLLECTION_BASE_PATH, 'movieList'), (snapshot) => {
        movieList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Film listesi güncellendi:", movieList);
        displayMovieList();
    }, (error) => {
        console.error("Film listesi dinlenirken hata oluştu:", error);
        showMessageBox("Film listesi yüklenirken bir sorun oluştu.");
    });

    // Özel Günler için dinleyici
    onSnapshot(collection(db, SHARED_COLLECTION_BASE_PATH, 'specialDays'), (snapshot) => {
        specialDays = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Özel günler güncellendi:", specialDays);
        displaySpecialDays();
    }, (error) => {
        console.error("Özel günler dinlenirken hata oluştu:", error);
        showMessageBox("Özel günler yüklenirken bir sorun oluştu.");
    });

    // Hakkımızda içeriği için dinleyici (tek belge olduğu için doc referansı)
    onSnapshot(doc(db, SHARED_COLLECTION_BASE_PATH, 'aboutContent', 'mainContent'), (docSnapshot) => {
        const aboutContentElement = document.getElementById('aboutContent');
        if (docSnapshot.exists()) {
            aboutContentHtml = docSnapshot.data().htmlContent;
            aboutContentElement.innerHTML = aboutContentHtml;
        } else {
            aboutContentHtml = '<p>Bu kısım, Yusuf ve İlayda\'nın aşk hikayesini anlatacağımız yerdir. Burayı dilediğiniz gibi düzenleyebilirsiniz.</p>';
            aboutContentElement.innerHTML = aboutContentHtml;
        }
        console.log("Hakkımızda içeriği güncellendi.");
    }, (error) => {
        console.error("Hakkımızda içeriği dinlenirken hata oluştu:", error);
        showMessageBox("Hakkımızda içeriği yüklenirken bir sorun oluştu.");
    });

    // Ruh halleri için dinleyici
    onSnapshot(collection(db, SHARED_COLLECTION_BASE_PATH, 'moods'), (snapshot) => {
        moods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Ruh halleri güncellendi:", moods);
        displayMoods();
    }, (error) => {
        console.error("Ruh halleri dinlenirken hata oluştu:", error);
        showMessageBox("Ruh halleri yüklenirken bir sorun oluştu.");
    });
}

// Tüm verileri yükleyen ve gösteren ana fonksiyon
// Bu fonksiyon, Firebase başlatıldıktan ve kullanıcı kimliği doğrulandıktan sonra çağrılır.
function loadAllData() {
    if (!db) {
        console.warn("Firestore henüz başlatılmadı. Veri yükleme ertelendi.");
        return;
    }
    setupFirestoreListeners(); // Firestore dinleyicilerini başlat
    // Ana sayfaya ilk girildiğinde bugünün anısını göster
    displayMemory(new Date().toISOString().split('T')[0]);
}
