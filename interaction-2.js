// Load the course's Faust creaking-door model.
let dspNode = null;

const doorPosition = "/door/door/position";
const doorVolume = "/door/volume";
const door = new FaustWasm2ScriptProcessor("door");

door.createDSP(audioContext, 1024)
    .then(node => {
        if (!node) {
            return;
        }

        node.setParamValue(doorVolume, 0);
        node.connect(audioContext.destination);
        dspNode = node;
    })
    .catch(error => console.error("Could not initialize the door sound:", error));

let previousAngle = null;
let previousTime = null;
let rotationSpeed = 0;
let creaking = false;

function rotationChange(_rotationX, _rotationY, rotationZ) {
    if (!dspNode || audioContext.state !== "running" || !Number.isFinite(rotationZ)) {
        previousAngle = null;
        previousTime = null;
        rotationSpeed = 0;
        creaking = false;

        if (dspNode) {
            dspNode.setParamValue(doorVolume, 0);
        }
        return;
    }

    const now = millis();

    // Start from the current angle after enabling audio or resuming the page.
    if (previousAngle === null || now - previousTime > 250) {
        previousAngle = rotationZ;
        previousTime = now;
        rotationSpeed = 0;
        creaking = false;
        dspNode.setParamValue(doorVolume, 0);
        return;
    }

    const elapsed = (now - previousTime) / 1000;
    if (elapsed <= 0) {
        return;
    }

    // Handle angle wraparound, such as 179 degrees to -179 degrees.
    const delta = ((rotationZ - previousAngle + 540) % 360) - 180;
    previousAngle = rotationZ;
    previousTime = now;

    // Smooth the speed and use separate start and stop thresholds.
    const weight = 1 - Math.exp(-elapsed / 0.12);
    rotationSpeed += weight * (Math.abs(delta) / elapsed - rotationSpeed);
    creaking = rotationSpeed >= (creaking ? 6 : 12);

    if (!creaking) {
        dspNode.setParamValue(doorVolume, 0);
        return;
    }

    const speedFraction = Math.min(rotationSpeed / 90, 1);
    dspNode.setParamValue(doorPosition, 0.18 + 0.28 * speedFraction);
    dspNode.setParamValue(doorVolume, 0.15 + 0.25 * speedFraction);
}

// Callbacks used by the course's sketch.js.
function accelerationChange() {}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}

function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}