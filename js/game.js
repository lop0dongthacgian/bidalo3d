import { resetPhysicsBalls, applyCueForce, isAnyBallMoving, CUE_BALL_INDEX, getAllBallBodies, repositionCueBall, removeBallFromPhysics } from './physics.js';
import { updateBallPositions, renderScene, TABLE_WIDTH, TABLE_LENGTH, BALL_RADIUS, hideCueLine } from './scene.js';
import { updateScore, showMessage, showGameUI, showMainMenu, showHitButton, toggleHowToPlay } from './ui.js';
import { updateCueDirectionLineDisplay } from './input.js';

let player1Score = 0;
let player2Score = 0;
let currentPlayer = 1; // 1 hoặc 2
let gameMode = null; // 'single' hoặc 'multi'
let canShoot = false; // Biến cờ cho phép đánh

let shotDirection = new THREE.Vector3(0, 0, 1); // Hướng đánh mặc định ban đầu
let cueBallPosition = new THREE.Vector3(); // Vị trí bi cái

let pottedBallsThisTurn = []; // Danh sách các bi đã vào lỗ trong lượt hiện tại

export function startGame(mode) {
    gameMode = mode;
    player1Score = 0;
    player2Score = 0;
    currentPlayer = 1;
    updateScore(player1Score, player2Score);
    resetTable(); // Đảm bảo bàn được reset và chuẩn bị cho lượt chơi mới
    showGameUI();
    showMessage(`Người chơi ${currentPlayer} đến lượt đánh!`);
}

export function resetTable() {
    resetPhysicsBalls();
    // Đảm bảo bi cái được đặt lại nếu nó không ở vị trí ban đầu
    repositionCueBall();
    canShoot = true;
    showHitButton(true);
    updateCueDirectionLineDisplay(); // Hiển thị lại đường hướng
    pottedBallsThisTurn = []; // Reset danh sách bi vào lỗ
    showMessage(`Người chơi ${currentPlayer} đến lượt đánh!`);
}

export function updateGame(deltaTime) {
    if (isAnyBallMoving()) {
        canShoot = false; // Không cho phép đánh khi bi đang di chuyển
        showHitButton(false); // Ẩn nút đánh
        hideCueLine(); // Ẩn đường hướng
        showMessage("Các bi đang di chuyển...");
    } else {
        if (!canShoot) { // Nếu các bi vừa dừng lại sau khi đánh
            canShoot = true;
            showHitButton(true); // Hiển thị nút đánh
            updateCueDirectionLineDisplay(); // Hiển thị lại đường hướng

            processPottedBalls(); // Xử lý các bi đã vào lỗ
            pottedBallsThisTurn = []; // Xóa danh sách bi đã vào lỗ cho lượt tiếp theo

            if (gameMode === 'multi') {
                // Logic đổi lượt (có thể phức tạp hơn tùy luật bida)
                // Đơn giản: nếu không có bi nào vào lỗ, hoặc bóng cái vào lỗ, đổi lượt.
                // Nếu bi mục tiêu vào lỗ, giữ nguyên lượt.
                // Cần bổ sung logic để kiểm tra bi nào là bi mục tiêu của người chơi
                // Tạm thời: nếu có bi vào lỗ (không phải bi cái), giữ lượt. Ngược lại, đổi lượt.
                if (pottedBallsThisTurn.length === 0 || pottedBallsThisTurn.includes(CUE_BALL_INDEX)) {
                    switchPlayer();
                    showMessage(`Người chơi ${currentPlayer} đến lượt đánh!`);
                } else {
                    showMessage(`Người chơi ${currentPlayer} tiếp tục đánh!`);
                }
            } else { // Chế độ luyện tập
                showMessage("Đến lượt bạn đánh!");
            }
            // Đảm bảo bi cái được đặt lại nếu nó đã vào lỗ
            const cueBallBody = getAllBallBodies()[CUE_BALL_INDEX];
            if (!cueBallBody || cueBallBody.position.y < -0.5) { // Nếu bi cái không tồn tại hoặc đã rơi quá sâu
                repositionCueBall();
            }
        }
        // Cập nhật vị trí bi cái để vẽ đường hướng
        const cueBallBody = getAllBallBodies()[CUE_BALL_INDEX];
        if (cueBallBody) {
            cueBallPosition.copy(cueBallBody.position);
        }
    }
}

// Xử lý sự kiện bi vào lỗ từ physics.js
document.addEventListener('ballPotted', (event) => {
    const ballId = event.detail.ballId;
    if (ballId !== undefined) {
        pottedBallsThisTurn.push(ballId);
        removeBallFromPhysics(ballId); // Xóa bi khỏi thế giới vật lý
    }
});


function processPottedBalls() {
    if (pottedBallsThisTurn.includes(CUE_BALL_INDEX)) { // Bi cái vào lỗ
        showMessage("Bóng cái vào lỗ! Phạm luật!");
        if (gameMode === 'multi') {
            switchPlayer(); // Đổi lượt
        }
        repositionCueBall(); // Luôn đặt lại bi cái
        return;
    }

    if (pottedBallsThisTurn.length > 0) {
        let scoreIncrease = 0;
        pottedBallsThisTurn.forEach(ballId => {
            if (ballId !== CUE_BALL_INDEX) {
                scoreIncrease += 1; // Mỗi bi mục tiêu vào lỗ được 1 điểm
            }
        });
        if (currentPlayer === 1) {
            player1Score += scoreIncrease;
        } else {
            player2Score += scoreIncrease;
        }
        updateScore(player1Score, player2Score);
    }
}

function switchPlayer() {
    currentPlayer = (currentPlayer === 1) ? 2 : 1;
}

export function setShotDirection(direction) {
    shotDirection.copy(direction);
}

export function getCueBallPosition() {
    const cueBallBody = getAllBallBodies()[CUE_BALL_INDEX];
    return cueBallBody ? cueBallBody.position : null;
}

export function gameCanShoot() {
    return canShoot;
}

// Liên kết các nút UI
document.getElementById('start-1-player').addEventListener('click', () => startGame('single'));
document.getElementById('start-2-players').addEventListener('click', () => startGame('multi'));
document.getElementById('reset-button').addEventListener('click', resetTable);
document.getElementById('main-menu-button').addEventListener('click', () => {
    showMainMenu();
    hideCueLine(); // Ẩn đường hướng khi về menu
});
document.getElementById('how-to-play-button').addEventListener('click', () => toggleHowToPlay(true));
document.getElementById('back-to-menu-button').addEventListener('click', () => toggleHowToPlay(false));

document.addEventListener('resetGame', resetTable); // Lắng nghe sự kiện reset từ input.js