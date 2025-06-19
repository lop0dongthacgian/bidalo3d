import { initScene, renderScene, updateBallPositions, scene, camera, renderer, controls } from './scene.js';
import { initPhysics, updatePhysics, getAllBallBodies } from './physics.js';
import { setupInputListeners } from './input.js';
import { updateGame } from './game.js';
import { showMainMenu } from './ui.js';

let lastTime = 0;

function animate(currentTime) {
    requestAnimationFrame(animate);

    const deltaTime = (currentTime - lastTime) / 1000; // Chuyển đổi ms sang giây
    lastTime = currentTime;

    updatePhysics(deltaTime); // Cập nhật vật lý
    updateBallPositions(getAllBallBodies()); // Cập nhật vị trí các Mesh 3D
    updateGame(deltaTime); // Cập nhật logic game (biết bi vào lỗ qua sự kiện)
    renderScene(); // Render cảnh Three.js
}

// Khởi tạo tất cả
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    initScene(canvas);
    initPhysics();
    setupInputListeners(canvas);
    showMainMenu(); // Hiển thị menu chính khi tải trang
    animate(0); // Bắt đầu vòng lặp game
});