// 音頻播放器初始化
const audioPlayers = [new Audio(), new Audio()];
const audioContexts = [null, null];
const filters = [null, null];
const gainNodes = [null, null];
const pauseSound = new Audio('/static/sounds/output_audio (mp3cut.net).mp3');
const loopStates = [
    { active: false, beatValue: 1, loopStart: 0, loopEnd: 0, intervalId: null },
    { active: false, beatValue: 1, loopStart: 0, loopEnd: 0, intervalId: null }
];
let uploadedFiles = [null, null];
const BPM = 120; // Default BPM
const BEAT_LENGTH = 60 / BPM; // Length of one beat in seconds

// 鍵盤控制播放速度
document.addEventListener('keydown', function(event) {
    // 確保不是在輸入框中按下按鍵
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    // 獲取按下的數字（1-9）
    const num = parseInt(event.key);
    if (num >= 1 && num <= 9) {
        // 觸發對應的效果音按鈕
        const button = document.getElementById(`effectButton${num}`);
        if (button) {
            button.click();
            // 添加按鈕按下的視覺效果
            button.classList.add('active');
            setTimeout(() => {
                button.classList.remove('active');
            }, 200);
        }
    }
    // 鍵盤控制播放速度
    const player = audioPlayers[1]; // 控制第二個播放器
    let currentSpeed = player.playbackRate;
    
    if (event.key.toLowerCase() === 'a') {
        // 按A鍵減速
        currentSpeed = Math.max(0.5, currentSpeed - 0.2);
        player.playbackRate = currentSpeed;
        document.getElementById('speedControl2').value = currentSpeed;
    } else if (event.key.toLowerCase() === 'd') {
        // 按D鍵加速
        currentSpeed = Math.min(2.0, currentSpeed + 0.2);
        player.playbackRate = currentSpeed;
        document.getElementById('speedControl2').value = currentSpeed;
    }
});

// 初始化音頻上下文
function initializeAudioContext(playerIndex) {
    if (!audioContexts[playerIndex]) {
        audioContexts[playerIndex] = new (window.AudioContext || window.webkitAudioContext)();
        filters[playerIndex] = audioContexts[playerIndex].createBiquadFilter();
        filters[playerIndex].type = "lowpass";
        filters[playerIndex].frequency.value = 500;
        gainNodes[playerIndex] = audioContexts[playerIndex].createGain();
        gainNodes[playerIndex].gain.value = 1.0;

        const context = audioContexts[playerIndex];
        const source = context.createMediaElementSource(audioPlayers[playerIndex]);
        source.connect(filters[playerIndex]);
        filters[playerIndex].connect(gainNodes[playerIndex]);
        gainNodes[playerIndex].connect(context.destination);
    }
}

// 循環控制功能
function startLoop(playerIndex) {
    const player = audioPlayers[playerIndex];
    const state = loopStates[playerIndex];

    if (!state.active || !player.duration) return;

    if (state.intervalId) {
        clearInterval(state.intervalId);
    }

    const loopDuration = state.beatValue * BEAT_LENGTH;
    state.loopStart = player.currentTime;
    state.loopEnd = state.loopStart + loopDuration;

    state.intervalId = setInterval(() => {
        if (player.currentTime >= state.loopEnd) {
            player.currentTime = state.loopStart;
        }
    }, 10);
}

function stopLoop(playerIndex) {
    const state = loopStates[playerIndex];
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

function toggleLoop(playerIndex) {
    const state = loopStates[playerIndex];
    state.active = !state.active;

    const loopDisplay = document.querySelector(`#loopDisplay${playerIndex + 1}`);
    if (state.active) {
        loopDisplay.classList.add('active');
        startLoop(playerIndex);
    } else {
        loopDisplay.classList.remove('active');
        stopLoop(playerIndex);
    }
}

function adjustLoopBeat(playerIndex, direction) {
    const state = loopStates[playerIndex];
    const beatDisplay = document.querySelector(`#loopDisplay${playerIndex + 1} .beat-value`);
    const beatValues = [0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32];
    const currentIndex = beatValues.indexOf(state.beatValue);

    let newIndex;
    if (direction === 'up' && currentIndex < beatValues.length - 1) {
        newIndex = currentIndex + 1;
    } else if (direction === 'down' && currentIndex > 0) {
        newIndex = currentIndex - 1;
    } else {
        return;
    }

    state.beatValue = beatValues[newIndex];
    if (state.beatValue < 1) {
        beatDisplay.textContent = `1/${1 / state.beatValue}`;
    } else {
        beatDisplay.textContent = state.beatValue;
    }

    if (state.active) {
        stopLoop(playerIndex);
        startLoop(playerIndex);
    }
}

// 音樂播放控制功能
function playMusic(playerIndex, filename) {
    const player = audioPlayers[playerIndex];
    const disk = document.querySelector(`#djDisk${playerIndex + 1}`);

    initializeAudioContext(playerIndex);

    if (filename) {
        player.src = filename;
        uploadedFiles[playerIndex] = filename;
    } else if (uploadedFiles[playerIndex]) {
        player.src = uploadedFiles[playerIndex];
    }

    player.play().then(() => {
        disk.classList.add('playing');
        document.querySelector(`#div_glow${playerIndex === 0 ? '' : '3'}`).classList.add('glow_effect');
        updateDiskRotation(playerIndex);
    }).catch(error => {
        console.error('Error playing music:', error);
    });
}

function pauseMusic(playerIndex) {
    const player = audioPlayers[playerIndex];
    const disk = document.querySelector(`#djDisk${playerIndex + 1}`);

    player.pause();
    disk.classList.remove('playing');
    document.querySelector(`#div_glow${playerIndex === 0 ? '' : '3'}`).classList.remove('glow_effect');
    playPauseSound();
}

function resumeMusic(playerIndex) {
    const player = audioPlayers[playerIndex];
    const disk = document.querySelector(`#djDisk${playerIndex + 1}`);

    if (player.src) {
        player.play().then(() => {
            disk.classList.add('playing');
            document.querySelector(`#div_glow${playerIndex === 0 ? '' : '3'}`).classList.add('glow_effect');
            updateDiskRotation(playerIndex);
        }).catch(error => {
            console.error('Error resuming music:', error);
        });
    } else {
        console.log('No music loaded');
    }
}

function playPauseSound() {
    const soundClone = pauseSound.cloneNode();
    soundClone.volume = 0.5;
    soundClone.play().catch(error => {
        console.error('Error playing pause sound:', error);
    });
}

// 音效控制功能
function adjustFilter(playerIndex, value) {
    if (filters[playerIndex]) {
        // 使用指數映射來獲得更好的頻率控制
        // value 範圍是 0-2000，映射到 20-20000Hz
        const minFreq = 20;
        const maxFreq = 20000;
        const normalizedValue = value / 2000; // 將值標準化到 0-1 範圍
        const frequency = minFreq * Math.pow(maxFreq/minFreq, normalizedValue);
        filters[playerIndex].frequency.value = frequency;
    }
}

function adjustVolume(playerIndex, value) {
    gainNodes[playerIndex].gain.value = value / 100;
}

function adjustPlaybackSpeed(playerIndex, value) {
    const player = audioPlayers[playerIndex];
    player.playbackRate = value;
}

// 文件處理功能
function handleFileSelection(event, playerIndex) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        // 上傳文件
        fetch('/', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // 上傳成功後重新加載頁面以更新播放清單
                window.location.reload();
            } else {
                console.error('Upload failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

function uploadMusic(playerIndex) {
    document.getElementById(`fileInput${playerIndex}`).click();
}

// 效果音播放功能
function playEffect(effectFile) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const effect = new Audio(`/static/effects/${effectFile}`);
    effect.volume = 1.0;  // 設置基礎音量為最大

    // 創建音頻源和增益節點
    const source = audioContext.createMediaElementSource(effect);
    const gainNode = audioContext.createGain();
    
    // 設置增益值（4.0 表示四倍音量）
    gainNode.gain.value = 4.0;
    
    // 連接音頻節點
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    effect.play().catch(error => {
        console.error('Error playing effect:', error);
    });
}

function playCustomEffect(index) {
    if (customEffects[index]) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const effect = new Audio(customEffects[index]);
        effect.volume = 1.0;

        // 創建音頻源和增益節點
        const source = audioContext.createMediaElementSource(effect);
        const gainNode = audioContext.createGain();
        
        // 設置增益值（4.0 表示四倍音量）
        gainNode.gain.value = 4.0;
        
        // 連接音頻節點
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        effect.play().catch(error => {
            console.error(`Error playing custom effect ${index + 1}:`, error);
        });
    } else {
        console.log(`自訂音效 ${index + 1} 尚未設定`);
    }
}

// 背景影片設置
const backgroundVideos = {
    1: '/static/videos/background1.mp4',
    2: '/static/videos/background2.mp4',
    3: '/static/videos/oiiaoiia-cat-fein.mp4'
};

function changeBackground(videoNumber) {
    const video = document.getElementById('bgVideo');
    const source = video.querySelector('source');
    source.src = backgroundVideos[videoNumber];
    video.load();
    video.play();
}

// 進度條更新功能
function updateProgress(playerIndex) {
    const player = audioPlayers[playerIndex];
    const progressBar = document.querySelector(`#progressBar${playerIndex + 1}`);
    const timeDisplay = document.querySelector(`#player${playerIndex + 1} .time-display`);

    function update() {
        if (player.duration && !isDragging[playerIndex]) {
            const progress = (player.currentTime / player.duration) * 100;
            progressBar.value = progress;

            if (player.currentTime >= player.duration) {
                player.currentTime = 0;
                progressBar.value = 0;
            }

            const currentTime = formatTime(player.currentTime);
            const totalTime = formatTime(player.duration);
            if (timeDisplay) {
                timeDisplay.textContent = `${currentTime} / ${totalTime}`;
            }
        }
        requestAnimationFrame(update);
    }

    update();

    progressBar.addEventListener('input', (event) => {
        const value = event.target.value;
        if (player.duration) {
            const time = (value / 100) * player.duration;
            if (time >= player.duration) {
                player.currentTime = 0;
                progressBar.value = 0;
            } else {
                player.currentTime = time;
            }
        }
    });
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 唱片拖動控制
let isDragging = [false, false];
let startAngle = [0, 0];
let currentRotation = [0, 0];
let rotationFrameId = [null, null];

function handleDiskMouseDown(event, playerIndex) {
    event.preventDefault();
    isDragging[playerIndex] = true;
    const disk = document.querySelector(`#djDisk${playerIndex + 1}`);
    disk.classList.add('dragging');

    const rect = disk.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    startAngle[playerIndex] = Math.atan2(
        event.clientY - centerY,
        event.clientX - centerX
    );

    document.addEventListener('mousemove', (e) => handleDiskMouseMove(e, playerIndex));
    document.addEventListener('mouseup', () => handleDiskMouseUp(playerIndex));
}

function handleDiskMouseMove(event, playerIndex) {
    if (!isDragging[playerIndex]) return;

    const disk = document.querySelector(`#djDisk${playerIndex + 1} img`);
    const progressBar = document.querySelector(`#progressBar${playerIndex + 1}`);
    const player = audioPlayers[playerIndex];
    const rect = disk.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = Math.atan2(
        event.clientY - centerY,
        event.clientX - centerX
    );

    const angleDiff = currentAngle - startAngle[playerIndex];
    currentRotation[playerIndex] += (angleDiff * 180 / Math.PI);
    disk.style.transform = `translate(-50%, -50%) rotate(${currentRotation[playerIndex]}deg)`;

    startAngle[playerIndex] = currentAngle;

    if (player.duration) {
        const normalizedRotation = ((currentRotation[playerIndex] % 360 + 360) % 360);
        const newTime = (normalizedRotation / 360) * player.duration;
        const progress = (newTime / player.duration) * 100;
        progressBar.value = progress;
        player.currentTime = newTime;
    }

    if (player.playbackRate) {
        const speed = 1 + (Math.abs(angleDiff) * 2);
        player.playbackRate = Math.min(Math.max(speed, 0.5), 2);
    }
}

function handleDiskMouseUp(playerIndex) {
    isDragging[playerIndex] = false;
    const disk = document.querySelector(`#djDisk${playerIndex + 1}`);
    disk.classList.remove('dragging');

    if (player.playbackRate) {
        player.playbackRate = 1;
    }

    document.removeEventListener('mousemove', (e) => handleDiskMouseMove(e, playerIndex));
    document.removeEventListener('mouseup', () => handleDiskMouseUp(playerIndex));
}

function updateDiskRotation(playerIndex) {
    if (rotationFrameId[playerIndex]) {
        cancelAnimationFrame(rotationFrameId[playerIndex]);
    }

    const rotationSpeed = 2;

    function animate() {
        const disk = document.querySelector(`#djDisk${playerIndex + 1} img`);
        const player = audioPlayers[playerIndex];

        if (!isDragging[playerIndex] && !player.paused) {
            currentRotation[playerIndex] = (currentRotation[playerIndex] + rotationSpeed) % 360;
            disk.style.transform = `translate(-50%, -50%) rotate(${currentRotation[playerIndex]}deg)`;
        }

        rotationFrameId[playerIndex] = requestAnimationFrame(animate);
    }

    animate();
}

// 用於儲存自訂音效的 URL
const customEffects = [null, null, null, null];

// 設定自訂音效檔案
function handleCustomEffectFile(event, index) {
    const file = event.target.files[0];
    if (file) {
        customEffects[index] = URL.createObjectURL(file);
    }
}

// 播放自訂音效
function playCustomEffect(index) {
    if (customEffects[index]) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const effect = new Audio(customEffects[index]);
        effect.volume = 1.0;

        // 創建音頻源和增益節點
        const source = audioContext.createMediaElementSource(effect);
        const gainNode = audioContext.createGain();
        
        // 設置增益值（4.0 表示四倍音量）
        gainNode.gain.value = 4.0;
        
        // 連接音頻節點
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        effect.play().catch(error => {
            console.error(`Error playing custom effect ${index + 1}:`, error);
        });
    } else {
        console.log(`自訂音效 ${index + 1} 尚未設定`);
    }
}

// 效果音背景搭配
function changBG(btnName) {
    const GlowBtn=document.getElementById(btnName);
    const div1=document.getElementById('div_glow');
    const div2=document.getElementById('div_glow2');
    const div3=document.getElementById('div_glow3');

    div1.classList.add("no_glow");
    div2.classList.add("no_glow");
    div3.classList.add("no_glow");

    const glowColors = [
        "0 0 30px 10px #FF5733, 0 0 60px 20px #FFBD33, 0 0 90px 30px #FFC300",
        "0 0 30px 10px #33FF57, 0 0 60px 20px #57FF33, 0 0 90px 30px #85FF33",
        "0 0 30px 10px #3357FF, 0 0 60px 20px #33A1FF, 0 0 90px 30px #339FFF",
        "0 0 30px 10px #FF33A1, 0 0 60px 20px #FF57D1, 0 0 90px 30px #FF85E1",
        "0 0 30px 10px #9400D3, 0 0 60px 20px #8A2BE2, 0 0 90px 30px #4B0082", 
        "0 0 30px 10px #FFD700, 0 0 60px 20px #FFA500, 0 0 90px 30px #FF4500", 
        "0 0 30px 10px #40E0D0, 0 0 60px 20px #00CED1, 0 0 90px 30px #20B2AA", 
        "0 0 30px 10px #DC143C, 0 0 60px 20px #FF6347, 0 0 90px 30px #FF7F50"
    ];

    let isGlowActive = false;

    GlowBtn.addEventListener("click",()=>{
        if(isGlowActive) {
            div1.classList.remove("glow_effect");
            div1.classList.add("no_glow");
            div2.classList.remove("glow_effect");
            div2.classList.add("no_glow");
            div3.classList.remove("glow_effect");
            div3.classList.add("no_glow");
        }
        else {
            const randomGlow = glowColors[Math.floor(Math.random()*glowColors.length)];
            div1.classList.add("glow_effect");
            div1.classList.remove("no_glow");
            div1.style.boxShadow=randomGlow;
            div2.classList.add("glow_effect");
            div2.classList.remove("no_glow");
            div2.style.boxShadow=randomGlow;
            div3.classList.add("glow_effect");
            div3.classList.remove("no_glow");
            div3.style.boxShadow=randomGlow;
        }

        isGlowActive=!isDragging;

    });
}

// DOM 加載完成後初始化所有事件監聽器
document.addEventListener('DOMContentLoaded', function () {
    updateProgress(0);
    updateProgress(1);
    changeBackground(1); // 預設播放第一個背景

    document.getElementById('playButton1').addEventListener('click', () => {
        playMusic(0, document.getElementById('musicSelect1').value);
    });
    document.getElementById('pauseButton1').addEventListener('click', () => pauseMusic(0));
    document.getElementById('resumeButton1').addEventListener('click', () => resumeMusic(0));
    document.getElementById('filterControl1').addEventListener('input', (e) => adjustFilter(0, e.target.value));
    document.getElementById('volumeControl1').addEventListener('input', (e) => adjustVolume(0, e.target.value));
    document.getElementById('fileInput1').addEventListener('change', (e) => handleFileSelection(e, 0));
    document.getElementById('uploadButton1').addEventListener('click', () => uploadMusic(0));
    document.getElementById('djDisk1').addEventListener('mousedown', (e) => handleDiskMouseDown(e, 0));
    document.getElementById('loopDisplay1').addEventListener('click', () => toggleLoop(0));
    document.getElementById('loopDownButton1').addEventListener('click', () => adjustLoopBeat(0, 'down'));
    document.getElementById('loopUpButton1').addEventListener('click', () => adjustLoopBeat(0, 'up'));
    document.getElementById('speedControl1').addEventListener('input', (e) => adjustPlaybackSpeed(0, e.target.value));

    document.getElementById('playButton2').addEventListener('click', () => {
        playMusic(1, document.getElementById('musicSelect2').value);
    });
    document.getElementById('pauseButton2').addEventListener('click', () => pauseMusic(1));
    document.getElementById('resumeButton2').addEventListener('click', () => resumeMusic(1));
    document.getElementById('filterControl2').addEventListener('input', (e) => adjustFilter(1, e.target.value));
    document.getElementById('volumeControl2').addEventListener('input', (e) => adjustVolume(1, e.target.value));
    document.getElementById('fileInput2').addEventListener('change', (e) => handleFileSelection(e, 1));
    document.getElementById('uploadButton2').addEventListener('click', () => uploadMusic(1));
    document.getElementById('djDisk2').addEventListener('mousedown', (e) => handleDiskMouseDown(e, 1));
    document.getElementById('loopDisplay2').addEventListener('click', () => toggleLoop(1));
    document.getElementById('loopDownButton2').addEventListener('click', () => adjustLoopBeat(1, 'down'));
    document.getElementById('loopUpButton2').addEventListener('click', () => adjustLoopBeat(1, 'up'));
    document.getElementById('speedControl2').addEventListener('input', (e) => adjustPlaybackSpeed(1, e.target.value));

    document.getElementById('effectButton1').addEventListener('click', () => playEffect('fcatu.mp3'), changBG('effectButton1'));
    document.getElementById('effectButton2').addEventListener('click', () => playEffect('fcatun.mp3'), changBG('effectButton2'));
    document.getElementById('effectButton3').addEventListener('click', () => playEffect('fcatii.mp3'), changBG('effectButton3'));
    document.getElementById('effectButton4').addEventListener('click', () => playEffect('喇叭.mp3'), changBG('effectButton4'));
    document.getElementById('effectButton5').addEventListener('click', () => playEffect('動.mp3'), changBG('effectButton5'));
    document.getElementById('effectButton6').addEventListener('click', () => playEffect('動搭搭.mp3'), changBG('effectButton6'));
    document.getElementById('effectButton7').addEventListener('click', () => playEffect('吧.mp3'), changBG('effectButton7'));
    document.getElementById('effectButton8').addEventListener('click', () => playEffect('哇哇哇哇哇.mp3'), changBG('effectButton8'));
    document.getElementById('effectButton9').addEventListener('click', () => playEffect('機器人說話.mp3'), changBG('effectButton9'));
    document.getElementById('effectButton10').addEventListener('click', () => playEffect('catii.mp3'), changBG('effectButton10'));
    document.getElementById('effectButton11').addEventListener('click', () => playEffect('catii.mp3'), changBG('effectButton11'));
    document.getElementById('effectButton12').addEventListener('click', () => playEffect('catii.mp3'), changBG('effectButton12'));

    // 為效果音按鈕添加滑鼠懸浮事件
    const effectButtons = document.querySelectorAll('.effect-container button');
    effectButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            // 生成隨機顏色
            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
            this.style.backgroundColor = randomColor;
        });
        
        button.addEventListener('mouseleave', function() {
            // 恢復原始顏色
            this.style.backgroundColor = '#2e2e2e';
        });
    });
});
