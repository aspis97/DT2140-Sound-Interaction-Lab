//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "bells";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
bells.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function accelerationChange(accx, accy, accz) {
    // playAudio()
}

const degreesPerStep = 45;

let previousZ = null;
let accumulatedRotation = 0;

function rotationChange(rotx, roty, rotz) {
    if (!Number.isFinite(rotz)) {
        return;
    }

    if (!dspNode || audioContext.state !== "running") {
        previousZ = null;
        accumulatedRotation = 0;
        return;
    }

    if (previousZ === null) {
        previousZ = rotz;
        return;
    }

    // Use the shortest angle difference across the wraparound boundary.
    const delta = ((rotz - previousZ + 540) % 360) - 180;
    previousZ = rotz;
    accumulatedRotation += delta;

    if (Math.abs(accumulatedRotation) >= degreesPerStep && playAudio()) {
        accumulatedRotation = 0;
    }
}

function mousePressed() {
    // playAudio()
    // Use this for debugging from the desktop!
}

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
    playAudio();
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

const bellGate = "/englishBell/gate";
const bellStrikes = [0, 220]; // Strike times in milliseconds.
const gateDuration = 80;

let bellPlaying = false;

function playAudio() {
    if (!dspNode || audioContext.state !== "running" || bellPlaying) {
        return false;
    }

    bellPlaying = true;

    for (const delay of bellStrikes) {
        setTimeout(() => {
            dspNode.setParamValue(bellGate, 1);

            setTimeout(() => {
                dspNode.setParamValue(bellGate, 0);
            }, gateDuration);
        }, delay);
    }

    const lastStrike = bellStrikes[bellStrikes.length - 1];
    setTimeout(() => {
        bellPlaying = false;
    }, lastStrike + gateDuration + 40);

    return true;
}

//==========================================================================================
// END
//==========================================================================================