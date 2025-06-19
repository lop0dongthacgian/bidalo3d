import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Cập nhật import OrbitControls

const TABLE_WIDTH = 2; // Chiều rộng bàn (theo đơn vị Three.js)
const TABLE_LENGTH = 4; // Chiều dài bàn
const HOLE_RADIUS = 0.08; // Giảm kích thước lỗ một chút để khó hơn
const BALL_RADIUS = 0.028; // Kích thước bi bida chuẩn

let scene, camera, renderer, controls;
let balls = []; // Mảng chứa các Mesh của bi
let tableMesh;
let cueLine; // Đường hiển thị hướng đánh

export function initScene(canvas) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333); // Nền xám

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100); // Far clip nhỏ lại
    camera.position.set(0, 3.5, 2.5); // Vị trí camera ban đầu
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Bật đổ bóng
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Đổ bóng mềm hơn

    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Cho chuyển động mượt mà hơn
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Không cho camera đi xuống dưới mặt bàn
    controls.minDistance = 1; // Giới hạn zoom in
    controls.maxDistance = 10; // Giới hạn zoom out

    // Ánh sáng
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Ánh sáng môi trường
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Ánh sáng định hướng
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Tăng độ phân giải bóng
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    scene.add(directionalLight);

    // Tạo bàn bida
    createBilliardsTable();
    // Tạo các bi bida
    createBalls();
    // Tạo đường hướng đánh
    createCueLine();

    window.addEventListener('resize', onWindowResize, false);
}

function createBilliardsTable() {
    // Mặt bàn
    const tableGeometry = new THREE.BoxGeometry(TABLE_WIDTH + 0.1, 0.1, TABLE_LENGTH + 0.1); // Thêm một chút kích thước
    const tableMaterial = new THREE.MeshPhongMaterial({ color: 0x006400, shininess: 50 }); // Màu xanh đậm
    tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
    tableMesh.receiveShadow = true; // Nhận bóng
    tableMesh.position.y = -0.05; // Đặt thấp hơn 0 một chút
    scene.add(tableMesh);

    // Băng (cushions)
    const cushionMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513, shininess: 30 }); // Màu nâu gỗ
    const cushionThickness = 0.1;
    const cushionHeight = 0.15;
    const cushionY = cushionHeight / 2 + 0.05;

    // Kích thước các phần của băng
    const cornerCushionLength = HOLE_RADIUS * 2.5; // Đoạn băng góc
    const middleCushionLength = (TABLE_LENGTH - HOLE_RADIUS * 5) / 2; // Đoạn băng giữa 2 lỗ cạnh dài

    // Băng trên & dưới
    const horizontalCushionWidth = TABLE_WIDTH - HOLE_RADIUS * 2;
    const topBottomCushionGeometry = new THREE.BoxGeometry(horizontalCushionWidth, cushionHeight, cushionThickness);

    const topCushion = new THREE.Mesh(topBottomCushionGeometry, cushionMaterial);
    topCushion.position.set(0, cushionY, TABLE_LENGTH / 2 + cushionThickness / 2);
    topCushion.castShadow = true;
    topCushion.receiveShadow = true;
    scene.add(topCushion);

    const bottomCushion = new THREE.Mesh(topBottomCushionGeometry, cushionMaterial);
    bottomCushion.position.set(0, cushionY, -TABLE_LENGTH / 2 - cushionThickness / 2);
    bottomCushion.castShadow = true;
    bottomCushion.receiveShadow = true;
    scene.add(bottomCushion);

    // Băng trái & phải (chia 2 phần mỗi bên)
    const verticalCushionGeometry = new THREE.BoxGeometry(cushionThickness, cushionHeight, middleCushionLength);
    const sideOffset = TABLE_WIDTH / 2 + cushionThickness / 2;
    const midHoleOffset = TABLE_LENGTH / 4 + HOLE_RADIUS * 1.25;

    // Băng trái
    const leftCushion1 = new THREE.Mesh(verticalCushionGeometry, cushionMaterial);
    leftCushion1.position.set(-sideOffset, cushionY, midHoleOffset);
    leftCushion1.castShadow = true;
    leftCushion1.receiveShadow = true;
    scene.add(leftCushion1);

    const leftCushion2 = new THREE.Mesh(verticalCushionGeometry, cushionMaterial);
    leftCushion2.position.set(-sideOffset, cushionY, -midHoleOffset);
    leftCushion2.castShadow = true;
    leftCushion2.receiveShadow = true;
    scene.add(leftCushion2);

    // Băng phải
    const rightCushion1 = new THREE.Mesh(verticalCushionGeometry, cushionMaterial);
    rightCushion1.position.set(sideOffset, cushionY, midHoleOffset);
    rightCushion1.castShadow = true;
    rightCushion1.receiveShadow = true;
    scene.add(rightCushion1);

    const rightCushion2 = new THREE.Mesh(verticalCushionGeometry, cushionMaterial);
    rightCushion2.position.set(sideOffset, cushionY, -midHoleOffset);
    rightCushion2.castShadow = true;
    rightCushion2.receiveShadow = true;
    scene.add(rightCushion2);

    // Lỗ (holes) - chỉ là hình học để hình dung, vật lý sẽ xử lý việc bi rơi vào lỗ
    const holeGeometry = new THREE.CylinderGeometry(HOLE_RADIUS, HOLE_RADIUS, 0.2, 32);
    const holeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Màu đen

    // Điều chỉnh vị trí lỗ một chút để bi dễ lọt hơn
    const holeOffset = BALL_RADIUS * 0.7; // Độ lệch nhỏ để bi có thể "cảm nhận" lỗ dễ hơn
    const holesPositions = [
        new THREE.Vector3(TABLE_WIDTH / 2 + holeOffset, -0.1, TABLE_LENGTH / 2 + holeOffset), // Góc trên phải
        new THREE.Vector3(-TABLE_WIDTH / 2 - holeOffset, -0.1, TABLE_LENGTH / 2 + holeOffset), // Góc trên trái
        new THREE.Vector3(TABLE_WIDTH / 2 + holeOffset, -0.1, -TABLE_LENGTH / 2 - holeOffset), // Góc dưới phải
        new THREE.Vector3(-TABLE_WIDTH / 2 - holeOffset, -0.1, -TABLE_LENGTH / 2 - holeOffset), // Góc dưới trái
        new THREE.Vector3(TABLE_WIDTH / 2 + holeOffset, -0.1, 0), // Giữa phải
        new THREE.Vector3(-TABLE_WIDTH / 2 - holeOffset, -0.1, 0)  // Giữa trái
    ];

    holesPositions.forEach(pos => {
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.set(pos.x, pos.y, pos.z);
        scene.add(hole);
    });
}

function createBalls() {
    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballBaseMaterial = new THREE.MeshPhongMaterial({ shininess: 100, specular: 0x888888 });

    // Định nghĩa màu sắc cho các bi (số 0 là bi cái)
    const ballColors = [
        0xffffff, // Bi cái (trắng)
        0xff0000, // 1
        0x0000ff, // 2
        0xffa500, // 3 (cam)
        0x800080, // 4 (tím)
        0xffff00, // 5 (vàng)
        0x008000, // 6 (xanh lá)
        0x8b4513, // 7 (nâu)
        0x000000, // 8 (đen)
        0xff0000, // 9 (sọc đỏ)
        0x0000ff, // 10 (sọc xanh)
        0xffa500, // 11 (sọc cam)
        0x800080, // 12 (sọc tím)
        0xffff00, // 13 (sọc vàng)
        0x008000, // 14 (sọc xanh lá)
        0x8b4513, // 15 (sọc nâu)
    ];

    // Tạo 1 bi cái và 15 bi mục tiêu
    for (let i = 0; i < 16; i++) {
        const material = ballBaseMaterial.clone();
        material.color.setHex(ballColors[i]);
        const ball = new THREE.Mesh(ballGeometry, material);
        ball.castShadow = true; // Đổ bóng
        ball.receiveShadow = true; // Nhận bóng
        ball.userData.ballId = i; // Gán ID để dễ quản lý giữa Three.js và Cannon.js
        balls.push(ball);
        scene.add(ball);
    }
}

function createCueLine() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 }); // Màu vàng, độ dày 3
    cueLine = new THREE.Line(geometry, material);
    scene.add(cueLine);
}

export function updateCueLine(startPoint, endPoint) {
    if (!cueLine) return;
    const positions = new Float32Array([
        startPoint.x, startPoint.y, startPoint.z,
        endPoint.x, endPoint.y, endPoint.z
    ]);
    cueLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    cueLine.geometry.setDrawRange(0, 2); // Chỉ vẽ 2 đỉnh
    cueLine.visible = true;
}

export function hideCueLine() {
    if (cueLine) {
        cueLine.visible = false;
    }
}

export function updateBallPositions(ballPhysicsBodies) {
    ballPhysicsBodies.forEach((body, index) => {
        if (balls[index]) {
            balls[index].position.copy(body.position);
            balls[index].quaternion.copy(body.quaternion);
        }
    });
}

export function renderScene() {
    renderer.render(scene, camera);
    controls.update(); // Cập nhật OrbitControls
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export { scene, camera, renderer, balls, TABLE_WIDTH, TABLE_LENGTH, HOLE_RADIUS, BALL_RADIUS, controls };