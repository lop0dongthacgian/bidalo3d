const main_menu = document.getElementById('main-menu');
const how_to_play_panel = document.getElementById('how-to-play-panel');
const game_ui = document.getElementById('game-ui');
const player1_score_display = document.getElementById('player1-score');
const player2_score_display = document.getElementById('player2-score');
const message_display = document.getElementById('message-display');
const power_slider = document.getElementById('power-slider');
const hit_button = document.getElementById('hit-button');

export function showMainMenu() {
    main_menu.classList.remove('hidden');
    how_to_play_panel.classList.add('hidden');
    game_ui.classList.add('hidden');
}

export function showGameUI() {
    main_menu.classList.add('hidden');
    how_to_play_panel.classList.add('hidden');
    game_ui.classList.remove('hidden');
}

export function toggleHowToPlay(show) {
    if (show) {
        main_menu.classList.add('hidden');
        how_to_play_panel.classList.remove('hidden');
    } else {
        how_to_play_panel.classList.add('hidden');
        main_menu.classList.remove('hidden');
    }
}

export function updateScore(score1, score2) {
    player1_score_display.textContent = score1;
    player2_score_display.textContent = score2;
}

export function showMessage(msg) {
    message_display.textContent = msg;
}

export function updatePowerSlider(power) {
    // Có thể cập nhật một hiển thị số bên cạnh slider nếu muốn
    // Ví dụ: message_display.textContent = `Lực đánh: ${power}`;
}

export function showHitButton(visible) {
    hit_button.style.display = visible ? 'block' : 'none';
    power_slider.style.display = visible ? 'block' : 'none';
    document.getElementById('power-slider-container').style.display = visible ? 'flex' : 'none'; // Dùng flex cho container
}