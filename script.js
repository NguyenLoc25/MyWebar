// DOM Elements
const errorDiv = document.getElementById('error');
const modeIndicator = document.getElementById('modeIndicator');
const speedDisplay = document.getElementById('speedDisplay');
const menuToggle = document.getElementById('menuToggle');
const controlMenu = document.getElementById('controlMenu');
const speedUpBtn = document.getElementById('speedUp');
const speedDownBtn = document.getElementById('speedDown');
const stopStartBtn = document.getElementById('stopStart');
const toggleModeBtn = document.getElementById('toggleMode');
const video = document.querySelector('#videoTexture');
const videoEntity = document.querySelector('#videoEntity');
const arContent = document.querySelector('#arContent');
const motorContent = document.querySelector('#motorContent');
const markerCamera = document.querySelector('#markerCamera');
const camera3d = document.querySelector('#camera3d');
const blades = document.querySelector('#blades');
    
// Application State
let is3DMode = false;
let isMotorRunning = true;
let markerFound = false;
let bladeAnimationDuration = 2000; // 2 seconds per rotation (default speed)
let isMotorStopped = false;
let videoPlaybackRate = 1.0;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  if (!video) {
    showError('Video element not found');
    return;
  }

  // Đảm bảo video không tự động phát
  video.pause();
  
  // Hide everything initially
  arContent.setAttribute('visible', 'false');
  motorContent.setAttribute('visible', 'false');
  
  // Setup buttons
  menuToggle.addEventListener('click', toggleMenu);
  speedUpBtn.addEventListener('click', increaseVideoSpeed);
  speedDownBtn.addEventListener('click', decreaseVideoSpeed);
  stopStartBtn.addEventListener('click', toggleVideoState);
  toggleModeBtn.addEventListener('click', toggleViewMode);
  
  // Close menu when clicking outside (but not on menu items)
  document.addEventListener('click', (e) => {
    if (!controlMenu.contains(e.target) && e.target !== menuToggle) {
      controlMenu.classList.remove('show');
    }
  });
  
  // Initialize blade animation for 3D mode
  resetBladeAnimation();
  updateSpeedDisplay();
  
  // Listen for marker events
  markerCamera.addEventListener('markerFound', () => {
    console.log('Marker found!');
    markerFound = true;
    if (!is3DMode) {
      video.play().catch(e => showError('Video play error: ' + e.message));
      arContent.setAttribute('visible', 'true');
    }
  });

  markerCamera.addEventListener('markerLost', () => {
    console.log('Marker lost!');
    markerFound = false;
    if (!is3DMode) {
      video.pause();
      arContent.setAttribute('visible', 'false');
    }
  });

  markerCamera.addEventListener('error', (e) => {
    showError('Marker error: ' + e.detail.message);
  });

  video.onerror = () => {
    showError('Video load error. Check path: ./asset/Hydro_v2.mp4');
  };
});

function toggleMenu() {
  controlMenu.classList.toggle('show');
}

function resetBladeAnimation() {
  const currentRotation = blades.getAttribute('rotation') || {x: 0, y: 0, z: 0};
  blades.setAttribute('animation', {
    property: 'rotation',
    from: `${currentRotation.x} ${currentRotation.y} ${currentRotation.z}`,
    to: `${currentRotation.x} ${currentRotation.y + 360} ${currentRotation.z}`,
    loop: true,
    dur: bladeAnimationDuration,
    easing: 'linear',
    enabled: isMotorRunning && !isMotorStopped
  });
}

function updateSpeedDisplay() {
  speedDisplay.textContent = `Tốc độ: ${videoPlaybackRate.toFixed(1)}x`;
}

function increaseVideoSpeed() {
  videoPlaybackRate = Math.min(2.0, videoPlaybackRate + 0.2);
  video.playbackRate = videoPlaybackRate;
  updateSpeedDisplay();
  
  // For 3D mode, increase blade speed
  bladeAnimationDuration = Math.max(500, bladeAnimationDuration - 400);
  resetBladeAnimation();
}

function decreaseVideoSpeed() {
  videoPlaybackRate = Math.max(0.2, videoPlaybackRate - 0.2);
  video.playbackRate = videoPlaybackRate;
  updateSpeedDisplay();
  
  // For 3D mode, decrease blade speed
  bladeAnimationDuration = Math.min(5000, bladeAnimationDuration + 400);
  resetBladeAnimation();
}

function toggleVideoState() {
  if (video.paused) {
    video.play().catch(e => showError('Video play error: ' + e.message));
    stopStartBtn.innerHTML = '<span class="menu-icon">⏸</span> Dừng';
    isMotorStopped = false;
  } else {
    video.pause();
    stopStartBtn.innerHTML = '<span class="menu-icon">▶</span> Khởi động';
    isMotorStopped = true;
  }
  
  // For 3D mode
  if (is3DMode) {
    if (isMotorStopped) {
      blades.setAttribute('animation', 'enabled', 'false');
    } else {
      resetBladeAnimation();
    }
  }
}

function toggleViewMode() {
  is3DMode = !is3DMode;
  
  if (is3DMode) {
    // Switch to 3D view
    modeIndicator.textContent = "3D Mode";
    toggleModeBtn.innerHTML = '<span class="menu-icon">📱</span> Chế độ AR';
    arContent.setAttribute('visible', 'false');
    motorContent.setAttribute('visible', 'true');
    markerCamera.setAttribute('arjs-marker-camera', 'enabled', false);
    camera3d.setAttribute('camera', 'active', true);
    
    // Pause video when switching to 3D mode
    video.pause();
    
    if (!isMotorStopped) {
      resetBladeAnimation();
    }
  } else {
    // Switch back to AR view
    modeIndicator.textContent = "AR Mode";
    toggleModeBtn.innerHTML = '<span class="menu-icon">🖥️</span> Chế độ 3D';
    motorContent.setAttribute('visible', 'false');
    markerCamera.setAttribute('arjs-marker-camera', 'enabled', true);
    camera3d.setAttribute('camera', 'active', false);
    
    if (markerFound && !isMotorStopped) {
      arContent.setAttribute('visible', 'true');
      video.play().catch(e => showError('Video play error: ' + e.message));
    }
  }
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  console.error(message);
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}