//Author: Kausik Krishnakumar (2019)

// Constants
var PI = 3.14159;
var TICKS_PER_REV = 600;
var MAX_ROTATION_SPEED = 0.8;
var PLAT_INCREMENT = 0.03;
var THICKNESS = 0.2;
var CIRCUM_RADIUS = 0.5774;
var INSCRIBED_RADIUS = 0.2887;
var UPPERPLAT_START_POS = 2;
var AUTO_UPDATE_MATRIX = false;
var ORIGIN = new THREE.Vector3(0, 0, 0);
var ZUNIT = new THREE.Vector3(0, 0, 1);
var WORKSPACE_BOUNDS = { radius: 3.5, zstart: 1, zend: 5.8};  // Defines the cylinder in which to calculate the robot's workspace

// Objects
var scene, camera, renderer, controls;
var basePlat, baseLegs = [], joints = [],
    upperPlat, upperLegs = [];

// Robot parameters
var basePlatLen = 3,
    baseLegLen = 2.74,
    upperPlatLen = 0.75,
    upperLegLen = 3,
    baseAngleLowerLims = [0, 0, 0],
    baseAngleUpperLims = [PI/2, PI/2, PI/2],
    balljointLimit = 55/2 * PI/180;
    baseAngles = [];

// HTML elements
var sliders = [], angleText = [], posText = [];
var textInFocus = false;
var sliderChanged = false,
    angleChanged = false,
    posChanged = false,
    runningScript = false;
    [xkey, ykey, zkey] = [0, 0, 0, 0];

// GCODE animations
var t = 0, prevT = 0;
var instructions = [];

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
    camera.position.z = 7;

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
    plane.position.copy(new THREE.Vector3(0, -CIRCUM_RADIUS * basePlatLen - 1, 0));
    plane.quaternion.setFromEuler(new THREE.Euler(-PI/2, 0, 0));
    plane.updateMatrix();
    plane.receiveShadow = true;
    scene.add( plane );

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    THREE.Object3D.DefaultMatrixAutoUpdate = AUTO_UPDATE_MATRIX;

    // HTML input setups
    sliders.push(document.getElementById('angle1'));
    sliders.push(document.getElementById('angle2'));
    sliders.push(document.getElementById('angle3'));

    angleText.push(document.getElementById('angle1txt'));
    angleText.push(document.getElementById('angle2txt'));
    angleText.push(document.getElementById('angle3txt'));

    posText.push(document.getElementById('posx'));
    posText.push(document.getElementById('posy'));
    posText.push(document.getElementById('posz'));
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    document.getElementById('gcode').addEventListener('focus', () => {
        controls.enabled = false;
        textInFocus = true;
    }, false);
    document.getElementById('gcode').addEventListener('focusout', () => {
        controls.enabled = true;
        textInFocus = false;
    }, false);
}

function setupRobot() {
    /* 
    * 300 mm = basePlatLen
    * 274 mm = baseLegLen
    * 75 mm = upperPlatLen
    * 300 mm = upperLegLen
    */

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
    basePlat = new THREE.Mesh(basePlatGeo, purpleMat);
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

    if (moveRobot())
        updateMatrices();

    controls.update();
    renderer.render(scene, camera);
}

function updateMatrices() {
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

function moveRobot() {
    /* 
     * Returns true if position updated, false otherwise
     * Must run updateMatrices() after calling moveRobot() to update animation
     */

    let moved = true;
    t = performance.now();

    if (runningScript) {
        var dists = [];
        var max_ind = 0;
        var dt = (t - prevT)/1000;

        for (var i = 0; i < 3; i++) {
            dists.push(instructions[0][i] - baseAngles[i].x);
            if (Math.abs(dists[i]) > Math.abs(dists[max_ind]))
                max_ind = i;
        }

        if (dists[max_ind] != 0) {
            var max_dist = Math.abs(dists[max_ind]) > Math.abs(MAX_ROTATION_SPEED * dt) ? MAX_ROTATION_SPEED * dt * Math.sign(dists[max_ind]) : dists[max_ind];
            baseAngles[max_ind].x += max_dist;
    
            var ind = (max_ind + 1)%3;
            var dist = max_dist * dists[ind]/dists[max_ind];
            baseAngles[ind].x += dist;
            
            ind = (max_ind + 2)%3;
            dist = max_dist * dists[ind]/dists[max_ind];
            baseAngles[ind].x += dist;
    
            calculatePlatPosition();
            updateInputs();
        } else {
            instructions.shift();
            if (instructions.length == 0)
                runningScript = false;
        }
    } else if (xkey || ykey || zkey) {
        upperPlat.position.x += xkey * PLAT_INCREMENT;
        upperPlat.position.y += ykey * PLAT_INCREMENT;
        upperPlat.position.z += zkey * PLAT_INCREMENT;
        calculateBaseAngles();

        updateInputs();
    } else if (sliderChanged) {
        for (var i = 0; i < 3; i++)
            baseAngles[i].x = sliders[i].value * 180/1000 * PI/180;
        calculatePlatPosition();

        updateInputs();
        sliderChanged = false;
    } else if (angleChanged) {
        for (var i = 0; i < 3; i++)
            baseAngles[i].x = angleText[i].value * PI/180;
        calculatePlatPosition();

        updateInputs();
        angleChanged = false;
    } else if (posChanged) {
        upperPlat.position.x = parseFloat(posText[0].value);
        upperPlat.position.y = parseFloat(posText[1].value);
        upperPlat.position.z = parseFloat(posText[2].value);
        calculateBaseAngles();

        updateInputs();
        posChanged = false;
    } else
        moved = false;

    prevT = t;
    return moved;
}

function handleKeyDown(e) {
    if (textInFocus) {
        return;
    }
    if (e.keyCode == 68) {
        xkey = 1;
    } else if (e.keyCode == 65) {
        xkey = -1;
    } else if (e.keyCode == 87) {
        ykey = 1;
    } else if (e.keyCode == 83) {
        ykey = -1;
    } else if (e.keyCode == 69) {
        zkey = 1;
    } else if (e.keyCode == 81) {
        zkey = -1;
    }
}

function handleKeyUp(e) {
    if (e.keyCode == 65 || e.keyCode == 68) {
        xkey = 0;
    } else if (e.keyCode == 87 || e.keyCode == 83) {
        ykey = 0;
    } else if (e.keyCode == 81 || e.keyCode == 69) {
        zkey = 0;
    }
}

function handleSlider() {
    sliderChanged = true;
}

function handleButton(name) {
    if (name == 'play') {
        runningScript = true;
        var lines = document.getElementById('gcode').value.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var nums = lines[i].match(/(?<=X|Y|Z)[0-9-]+/g);
            for (var j = 0; j < nums.length; j++)
                nums[j] = parseInt(nums[j]) * 2 * PI/TICKS_PER_REV + baseAngles[j].x;
            instructions.push(nums);
        }
    } else if (name == 'stop') {
        runningScript = false;
        instructions = [];
    } else if (name == 'home') {
        for (var i = 0; i < 3; i++)
            angleText[i].value = 0;
        angleChanged = true;
    } else if (name == 'workspace') {
        calculateWorkspace();
    }
}

function handleNumber(type) {
    angleChanged = type == 'angle';
    posChanged = type == 'pos';
}

function updateInputs() {
    for (var i = 0; i < 3; i++) {
        sliders[i].value = baseAngles[i].x * 180/PI * 1000/180;
        angleText[i].value = Math.round(baseAngles[i].x * 180/PI * 1000)/1000;
    }
    posText[0].value = upperPlat.position.x;
    posText[1].value = upperPlat.position.y;
    posText[2].value = upperPlat.position.z;
}

function calculateBaseAngles() {
    for (var i = 0; i < 3; i++) {
        var centerC = baseLegs[i].position.clone();
        var centerS = upperPlat.position.clone();
        centerS.x += i > 0 ? (1.5 - i) * upperPlatLen : 0;
        centerS.y += i ? -INSCRIBED_RADIUS * upperPlatLen : CIRCUM_RADIUS * upperPlatLen;
        var normal = new THREE.Vector3(-baseLegs[i].position.y, baseLegs[i].position.x, 0).normalize();

        var [p0, p1] = sphere_circle(centerS, upperLegLen, centerC, normal, baseLegLen);
        if (!(p0 == null && p1 == null)) {
            baseAngles[i].x = (PI - p1.clone().sub(centerC).angleTo(ORIGIN.clone().sub(centerC))) * (p1.z < 0 ? -1 : 1);
            joints[i].position.copy(p1);
        }
    }
}

function calculatePlatPosition() {
    var c0 = new THREE.Vector3(0,
            INSCRIBED_RADIUS * basePlatLen + Math.cos(baseAngles[0].x) * baseLegLen,
            Math.sin(baseAngles[0].x) * baseLegLen);
    var c1 = new THREE.Vector3(0.25 * basePlatLen + Math.cos(baseAngles[1].x) * Math.cos(PI/6) * baseLegLen,
            (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * basePlatLen - Math.cos(baseAngles[1].x) * Math.sin(PI/6) * baseLegLen,
            Math.sin(baseAngles[1].x) * baseLegLen);
    var c2 = new THREE.Vector3(-(0.25 * basePlatLen + Math.cos(baseAngles[2].x) * Math.cos(PI/6) * baseLegLen),
            (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * basePlatLen - Math.cos(baseAngles[2].x) * Math.sin(PI/6) * baseLegLen,
            Math.sin(baseAngles[2].x) * baseLegLen)

    joints[0].position.copy(c0);
    joints[1].position.copy(c1);
    joints[2].position.copy(c2);

    c0.y += -CIRCUM_RADIUS * upperPlatLen;
    c1.x += -0.5 * upperPlatLen;
    c1.y += INSCRIBED_RADIUS * upperPlatLen;
    c2.x += 0.5 * upperPlatLen;
    c2.y += INSCRIBED_RADIUS * upperPlatLen;

    var [center, normal, radius] = sphere_sphere(c0, upperLegLen, c1, upperLegLen);
    var [p0, p1] = sphere_circle(c2, upperLegLen, center, normal, radius);

    if (!(p0 == null && p1 == null))
        upperPlat.position.copy(p1);
}

function calculateWorkspace() {
    let dr = 0.05, dz = 0.05, dtheta = 0.05;

    let geometry = new THREE.BufferGeometry();
    let material = new THREE.PointsMaterial( { color: 0x000055, size: 0.02 } );
    let positions = [];

    for (let z = WORKSPACE_BOUNDS.zstart; z <= WORKSPACE_BOUNDS.zend; z += dz) {
        for (let theta = 0; theta < 2*PI; theta += dtheta) {
            let r = WORKSPACE_BOUNDS.radius;
            let closest = null;
            let angles = [-5, -5, -5];
            let balljointAngles = [-1, -1, -1];
            let prevValid = false;
            while (r > 0) {
                closest = new THREE.Vector3(r*Math.cos(theta), r*Math.sin(theta), z);
                angles = [-5, -5, -5];
                balljoint_angles = [-1, -1, -1];
                for (let i = 0; i < 3; i++) {
                    let centerC = baseLegs[i].position.clone();
                    let centerS = closest.clone();
                    centerS.x += i > 0 ? (1.5 - i) * upperPlatLen : 0;
                    centerS.y += i ? -INSCRIBED_RADIUS * upperPlatLen : CIRCUM_RADIUS * upperPlatLen;
                    let normal = new THREE.Vector3(-baseLegs[i].position.y, baseLegs[i].position.x, 0).normalize();
                    let [p0, p1] = sphere_circle(centerS, upperLegLen, centerC, normal, baseLegLen);
                    if (!(p0 == null || p1 == null)) {
                        angles[i] = (PI - p1.clone().sub(centerC).angleTo(ORIGIN.clone().sub(centerC))) * (p1.z < 0 ? -1 : 1);
                        balljointAngles[i] = centerC.clone().sub(p1).projectOnPlane(ZUNIT).angleTo(centerS.clone().sub(p1).projectOnPlane(ZUNIT));
                        balljointAngles[i] = baseAngles[i].x > PI/2 ? PI - balljointAngles[i] : balljointAngles[i];
                    } else
                        break;
                }
                r -= dr;

                if (angles[0] > baseAngleLowerLims[0] &&
                    angles[1] > baseAngleLowerLims[1] &&
                    angles[2] > baseAngleLowerLims[2] &&
                    angles[0] < baseAngleUpperLims[0] &&
                    angles[1] < baseAngleUpperLims[1] &&
                    angles[2] < baseAngleUpperLims[2] &&
                    balljointAngles[0] < balljointLimit &&
                    balljointAngles[1] < balljointLimit &&
                    balljointAngles[2] < balljointLimit) {
                    if (!prevValid) {
                        positions.push(closest.x, closest.y, closest.z);
                        prevValid = true;
                    }
                } else if (prevValid) {
                    positions.push(closest.x, closest.y, closest.z);
                    prevValid = false;
                }
            }
        }
    }
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    let line = new THREE.Points(geometry, material);
    scene.add(line);
}

setupScene();
setupRobot();
updateMatrices();
calculateBaseAngles();
updateMatrices();
animate();
