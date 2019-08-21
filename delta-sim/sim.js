// Constants
var PI = 3.14159;
var DT = 0.5;
var THICKNESS = 0.3;
var CIRCUM_RADIUS = 0.5774;
var INSCRIBED_RADIUS = 0.2887;
var UPPERPLAT_START_POS = 1.5;
var AUTO_UPDATE_MATRIX = false;
var ORIGIN = new THREE.Vector3(0, 0, 0);

// Objects
var scene, camera, renderer, controls, drag;
var basePlat, baseLegs = [], joints = [],
    upperPlat, upperLegs = [];
var sliders = [];

// Parameters
var basePlatLen = 3,
    baseLegLen = 3,
    upperPlatLen = 0.75,
    upperLegLen = 2.74,
    baseAngles = [];
var t = 0;

/* 
 * 300 mm = basePlatLen
 * 300 mm = baseLegLen
 * 75 mm = upperPlatLen
 * 274 mm = upperLegLen
 */

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight - 5);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    document.body.appendChild(renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xbbbbbb, 1);
    directionalLight.position.set(0, 5, -1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1000;
    directionalLight.shadow.mapSize.height = 1000;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    scene.background = new THREE.Color(0xffffff);

    var planeGeometry = new THREE.PlaneBufferGeometry( 100, 100, 1, 1 );
    var planeMaterial = new THREE.MeshLambertMaterial( { color: 0x777777 } )
    var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.position.copy(new THREE.Vector3(0, -CIRCUM_RADIUS * basePlatLen - 0.5, 0));
    plane.quaternion.setFromEuler(new THREE.Euler(-PI/2, 0, 0));
    plane.updateMatrix();
    plane.receiveShadow = true;
    scene.add( plane );

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    sliders.push(document.getElementById('angle1'));
    sliders.push(document.getElementById('angle2'));
    sliders.push(document.getElementById('angle3'));
    for (var i = 0; i < 3; i++)
        sliders[i].addEventListener('input', handleSlider);

    THREE.Object3D.DefaultMatrixAutoUpdate = AUTO_UPDATE_MATRIX;
}

function setupRobot() {
    var blueMat = new THREE.MeshLambertMaterial({ color: 0x0088bb });
    var redMat = new THREE.MeshLambertMaterial({ color: 0xff3a3a });
    var purpleMat = new THREE.MeshLambertMaterial({ color: 0x7a5df9 });

    var triangle = new THREE.Shape();
    triangle.setFromPoints([
        new THREE.Vector2(-0.5, INSCRIBED_RADIUS),
        new THREE.Vector2(0.5, INSCRIBED_RADIUS),
        new THREE.Vector2(0, -CIRCUM_RADIUS)
    ]);
    var basePlatGeo = new THREE.ExtrudeBufferGeometry(triangle, {
        steps: 1,
        depth: THICKNESS,
        bevelEnabled: false
    });
    basePlatGeo.translate(0, 0, -THICKNESS / 2);
    basePlat = new THREE.Mesh(basePlatGeo, blueMat);
    scene.add(basePlat);

    var upperPlatGeo = new THREE.ExtrudeBufferGeometry(triangle, {
        steps: 1,
        depth: THICKNESS,
        bevelEnabled: false
    });
    upperPlatGeo.rotateX(PI);
    upperPlatGeo.translate(0, 0, THICKNESS / 2);
    upperPlat = new THREE.Mesh(upperPlatGeo, redMat);
    upperPlat.position.z = UPPERPLAT_START_POS;
    scene.add(upperPlat);

    drag = new THREE.DragControls([upperPlat], camera, renderer.domElement);
    drag.addEventListener('dragstart', handleDragStart);
    drag.addEventListener('dragend', handleDragEnd);
    drag.addEventListener('drag', handleDrag);

    var baseLegGeo = new THREE.CylinderBufferGeometry(THICKNESS / 2, THICKNESS / 2, 1, 8);
    baseLegGeo.translate(0, 0.5, 0);

    var upperLegGeo = new THREE.CylinderBufferGeometry(THICKNESS / 2, THICKNESS / 2, 1, 8);
    upperLegGeo.translate(0, 0.5, 0);
    upperLegGeo.rotateX(PI / 2);

    for (var i = 0; i < 3; i++) {
        baseLegs.push(new THREE.Mesh(baseLegGeo, redMat));
        scene.add(baseLegs[i]);
        upperLegs.push(new THREE.Mesh(upperLegGeo, blueMat));
        upperLegs[i].container = new THREE.Group();
        upperLegs[i].container.add(upperLegs[i]);
        baseLegs[i].add(upperLegs[i].container);
    }
    baseAngles.push(new THREE.Euler(0, 0, 0, 'ZYX'));
    baseAngles.push(new THREE.Euler(0, 0, -2 * PI / 3, 'ZYX'));
    baseAngles.push(new THREE.Euler(0, 0, 2 * PI / 3, 'ZYX'));

    var jointGeometry = new THREE.SphereBufferGeometry(THICKNESS/2, 16, 16);
    for (var i = 0; i < 3; i++) {
        joints.push(new THREE.Mesh(jointGeometry, purpleMat));
        scene.add(joints[i]);
    }

    upperPlat.castShadow = true;
    upperPlat.receiveShadow = false;
    basePlat.castShadow = true;
    basePlat.receiveShadow = false;
    for (var i = 0; i < 3; i++) {
        baseLegs[i].castShadow = true;
        baseLegs[i].receiveShadow = false;
        upperLegs[i].castShadow = true;
        upperLegs[i].receiveShadow = false;
    }
}

function animate() {
    requestAnimationFrame(animate);

    //updateEffector();
    updateRobot();

    controls.update();
    renderer.render(scene, camera);
}

function updateEffector() {
    upperPlat.position.z = 0.5 * Math.cos(t) + 4;
    upperPlat.position.x = 0.5 * Math.sin(t);
    t += DT;
}

function updateRobot() {
    upperPlat.scale.x = upperPlatLen;
    upperPlat.scale.y = upperPlatLen;

    basePlat.scale.x = basePlatLen;
    basePlat.scale.y = basePlatLen;

    upperPlat.updateMatrix();
    basePlat.updateMatrix();

    baseLegs[0].position.y = INSCRIBED_RADIUS * basePlatLen;

    baseLegs[1].position.x = 0.25 * basePlatLen;
    baseLegs[1].position.y = (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * basePlatLen;

    baseLegs[2].position.x = -0.25 * basePlatLen;
    baseLegs[2].position.y = (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * basePlatLen;

    for (var i = 0; i < 3; i++) {
        baseLegs[i].scale.y = baseLegLen;
        upperLegs[i].container.scale.y = 1 / baseLegLen;
        upperLegs[i].position.y = baseLegLen;
        upperLegs[i].scale.z = upperLegLen;
    }

    for (var i = 0; i < 3; i++) {
        baseLegs[i].quaternion.setFromEuler(baseAngles[i]);
        baseLegs[i].updateMatrix();
        upperLegs[i].container.updateMatrix();
    }

    upperLegs[0].lookAt(upperPlat.position.x,
                upperPlat.position.y + CIRCUM_RADIUS * upperPlatLen,
                upperPlat.position.z);
    upperLegs[1].lookAt(upperPlat.position.x + 0.5 * upperPlatLen,
                upperPlat.position.y - INSCRIBED_RADIUS * upperPlatLen,
                upperPlat.position.z);
    upperLegs[2].lookAt(upperPlat.position.x - 0.5 * upperPlatLen,
                upperPlat.position.y - INSCRIBED_RADIUS * upperPlatLen,
                upperPlat.position.z);

    for (var i = 0; i < 3; i++) {
        upperLegs[i].updateMatrix();
        joints[i].updateMatrix();
    }
}

function handleDragStart() {
    controls.enabled = false;
}

function handleDragEnd() {
    controls.enabled = true;
}

function handleDrag() {
    calculateBaseAngles();
    for (var i = 0; i < 3; i++)
        sliders[i].value = baseAngles[i].x * 180/PI;
}

function handleSlider(e) {
    var angle = e.target.value * PI/180;
    if (e.target.id == 'angle1')
        baseAngles[0].x = angle;
    else if (e.target.id == 'angle2')
        baseAngles[1].x = angle;
    else
        baseAngles[2].x = angle;

    calculatePlatPosition();
}

function calculateBaseAngles() {
    for (var i = 0; i < 3; i++) {
        var centerC = baseLegs[i].position.clone();
        var centerS = upperPlat.position.clone();
        centerS.x += i > 0 ? (1.5 - i) * upperPlatLen : 0;
        centerS.y += i ? -INSCRIBED_RADIUS * upperPlatLen : CIRCUM_RADIUS * upperPlatLen;
        var normal = new THREE.Vector3(-baseLegs[i].position.y, baseLegs[i].position.x, 0).normalize();

        var [p0, p1] = sphere_circle(centerS, upperLegLen, centerC, normal, baseLegLen);

        joints[i].position.copy(p1);
        baseAngles[i].x = PI - p1.clone().sub(centerC).angleTo(ORIGIN.clone().sub(centerC));
        if (joints[i].position.z < 0)
            baseAngles[i].x *= -1;
    }
}

function calculatePlatPosition() {
    updateRobot();

    var c0 = upperLegs[0].getWorldPosition(new THREE.Vector3());
    c0.y += -CIRCUM_RADIUS * upperPlatLen;
    var c1 = upperLegs[1].getWorldPosition(new THREE.Vector3());
    c1.x += -0.5 * upperPlatLen;
    c1.y += INSCRIBED_RADIUS * upperPlatLen;
    var c2 = upperLegs[2].getWorldPosition(new THREE.Vector3());
    c2.x += 0.5 * upperPlatLen;
    c2.y += INSCRIBED_RADIUS * upperPlatLen;

    var [center, normal, radius] = sphere_sphere(c0, upperLegLen, c1, upperLegLen);
    var [p0, p1] = sphere_circle(c2, upperLegLen, center, normal, radius);

    upperPlat.position.copy(p1);
    for (var i = 0; i < 3; i++)
        upperLegs[i].getWorldPosition(joints[i].position);
}

setupScene();
setupRobot();
animate();

upperPlat.position.y = -CIRCUM_RADIUS * 0.5 * basePlatLen;
calculateBaseAngles();