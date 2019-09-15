//Author: Kausik Krishnakumar (2019)

// Constants
var PI = 3.14159;
var TICKS_PER_REV = 600;
var MAX_ROTATION_SPEED = 0.8;
var PLAT_INCREMENT = 0.03;
var THICKNESS = 0.1;
var CIRCUM_RADIUS = 0.5774;
var INSCRIBED_RADIUS = 0.2887;
var UPPERPLAT_START_POS = 2;
var AUTO_UPDATE_MATRIX = false;
var ORIGIN = new THREE.Vector3(0, 0, 0);

// Objects
var scene, camera, renderer, controls;
var basePlat, baseLegs = [], joints = [],
    upperPlat, upperLegs = [];

// Robot parameters
var basePlatLen = 3,
    baseLegLen = 2.74,
    upperPlatLen = 0.75,
    upperLegLen = 3,
    baseAngles = [];

// HTML elements
var sliders = [], angleText = [], posText = [];
var textInFocus = false;
var sliderChanged = false, angleChanged = false, posChanged = false, runningScript = false;
var [xkey, ykey, zkey] = [0, 0, 0, 0];

// GCODE animations
var t = 0, prevT = 0;
var instructions = [];

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    plane.position.copy(new THREE.Vector3(0, -CIRCUM_RADIUS * basePlatLen - 0.5, 0));
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

        baseAngles[i].x = (PI - p1.clone().sub(centerC).angleTo(ORIGIN.clone().sub(centerC))) * (p1.z < 0 ? -1 : 1);
        joints[i].position.copy(p1);
    }
}

function calculatePlatPosition() {
    updateMatrices();

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

function calculateWorkspace() {
    let checkRadius = 3.5;
    let checkEnd = 5.8;
    let checkStart = 1;
    var angles = [2*PI, 2*PI, 2*PI];
    var dr = 0.05, dtheta = 0.05;

    var geometry = new THREE.BufferGeometry();
    var material = new THREE.PointsMaterial( { color: 0x000055, size: 0.02 } );
    var positions = [];

    for (var z = checkStart; z <= checkEnd; z += dr) {
        for (var theta = 0; theta < 2*PI; theta += dtheta) {
            var r = checkRadius;
            var closest = null;
            while (r > 0) {
                var platPos = new THREE.Vector3(r*Math.cos(theta), r*Math.sin(theta), z);
                for (var i = 0; i < 3; i++) {
                    var centerC = baseLegs[i].position.clone();
                    var centerS = platPos;
                    centerS.x += i > 0 ? (1.5 - i) * upperPlatLen : 0;
                    centerS.y += i ? -INSCRIBED_RADIUS * upperPlatLen : CIRCUM_RADIUS * upperPlatLen;
                    var normal = new THREE.Vector3(-baseLegs[i].position.y, baseLegs[i].position.x, 0).normalize();
                    var [p0, p1] = sphere_circle(centerS, upperLegLen, centerC, normal, baseLegLen);
                    angles[i] = (PI - p1.clone().sub(centerC).angleTo(ORIGIN.clone().sub(centerC))) * (p1.z < 0 ? -1 : 1);
                }
                r -= dr;
                if (angles[0] >= PI/2 - 0.1 ||
                    angles[1] >= PI/2 - 0.1 ||
                    angles[2] >= PI/2 - 0.1)
                    closest = [r*Math.cos(theta), r*Math.sin(theta), z];
                else
                    break;
            }
            positions.push(closest[0], closest[1], closest[2]);
        }
    }
    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    var line = new THREE.Points(geometry, material);
    scene.add(line);
}

setupScene();
setupRobot();
animate();
