// --- index.html ve password.html için olan fonksiyonlar ---

// index.html sayfasındaki butonlara tıklandığında çalışır
function goToSecondPage(user) {
    // Kullanıcıya göre password.html sayfasına yönlendirme yapar
    window.location.href = `password.html?user=${user}`;
}

// password.html sayfası yüklendiğinde çalışır
document.addEventListener('DOMContentLoaded', () => {
    // Sadece password.html sayfasında çalışacak kodlar
    if (document.getElementById('passwordTitle')) {
        const urlParams = new URLSearchParams(window.location.search);
        const user = urlParams.get('user'); // URL'den kullanıcı adını alır (yusuf veya ilayda)

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

        // Doğum günü input alanına sadece rakam girilmesini sağlar
        if (birthdayInput) {
            birthdayInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, ''); // Sadece rakamları tutar
            });
        }
    }

    // Sadece main.html sayfasında çalışacak kodlar
    // Bu kısım, main.html yüklendiğinde çalışacak fonksiyonları çağırır
    if (document.getElementById('currentDate')) {
        updateCurrentDate();
        calculateAnniversary();
        renderCalendar(currentMonth, currentYear); // Takvimi başlangıçta çiz
        loadAllData(); // Sayfa yüklendiğinde tüm verileri yükle
        showSection('home'); // Başlangıçta Ana Sayfa bölümünü göster
    }
});

// Şifre kontrolünü yapar ve ana sayfaya yönlendirir
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
        // Şifre doğruysa ana sayfaya yönlendir
        window.location.href = 'main.html'; // Ana sayfamızın adı main.html olacak
    } else {
        errorMessage.textContent = 'Yanlış doğum günü! Lütfen tekrar deneyin.';
        errorMessage.style.color = '#e66465';
    }
}


// --- Ana Sayfa (main.html) JavaScript Kodları ---

// Verileri Local Storage'da saklamak için yardımcı fonksiyonlar
// Local Storage, tarayıcının verileri kalıcı olarak saklamasını sağlar.
// Tarayıcı kapatılsa bile veriler kaybolmaz.
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

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

// Menü İşlevselliği
// Yan menüyü açıp kapatır.
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('active'); // CSS'deki 'active' sınıfını ekler/kaldırır
}

// Bölümler Arası Geçiş
// Menüden seçilen bölümleri gösterir, diğerlerini gizler.
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active'); // Tüm bölümleri gizle
    });
    document.getElementById(sectionId).classList.add('active'); // Seçilen bölümü göster
    toggleMenu(); // Menüyü kapat
}

// Tarih ve Yıl Dönümü Hesaplama
// Üst başlıkta güncel tarihi gösterir.
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('tr-TR', options);
}

// İlk tanışma tarihi (Örnek: 15 Temmuz 2024)
// Bu tarihi kendi tanışma tarihinizle değiştirebilirsiniz.
const firstMeetingDate = new Date('2024-07-15T00:00:00');

// Tanışma gününden bu yana geçen gün sayısını hesaplar.
function calculateAnniversary() {
    const anniversaryTextElement = document.getElementById('anniversaryText');
    const today = new Date();
    const diffTime = Math.abs(today - firstMeetingDate); // Farkı milisaniye cinsinden alır
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Gün cinsine çevirir
    anniversaryTextElement.textContent = `İlk Tanışma Günümüzden Beri ${diffDays} Gün Geçti! ❤️`;
}

// --- Takvim ve Anılar İşlevselliği ---
let currentMonth = new Date().getMonth(); // Mevcut ay
let currentYear = new Date().getFullYear(); // Mevcut yıl
let memories = loadData('memories'); // Anıları local storage'dan yükle

// Takvimi çizer (günleri, anıları olan günleri işaretler)
function renderCalendar(month, year) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearSpan = document.getElementById('monthYear');
    calendarGrid.innerHTML = ''; // Takvimi temizle

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

    monthYearSpan.textContent = `${monthNames[month]} ${year}`;

    // Haftanın günlerini ekle (Pzt, Sal, ...)
    dayNames.forEach(day => {
        const dayNameDiv = document.createElement('div');
        dayNameDiv.classList.add('day-name');
        dayNameDiv.textContent = day;
        calendarGrid.appendChild(dayNameDiv);
    });

    // Ayın ilk gününün haftanın hangi günü olduğunu bulur
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Ayın kaç gün olduğunu bulur

    // Ayın ilk gününe kadar boşlukları doldur (Takvimin Pazartesi başlaması için)
    // JavaScript'te getDay() Pazar'ı 0, Pazartesi'yi 1 verir. Bizim takvimimiz Pazartesi ile başlıyor.
    let startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Pazar ise 6, diğer günler için -1

    for (let i = 0; i < startDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'inactive'); // Boş ve pasif gün
        calendarGrid.appendChild(emptyDiv);
    }

    // Günleri ekle
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = day;

        const currentDayDate = new Date(year, month, day);
        const formattedDate = currentDayDate.toISOString().split('T')[0]; // YYYY-MM-DD formatı

        // Bu güne ait anı var mı kontrol et
        const hasMemory = memories.some(memory => memory.date === formattedDate);
        if (hasMemory) {
            dayDiv.classList.add('has-memory'); // Anı varsa özel stil uygula
            const heartIcon = document.createElement('i');
            heartIcon.classList.add('fas', 'fa-heart', 'heart-icon'); // Kalp ikonu
            dayDiv.appendChild(heartIcon);
        }

        // Bugünü işaretle
        const today = new Date();
        if (currentDayDate.getDate() === today.getDate() &&
            currentDayDate.getMonth() === today.getMonth() &&
            currentDayDate.getFullYear() === today.getFullYear()) {
            dayDiv.classList.add('current-day'); // Bugüne özel stil uygula
        }

        dayDiv.addEventListener('click', () => selectDay(formattedDate)); // Güne tıklama olayı
        calendarGrid.appendChild(dayDiv);
    }
}

// Ayı değiştirir (ileri/geri)
function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear); // Takvimi yeniden çiz
}

// Takvim modalını açar
function openCalendarModal() {
    document.getElementById('calendarModal').style.display = 'flex';
    renderCalendar(currentMonth, currentYear); // Modalı açarken takvimi tekrar çiz
}

// Takvim modalını kapatır
function closeCalendarModal() {
    document.getElementById('calendarModal').style.display = 'none';
}

let selectedDateForMemory = null; // Anı eklemek için seçilen tarih

// Güne tıklandığında anıyı seçer ve gösterir
function selectDay(date) {
    selectedDateForMemory = date; // Anı eklemek için tarihi kaydet
    closeCalendarModal(); // Takvim modalını kapat
    displayMemory(date); // Seçilen günün anısını göster
}

// Seçilen günün anısını ana sayfada gösterir
function displayMemory(date) {
    const memoryContentDiv = document.getElementById('memoryContent');
    const selectedMemoryDateElement = document.getElementById('selectedMemoryDate');
    const memoryInfoElement = document.querySelector('.memory-info');

    const memory = memories.find(m => m.date === date); // Seçilen tarihe ait anıyı bul

    // Tarihi göster
    selectedMemoryDateElement.textContent = new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    memoryContentDiv.innerHTML = ''; // Önceki içeriği temizle

    if (memory) {
        // Anı varsa içeriğini göster
        memoryContentDiv.innerHTML += `<p class="memory-title">${memory.title}</p>`;
        memoryContentDiv.innerHTML += `<p>${memory.text}</p>`;
        if (memory.image) {
            memoryContentDiv.innerHTML += `<div class="image-placeholder"><img src="${memory.image}" alt="Anı Fotoğrafı"></div>`;
        }
        if (memory.video) {
            memoryContentDiv.innerHTML += `<div class="image-placeholder"><video controls src="${memory.video}"></video></div>`;
        }
        memoryInfoElement.style.display = 'none'; // Anı varsa bilgi mesajını gizle
    } else {
        // Anı yoksa varsayılan mesajı göster
        memoryContentDiv.innerHTML = `
            <p>Bu Güne Ait Bir Anı Yok</p>
            <div class="image-placeholder">İçerik Yok</div>
        `;
        memoryInfoElement.style.display = 'block'; // Anı yoksa bilgi mesajını göster
    }
}

// Anı ekleme modalını açar
function openMemoryModal() {
    // Eğer takvimden bir gün seçilmediyse, bugünü varsayılan olarak ayarla
    if (!selectedDateForMemory) {
        selectedDateForMemory = new Date().toISOString().split('T')[0];
    }
    document.getElementById('memoryModal').style.display = 'flex';
    // Modalı açarken inputları temizle
    document.getElementById('memoryTitleInput').value = '';
    document.getElementById('memoryTextInput').value = '';
    document.getElementById('memoryImageInput').value = '';
    document.getElementById('memoryVideoInput').value = '';
}

// Anı ekleme modalını kapatır
function closeMemoryModal() {
    document.getElementById('memoryModal').style.display = 'none';
}

// Anıyı kaydeder
function saveMemory() {
    const title = document.getElementById('memoryTitleInput').value;
    const text = document.getElementById('memoryTextInput').value;
    const imageFile = document.getElementById('memoryImageInput').files[0];
    const videoFile = document.getElementById('memoryVideoInput').files[0];

    if (!selectedDateForMemory || (!title && !text && !imageFile && !videoFile)) {
        showMessageBox('Lütfen bir başlık veya metin girin, ya da bir fotoğraf/video seçin.');
        return;
    }

    // Dosyaları Base64'e dönüştürme (küçük dosyalar için uygun, büyükler için sunucu gerekir)
    const readerImage = new FileReader();
    const readerVideo = new FileReader();

    let imageData = '';
    let videoData = '';
    let filesToLoad = 0;

    if (imageFile) filesToLoad++;
    if (videoFile) filesToLoad++;

    const saveAfterFilesLoaded = () => {
        const newMemory = {
            date: selectedDateForMemory,
            title: title,
            text: text,
            image: imageData,
            video: videoData
        };

        // Mevcut anıyı güncelle veya yeni anı ekle
        const existingMemoryIndex = memories.findIndex(m => m.date === selectedDateForMemory);
        if (existingMemoryIndex > -1) {
            memories[existingMemoryIndex] = newMemory;
        } else {
            memories.push(newMemory);
        }
        saveData('memories', memories); // Anıları kaydet
        showMessageBox('Anı başarıyla kaydedildi!');
        closeMemoryModal();
        displayMemory(selectedDateForMemory); // Anıyı tekrar göster
        renderCalendar(currentMonth, currentYear); // Takvimi güncelle (kalp simgesi için)
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
        saveAfterFilesLoaded(); // Dosya yoksa doğrudan kaydet
    }
}

// Ruh Hali İşlevselliği
let moods = loadData('moods'); // Ruh hallerini local storage'dan yükle

// Ruh halini kaydeder
function saveMood() {
    const myMood = document.getElementById('myMood').value;
    const moodReason = document.getElementById('moodReason').value;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı

    const newMood = {
        date: today,
        mood: myMood,
        reason: moodReason,
        user: 'Yusuf' // Bu kısım giriş yapan kullanıcıya göre değişebilir. Şimdilik sabit.
    };

    // Mevcut ruh halini güncelle veya yeni ruh halini ekle
    const existingMoodIndex = moods.findIndex(m => m.date === today && m.user === newMood.user);
    if (existingMoodIndex > -1) {
        moods[existingMoodIndex] = newMood;
    } else {
        moods.push(newMood);
    }
    saveData('moods', moods); // Ruh hallerini kaydet
    showMessageBox('Ruh haliniz kaydedildi!');
    displayMoods(); // Ruh hallerini tekrar göster
}

// Ruh hallerini ana sayfada gösterir
function displayMoods() {
    const myMoodStatus = document.getElementById('myMoodStatus');
    const partnerMoodStatus = document.getElementById('partnerMoodStatus');
    const today = new Date().toISOString().split('T')[0];

    // Bugünün ruh hallerini bul
    const myTodayMood = moods.find(m => m.date === today && m.user === 'Yusuf');
    const partnerTodayMood = moods.find(m => m.date === today && m.user === 'İlayda');

    if (myTodayMood) {
        myMoodStatus.textContent = `Senin son ruh halin: ${myTodayMood.mood} (${myTodayMood.reason})`;
    } else {
        myMoodStatus.textContent = 'Senin son ruh halin: Henüz kaydetmedin.';
    }

    if (partnerTodayMood) {
        partnerMoodStatus.textContent = `İlayda'nın son ruh hali: ${partnerTodayMood.mood} (${partnerTodayMood.reason})`;
    } else {
        partnerMoodStatus.textContent = 'İlayda\'nın son ruh hali: Henüz kaydetmedi.';
    }
}

// --- Şiirler İşlevselliği ---
let poems = loadData('poems'); // Şiirleri local storage'dan yükle

// Yeni şiir ekler
function addPoem() {
    const titleInput = document.getElementById('poemTitleInput');
    const textInput = document.getElementById('poemTextInput');
    const title = titleInput.value.trim();
    const text = textInput.value.trim();

    if (!title || !text) {
        showMessageBox('Lütfen şiir başlığı ve metni girin.');
        return;
    }

    const newPoem = {
        id: Date.now(), // Benzersiz ID oluştur
        title: title,
        text: text,
        date: new Date().toLocaleDateString('tr-TR') // Eklenme tarihi
    };

    poems.push(newPoem);
    saveData('poems', poems); // Şiirleri kaydet
    titleInput.value = ''; // Inputları temizle
    textInput.value = '';
    displayPoems(); // Şiirleri tekrar göster
    showMessageBox('Şiir başarıyla eklendi!');
}

// Şiirleri listeler
function displayPoems() {
    const poemsList = document.getElementById('poemsList');
    poemsList.innerHTML = '';
    if (poems.length === 0) {
        poemsList.innerHTML = '<p class="no-content">Henüz bir şiir eklenmedi.</p>';
        return;
    }
    poems.forEach(poem => {
        const poemDiv = document.createElement('div');
        poemDiv.classList.add('poem-item');
        poemDiv.innerHTML = `
            <h3>${poem.title}</h3>
            <p>${poem.text}</p>
            <p style="font-size: 0.8em; color: #999; text-align: right;">Eklenme Tarihi: ${poem.date}</p>
            <button class="delete-button" onclick="deletePoem(${poem.id})"><i class="fas fa-trash"></i></button>
        `;
        poemsList.appendChild(poemDiv);
    });
}

// Şiiri siler
function deletePoem(id) {
    poems = poems.filter(poem => poem.id !== id);
    saveData('poems', poems); // Şiirleri kaydet
    displayPoems(); // Şiirleri tekrar göster
    showMessageBox('Şiir silindi.');
}

// --- Galeri İşlevselliği ---
let galleryItems = loadData('galleryItems'); // Galeri öğelerini local storage'dan yükle

// Galeriye fotoğraf veya video ekler
function addGalleryItem() {
    const fileInput = document.getElementById('galleryFileInput');
    const files = fileInput.files;

    if (files.length === 0) {
        showMessageBox('Lütfen galeriye eklemek için dosya seçin.');
        return;
    }

    let loadedCount = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = (e) => {
            const newItem = {
                id: Date.now() + i, // Benzersiz ID
                type: file.type.startsWith('image') ? 'image' : 'video', // Dosya türü (resim/video)
                data: e.target.result, // Base64 formatında dosya verisi
                name: file.name
            };
            galleryItems.push(newItem);
            loadedCount++;
            if (loadedCount === files.length) {
                saveData('galleryItems', galleryItems); // Galeri öğelerini kaydet
                displayGallery(); // Galeriyi tekrar göster
                showMessageBox('Galeriye başarıyla eklendi!');
                fileInput.value = ''; // Inputu temizle
            }
        };
        reader.readAsDataURL(file); // Dosyayı Base64'e dönüştür
    }
}

// Galeriyi gösterir
function displayGallery() {
    const galleryContent = document.getElementById('galleryContent');
    galleryContent.innerHTML = '';
    if (galleryItems.length === 0) {
        galleryContent.innerHTML = '<p class="no-content">Henüz galeriye fotoğraf veya video eklenmedi.</p>';
        return;
    }

    galleryItems.forEach(item => {
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
            mediaElement.controls = true; // Video kontrollerini göster
        }
        itemDiv.appendChild(mediaElement);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>'; // Çöp kutusu ikonu
        deleteBtn.onclick = () => deleteGalleryItem(item.id);
        itemDiv.appendChild(deleteBtn);

        galleryContent.appendChild(itemDiv);
    });
}

// Galeri öğesini siler
function deleteGalleryItem(id) {
    galleryItems = galleryItems.filter(item => item.id !== id);
    saveData('galleryItems', galleryItems); // Galeri öğelerini kaydet
    displayGallery(); // Galeriyi tekrar göster
    showMessageBox('Galeri öğesi silindi.');
}

// --- Yapılacaklar Listesi İşlevselliği ---
let todoList = loadData('todoList'); // Yapılacaklar listesini local storage'dan yükle

// Yeni yapılacaklar öğesi ekler
function addTodoItem() {
    const todoInput = document.getElementById('todoInput');
    const text = todoInput.value.trim();
    if (!text) {
        showMessageBox('Lütfen bir görev girin.');
        return;
    }
    const newItem = {
        id: Date.now(),
        text: text,
        completed: false // Tamamlanmadı olarak başlar
    };
    todoList.push(newItem);
    saveData('todoList', todoList); // Listeyi kaydet
    todoInput.value = ''; // Inputu temizle
    displayTodoList(); // Listeyi tekrar göster
    showMessageBox('Görev eklendi!');
}

// Yapılacaklar listesini gösterir
function displayTodoList() {
    const listElement = document.getElementById('todoList');
    listElement.innerHTML = '';
    if (todoList.length === 0) {
        listElement.innerHTML = '<p class="no-content">Henüz yapılacak bir görev yok.</p>';
        return;
    }
    todoList.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('list-item');
        if (item.completed) {
            itemDiv.classList.add('completed'); // Tamamlandıysa stil uygula
        }
        itemDiv.innerHTML = `
            <input type="checkbox" class="item-checkbox" ${item.completed ? 'checked' : ''} onchange="toggleTodoCompleted(${item.id})">
            <span class="item-text">${item.text}</span>
            <button class="delete-button" onclick="deleteTodoItem(${item.id})"><i class="fas fa-trash"></i></button>
        `;
        listElement.appendChild(itemDiv);
    });
}

// Yapılacaklar öğesinin tamamlanma durumunu değiştirir
function toggleTodoCompleted(id) {
    todoList = todoList.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveData('todoList', todoList); // Listeyi kaydet
    displayTodoList(); // Listeyi tekrar göster
}

// Yapılacaklar öğesini siler
function deleteTodoItem(id) {
    todoList = todoList.filter(item => item.id !== id);
    saveData('todoList', todoList); // Listeyi kaydet
    displayTodoList(); // Listeyi tekrar göster
    showMessageBox('Görev silindi.');
}

// --- İzlenecek Filmler İşlevselliği ---
let movieList = loadData('movieList'); // Film listesini local storage'dan yükle

// Yeni film ekler
function addMovieItem() {
    const movieInput = document.getElementById('movieInput');
    const text = movieInput.value.trim();
    if (!text) {
        showMessageBox('Lütfen bir film adı girin.');
        return;
    }
    const newItem = {
        id: Date.now(),
        text: text,
        watched: false // İzlenmedi olarak başlar
    };
    movieList.push(newItem);
    saveData('movieList', movieList); // Listeyi kaydet
    movieInput.value = ''; // Inputu temizle
    displayMovieList(); // Listeyi tekrar göster
    showMessageBox('Film eklendi!');
}

// Film listesini gösterir
function displayMovieList() {
    const listElement = document.getElementById('movieList');
    listElement.innerHTML = '';
    if (movieList.length === 0) {
        listElement.innerHTML = '<p class="no-content">Henüz izlenecek bir film yok.</p>';
        return;
    }
    movieList.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('list-item');
        if (item.watched) {
            itemDiv.classList.add('completed'); // İzlendiyse stil uygula
        }
        itemDiv.innerHTML = `
            <input type="checkbox" class="item-checkbox" ${item.watched ? 'checked' : ''} onchange="toggleMovieWatched(${item.id})">
            <span class="item-text">${item.text}</span>
            <button class="delete-button" onclick="deleteMovieItem(${item.id})"><i class="fas fa-trash"></i></button>
        `;
        listElement.appendChild(itemDiv);
    });
}

// Filmin izlenme durumunu değiştirir
function toggleMovieWatched(id) {
    movieList = movieList.map(item =>
        item.id === id ? { ...item, watched: !item.watched } : item
    );
    saveData('movieList', movieList); // Listeyi kaydet
    displayMovieList(); // Listeyi tekrar göster
}

// Filmi siler
function deleteMovieItem(id) {
    movieList = movieList.filter(item => item.id !== id);
    saveData('movieList', movieList); // Listeyi kaydet
    displayMovieList(); // Listeyi tekrar göster
    showMessageBox('Film silindi.');
}

// --- Özel Günler İşlevselliği ---
let specialDays = loadData('specialDays'); // Özel günleri local storage'dan yükle

// Yeni özel gün ekler
function addSpecialDay() {
    const nameInput = document.getElementById('specialDayNameInput');
    const dateInput = document.getElementById('specialDayDateInput');
    const name = nameInput.value.trim();
    const date = dateInput.value; // YYYY-MM-DD formatında

    if (!name || !date) {
        showMessageBox('Lütfen özel gün adı ve tarihini girin.');
        return;
    }

    const newItem = {
        id: Date.now(),
        name: name,
        date: date
    };
    specialDays.push(newItem);
    saveData('specialDays', specialDays); // Özel günleri kaydet
    nameInput.value = ''; // Inputları temizle
    dateInput.value = '';
    displaySpecialDays(); // Listeyi tekrar göster
    showMessageBox('Özel gün eklendi!');
}

// Özel günleri gösterir
function displaySpecialDays() {
    const listElement = document.getElementById('specialDaysList');
    listElement.innerHTML = '';
    if (specialDays.length === 0) {
        listElement.innerHTML = '<p class="no-content">Henüz özel bir gün eklenmedi.</p>';
        return;
    }
    // Tarihe göre sırala
    specialDays.sort((a, b) => new Date(a.date) - new Date(b.date));

    specialDays.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('list-item');
        const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        itemDiv.innerHTML = `
            <span class="item-text">${item.name} - ${formattedDate}</span>
            <button class="delete-button" onclick="deleteSpecialDay(${item.id})"><i class="fas fa-trash"></i></button>
        `;
        listElement.appendChild(itemDiv);
    });
}

// Özel günü siler
function deleteSpecialDay(id) {
    specialDays = specialDays.filter(item => item.id !== id);
    saveData('specialDays', specialDays); // Özel günleri kaydet
    displaySpecialDays(); // Listeyi tekrar göster
    showMessageBox('Özel gün silindi.');
}

// --- Hakkımızda İşlevselliği ---
// Hakkımızda bölümünü düzenlenebilir yapar
function editAboutContent() {
    const aboutContent = document.getElementById('aboutContent');
    const editBtn = document.querySelector('#about .button:nth-of-type(1)');
    const saveBtn = document.querySelector('#about .button:nth-of-type(2)');

    aboutContent.contentEditable = true; // İçeriği düzenlenebilir yap
    aboutContent.focus(); // Odaklan
    editBtn.style.display = 'none'; // Düzenle butonunu gizle
    saveBtn.style.display = 'inline-block'; // Kaydet butonunu göster
    showMessageBox('Hakkımızda bölümünü düzenleyebilirsiniz.');
}

// Hakkımızda bölümünü kaydeder
function saveAboutContent() {
    const aboutContent = document.getElementById('aboutContent');
    const editBtn = document.querySelector('#about .button:nth-of-type(1)');
    const saveBtn = document.querySelector('#about .button:nth-of-type(2)');

    aboutContent.contentEditable = false; // İçeriği düzenlenemez yap
    saveData('aboutContent', JSON.stringify(aboutContent.innerHTML)); // HTML içeriğini kaydet
    editBtn.style.display = 'inline-block'; // Düzenle butonunu göster
    saveBtn.style.display = 'none'; // Kaydet butonunu gizle
    showMessageBox('Hakkımızda bölümü kaydedildi.');
}

// Hakkımızda içeriğini yükler
function loadAboutContent() {
    const aboutContent = document.getElementById('aboutContent');
    const savedContent = localStorage.getItem('aboutContent');
    if (savedContent) {
        aboutContent.innerHTML = JSON.parse(savedContent); // Kaydedilmiş içeriği yükle
    }
}

// --- Sürpriz Anılar İşlevselliği ---
// Rastgele bir anıyı gösterir
function showRandomMemory() {
    const randomMemoryDisplay = document.getElementById('randomMemoryDisplay');
    randomMemoryDisplay.innerHTML = ''; // Önceki içeriği temizle

    if (memories.length === 0) {
        randomMemoryDisplay.innerHTML = '<p class="no-content">Henüz kaydedilmiş bir anı yok.</p>';
        return;
    }

    const randomIndex = Math.floor(Math.random() * memories.length); // Rastgele anı seç
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

// Tüm verileri yükleyen ve gösteren ana fonksiyon
// Sayfa yüklendiğinde tüm listeleri ve içerikleri günceller.
function loadAllData() {
    displayMoods();
    displayPoems();
    displayGallery();
    displayTodoList();
    displayMovieList();
    displaySpecialDays();
    loadAboutContent();
    // Ana sayfaya ilk girildiğinde bugünün anısını göster
    displayMemory(new Date().toISOString().split('T')[0]);
}
