import * as CANNON from 'cannon-es'; // Thay thế import Cannon
import { TABLE_WIDTH, TABLE_LENGTH, HOLE_RADIUS, BALL_RADIUS } from './scene.js';

let world;
let ballBodies = []; // Mảng chứa các Body của bi
let tableBody;
const holeTriggers = []; // Mảng chứa các Body (trigger) của lỗ

const CUE_BALL_INDEX = 0; // Bi cái luôn là bi đầu tiên

export function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Trọng lực
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true; // Cho phép các vật thể "ngủ" khi đứng yên
    world.solver.iterations = 10; // Tăng độ chính xác của solver

    // Vật liệu vật lý
    const tableMaterial = new CANNON.Material('tableMaterial');
    const ballMaterial = new CANNON.Material('ballMaterial');
    const cushionMaterial = new CANNON.Material('cushionMaterial');
    const holeTriggerMaterial = new CANNON.Material('holeTriggerMaterial'); // Vật liệu cho trigger lỗ

    // Thiết lập vật liệu va chạm
    const ballTableContactMaterial = new CANNON.ContactMaterial(ballMaterial, tableMaterial, {
        friction: 0.1,
        restitution: 0.7 // Độ nảy
    });
    world.addContactMaterial(ballTableContactMaterial);

    const ballCushionContactMaterial = new CANNON.ContactMaterial(ballMaterial, cushionMaterial, {
        friction: 0.2, // Ma sát với băng cao hơn một chút
        restitution: 0.8 // Nảy từ băng
    });
    world.addContactMaterial(ballCushionContactMaterial);

    const ballBallContactMaterial = new CANNON.ContactMaterial(ballMaterial, ballMaterial, {
        friction: 0.05, // Ma sát giữa các bi thấp hơn để lăn mượt
        restitution: 0.9 // Độ nảy giữa các bi cao hơn
    });
    world.addContactMaterial(ballBallContactMaterial);

    // Không cần ContactMaterial cho bi và lỗ vì lỗ là trigger

    // Tạo mặt bàn vật lý
    const tableShape = new CANNON.Box(new CANNON.Vec3(TABLE_WIDTH / 2, 0.05, TABLE_LENGTH / 2));
    tableBody = new CANNON.Body({ mass: 0, material: tableMaterial });
    tableBody.addShape(tableShape);
    tableBody.position.set(0, -0.05, 0); // Đặt thấp hơn 0 một chút để bi không xuyên qua
    world.addBody(tableBody);

    // Tạo các băng vật lý
    const cushionThickness = 0.1;
    const cushionHeight = 0.15;
    const cushionY = cushionHeight / 2 + 0.05;

    // Kích thước các phần của băng
    const horizontalCushionWidth = TABLE_WIDTH - HOLE_RADIUS * 2;
    const middleCushionLength = (TABLE_LENGTH - HOLE_RADIUS * 5) / 2;

    const topBottomCushionShape = new CANNON.Box(new CANNON.Vec3(horizontalCushionWidth / 2, cushionHeight / 2, cushionThickness / 2));
    const sideCushionShape = new CANNON.Box(new CANNON.Vec3(cushionThickness / 2, cushionHeight / 2, middleCushionLength / 2));

    const addCushion = (x, y, z, shape) => {
        const cushionBody = new CANNON.Body({ mass: 0, material: cushionMaterial });
        cushionBody.addShape(shape);
        cushionBody.position.set(x, y, z);
        world.addBody(cushionBody);
    };

    // Băng trên
    addCushion(0, cushionY, TABLE_LENGTH / 2 + cushionThickness / 2, topBottomCushionShape);
    // Băng dưới
    addCushion(0, cushionY, -TABLE_LENGTH / 2 - cushionThickness / 2, topBottomCushionShape);

    // Băng trái & phải
    const sideOffset = TABLE_WIDTH / 2 + cushionThickness / 2;
    const midHoleOffset = TABLE_LENGTH / 4 + HOLE_RADIUS * 1.25;

    addCushion(-sideOffset, cushionY, midHoleOffset, sideCushionShape);
    addCushion(-sideOffset, cushionY, -midHoleOffset, sideCushionShape);
    addCushion(sideOffset, cushionY, midHoleOffset, sideCushionShape);
    addCushion(sideOffset, cushionY, -midHoleOffset, sideCushionShape);


    // Tạo các bi vật lý
    createPhysicsBalls();

    // Định nghĩa vị trí các lỗ và tạo trigger
    const holePositions = [
        new CANNON.Vec3(TABLE_WIDTH / 2, 0, TABLE_LENGTH / 2),
        new CANNON.Vec3(-TABLE_WIDTH / 2, 0, TABLE_LENGTH / 2),
        new CANNON.Vec3(TABLE_WIDTH / 2, 0, -TABLE_LENGTH / 2),
        new CANNON.Vec3(-TABLE_WIDTH / 2, 0, -TABLE_LENGTH / 2),
        new CANNON.Vec3(TABLE_WIDTH / 2, 0, 0),
        new CANNON.Vec3(-TABLE_WIDTH / 2, 0, 0)
    ];

    const holeTriggerShape = new CANNON.Cylinder(HOLE_RADIUS * 0.9, HOLE_RADIUS * 0.9, 0.5, 8); // Shape hình trụ
    const quaternion = new CANNON.Quaternion();
    quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2); // Xoay để trụ đứng

    holePositions.forEach((pos, index) => {
        const holeTriggerBody = new CANNON.Body({ mass: 0, isTrigger: true, material: holeTriggerMaterial });
        holeTriggerBody.addShape(holeTriggerShape, new CANNON.Vec3(0, 0, 0), quaternion);
        holeTriggerBody.position.copy(pos);
        holeTriggerBody.position.y = -0.1; // Đặt thấp hơn mặt bàn một chút
        holeTriggerBody.holeId = index; // Gán ID lỗ
        world.addBody(holeTriggerBody);
        holeTriggers.push(holeTriggerBody);
    });

    // Lắng nghe sự kiện va chạm (ở đây là trigger)
    world.addEventListener('beginContact', (event) => {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;

        // Kiểm tra xem một trong hai vật thể có phải là bi và vật thể kia là lỗ không
        const ballBody = ballBodies.find(b => b === bodyA || b === bodyB);
        const holeTriggerBody = holeTriggers.find(h => h === bodyA || h === bodyB);

        if (ballBody && holeTriggerBody) {
            // Xác định index của bi
            const ballIndex = ballBodies.indexOf(ballBody);
            // Gửi sự kiện bi vào lỗ
            document.dispatchEvent(new CustomEvent('ballPotted', { detail: { ballId: ballIndex } }));
        }
    });
}

export function createPhysicsBalls() {
    // Xóa các bi vật lý cũ khỏi thế giới
    ballBodies.forEach(body => world.removeBody(body));
    ballBodies = [];

    const ballShape = new CANNON.Sphere(BALL_RADIUS);
    const ballMass = 0.17; // Khối lượng một bi bida
    const ballMaterial = new CANNON.Material('ballMaterial');

    // Vị trí ban đầu của bi cái
    const cueBallPos = new CANNON.Vec3(0, BALL_RADIUS, TABLE_LENGTH / 4 + 0.1); // Dịch lên một chút
    const cueBallBody = new CANNON.Body({ mass: ballMass, shape: ballShape, material: ballMaterial });
    cueBallBody.position.copy(cueBallPos);
    cueBallBody.sleep(); // Cho bi cái "ngủ" khi chưa đánh
    cueBallBody.ballId = CUE_BALL_INDEX; // Gán ID
    world.addBody(cueBallBody);
    ballBodies.push(cueBallBody);

    // Vị trí ban đầu của các bi mục tiêu (hình tam giác)
    const rackStart_Z = -TABLE_LENGTH / 4;
    const spacing = BALL_RADIUS * 2.05; // Khoảng cách giữa các bi

    // Các bi từ 1 đến 15
    const triangleBalls = [
        1,
        2, 3,
        4, 8, 5, // Bi số 8 ở giữa hàng thứ 3
        6, 7, 9, 10,
        11, 12, 13, 14, 15
    ];

    let ballIndex = 1;
    for (let r = 0; r < 5; r++) { // 5 hàng
        for (let b = 0; b <= r; b++) {
            if (ballIndex > 15) break;

            const x = (b - r / 2) * spacing;
            const z = rackStart_Z - r * spacing * Math.sqrt(3) / 2;

            const targetBallBody = new CANNON.Body({ mass: ballMass, shape: ballShape, material: ballMaterial });
            targetBallBody.position.set(x, BALL_RADIUS, z);
            targetBallBody.sleep();
            targetBallBody.ballId = triangleBalls[ballIndex - 1]; // Gán ID bi theo thứ tự
            world.addBody(targetBallBody);
            ballBodies.push(targetBallBody);
            ballIndex++;
        }
        if (ballIndex > 15) break;
    }
}

export function updatePhysics(deltaTime) {
    world.step(1 / 60, deltaTime, 10); // Cập nhật thế giới vật lý
}

export function applyCueForce(direction, force) {
    const cueBall = ballBodies[CUE_BALL_INDEX];
    if (cueBall && cueBall.sleepState === CANNON.Body.SLEEPING) { // Chỉ đánh khi bi cái đang đứng yên
        cueBall.wakeUp();
        // Áp dụng lực theo hướng và độ lớn đã cho
        const impulse = new CANNON.Vec3(direction.x * force, 0, direction.z * force);
        // Áp dụng impulse tại một điểm hơi lệch so với tâm để tạo xoáy (spin)
        const hitPoint = new CANNON.Vec3(cueBall.position.x - direction.x * BALL_RADIUS * 0.5, cueBall.position.y, cueBall.position.z - direction.z * BALL_RADIUS * 0.5);
        cueBall.applyImpulse(impulse, hitPoint);
    }
}

export function getAllBallBodies() {
    return ballBodies;
}

export function resetPhysicsBalls() {
    createPhysicsBalls(); // Tạo lại các bi vật lý với vị trí ban đầu
}

export function isAnyBallMoving() {
    for (let i = 0; i < ballBodies.length; i++) {
        // Kiểm tra vận tốc tuyến tính và vận tốc góc
        if (ballBodies[i].velocity.length() > 0.01 || ballBodies[i].angularVelocity.length() > 0.1) { // Ngưỡng nhỏ để xác định "đang di chuyển"
            return true;
        }
    }
    return false;
}

// Thêm hàm để đặt lại bi cái vào bàn
export function repositionCueBall() {
    const cueBallBody = ballBodies[CUE_BALL_INDEX];
    if (cueBallBody) {
        cueBallBody.position.set(0, BALL_RADIUS, TABLE_LENGTH / 4 + 0.1); // Vị trí xuất phát
        cueBallBody.velocity.set(0, 0, 0);
        cueBallBody.angularVelocity.set(0, 0, 0);
        cueBallBody.wakeUp(); // Đảm bảo bi không ngủ đông sau khi đặt
    } else {
        // Nếu bi cái đã bị remove (ví dụ: vào lỗ), cần tạo lại nó
        const ballShape = new CANNON.Sphere(BALL_RADIUS);
        const ballMass = 0.17;
        const ballMaterial = new CANNON.Material('ballMaterial');
        const newCueBallBody = new CANNON.Body({ mass: ballMass, shape: ballShape, material: ballMaterial });
        newCueBallBody.position.set(0, BALL_RADIUS, TABLE_LENGTH / 4 + 0.1);
        newCueBallBody.ballId = CUE_BALL_INDEX;
        world.addBody(newCueBallBody);
        ballBodies[CUE_BALL_INDEX] = newCueBallBody; // Cập nhật trong mảng
    }
}

export function removeBallFromPhysics(ballId) {
    const ballBody = ballBodies[ballId];
    if (ballBody) {
        world.removeBody(ballBody);
        // Đặt vị trí của bi ra xa để không còn render
        ballBody.position.set(0, -100, 0);
        ballBody.velocity.set(0,0,0);
        ballBody.angularVelocity.set(0,0,0);
    }
}

export { world, CUE_BALL_INDEX, holeTriggers };