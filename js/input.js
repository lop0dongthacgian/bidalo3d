import * as THREE from 'three';
import { camera, TABLE_WIDTH, TABLE_LENGTH, BALL_RADIUS } from './scene.js';
import { applyCueForce } from './physics.js';
import { getCueBallPosition, setShotDirection, gameCanShoot } from './game.js';
import { updatePowerSlider, showHitButton, showMessage } from './ui.js';
import { updateCueLine, hideCueLine } from './scene.js'; // Import hàm mới

let isDragging = false;
let startMouseX;
let currentRotationY = 0; // Góc xoay hiện tại của hướng đánh
let power = 50; // Lực đánh ban đầu (0-100)

// Không dùng Raycaster và Plane ở đây nữa, vì đã có OrbitControls và logic game điều khiển hướng đánh

export function setupInputListeners(canvas) {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    document.getElementById('power-slider').addEventListener('input', (event) => {
        power = parseFloat(event.target.value); // Lấy giá trị số
        updatePowerSlider(power);
        updateCueDirectionLineDisplay(); // Cập nhật đường hướng khi thay đổi lực
    });
    document.getElementById('hit-button').addEventListener('click', onHitButtonClick);

    document.addEventListener('keydown', onKeyDown);
}

function onMouseDown(event) {
    // Chỉ xử lý nếu game đang ở trạng thái cho phép đánh
    if (!gameCanShoot()) return;

    if (event.button === 0) { // Chuột trái
        isDragging = true;
        startMouseX = event.clientX;
        document.body.style.cursor = 'grabbing';
    }
}

function onMouseMove(event) {
    if (!isDragging || !gameCanShoot()) return;

    const deltaX = event.clientX - startMouseX;

    const rotationSpeed = 0.005; // Độ nhạy xoay
    currentRotationY += deltaX * rotationSpeed;
    startMouseX = event.clientX;

    // Cập nhật hướng đánh và hiển thị đường hướng
    updateCueDirectionLineDisplay();
}

function onMouseUp() {
    isDragging = false;
    document.body.style.cursor = 'default';
}

function onTouchStart(event) {
    if (!gameCanShoot()) return;

    if (event.touches.length === 1) {
        isDragging = true;
        startMouseX = event.touches[0].clientX;
        event.preventDefault(); // Ngăn cuộn trang
    }
}

function onTouchMove(event) {
    if (!isDragging || event.touches.length !== 1 || !gameCanShoot()) return;

    const deltaX = event.touches[0].clientX - startMouseX;
    const rotationSpeed = 0.008;
    currentRotationY += deltaX * rotationSpeed;
    startMouseX = event.touches[0].clientX;

    updateCueDirectionLineDisplay();
    event.preventDefault();
}

function onTouchEnd() {
    isDragging = false;
}

function onHitButtonClick() {
    if (!gameCanShoot()) {
        showMessage("Các bi đang di chuyển hoặc chưa đến lượt!");
        return;
    }
    const direction = new THREE.Vector3(Math.sin(currentRotationY), 0, Math.cos(currentRotationY)).normalize();
    applyCueForce(direction, power * 0.05); // Điều chỉnh hệ số lực
    hideCueLine(); // Ẩn đường hướng sau khi đánh
    showHitButton(false); // Ẩn nút đánh sau khi đánh
    document.dispatchEvent(new CustomEvent('shotTaken')); // Gửi sự kiện đã đánh
}

function onKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
        document.dispatchEvent(new CustomEvent('resetGame'));
    }
}

// Hàm để cập nhật hiển thị đường hướng đánh
export function updateCueDirectionLineDisplay() {
    const cueBallPosition = getCueBallPosition();
    if (!cueBallPosition) {
        hideCueLine();
        return;
    }

    const directionVector = new THREE.Vector3(Math.sin(currentRotationY), 0, Math.cos(currentRotationY)).normalize();
    setShotDirection(directionVector); // Cập nhật hướng đánh trong game.js

    const lineLength = power * 0.05 + BALL_RADIUS * 2; // Độ dài đường hướng phụ thuộc vào lực đánh
    const endPoint = new THREE.Vector3().addVectors(cueBallPosition, directionVector.multiplyScalar(lineLength));

    // Đảm bảo đường hướng không nằm dưới mặt bàn
    startPoint.y = BALL_RADIUS;
    endPoint.y = BALL_RADIUS;

    updateCueLine(cueBallPosition, endPoint);
}