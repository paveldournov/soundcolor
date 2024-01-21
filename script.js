let audioContext, analyser, microphone;

// Define the data structure as an object
class FrequencyBand {
    constructor(lowFrq, highFreq) {
        this.lowFreq = lowFrq;
        this.highFreq = highFreq;
    }
}

function createFreqArray() {
    let array = [];
    hf = 10;
    binCount = 50;
    freqIncrement = 100;
    for (let i = 0; i < binCount; i++) {
        array.push(new FrequencyBand(hf, hf + freqIncrement));
        hf = hf + freqIncrement + 1;
    }
    return array;
}

let frequncyBins = createFreqArray();
let frequencyBinCount = frequncyBins.length;
let freqIndecies = [];


// Function to add an element to the div
function addElementsToBarsSection(elementType, className, content, properties) {
    // Select the div using its ID
    const div = document.getElementById('frequencyBars');

    // Create a new element
    const newElement = document.createElement(elementType);
    newElement.textContent = content;

    
    // Set properties on the new element
    if (properties) {
        for (const prop in properties) {
            newElement[prop] = properties[prop];
        }
    }

    newElement.className = className; 

    // Add the new element to the div
    div.appendChild(newElement);
}

for (let i = 0; i < frequncyBins.length; i++) {
    addElementsToBarsSection('div', 'bar green', `${frequncyBins[i].lowFreq} - ${frequncyBins[i].highFreq}`, {
        id: `bar${i}`
    });
   
}


const startButton = document.getElementById('startButton');


startButton.addEventListener('click', function() {
        // Toggle button text between 'Start' and 'Stop'
        if (this.innerHTML === 'Start') {
            this.innerHTML = 'Stop';
            // TODO: Start audio processing

            if (audioContext == null) {
                initAudioProcessing();
            }

            startAudioProcessing();

        } else {
                       
            stopAudioProcessing();
            this.innerHTML = 'Start';

        }
    });
   

function initAudioProcessing() {
    audioContext = new AudioContext();
    // Access microphone and set up processing

    microphone = navigator.mediaDevices.getUserMedia({audio: true, video: false})
}

function calculateFrequencyBand(lowFreq, highFreq, sampleRate, binCount) {
    const nyquist = sampleRate / 2;
    const lowIndex = Math.round(binCount * lowFreq / nyquist);
    const highIndex = Math.round(binCount * highFreq / nyquist);
    return { lowIndex, highIndex };
}

async function startAudioProcessing() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio input or the Web Audio API.');
        return;
    }

    try {
        // Access the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialize the AudioContext
        audioContext = new AudioContext();

        // Create a MediaStreamSource from the microphone input
        microphone = audioContext.createMediaStreamSource(stream);

        // Create an AnalyserNode
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Example size, can be adjusted

        // Connect the microphone to the analyser
        microphone.connect(analyser);

        // Determine the frequency bins
        const sampleRate = audioContext.sampleRate;
        const binCount = analyser.frequencyBinCount; // Half the FFT size
        freqData = new Uint8Array(binCount);

        // Calculate the index range for each frequency band
        for (let i = 0; i < frequncyBins.length; i++) {
            freqIndecies.push(calculateFrequencyBand(frequncyBins[i].lowFreq, frequncyBins[i].highFreq, sampleRate, binCount));
        }

        //lowBand = calculateFrequencyBand(10, 200, sampleRate, binCount);
        //midBand = calculateFrequencyBand(201, 2000, sampleRate, binCount);
        //highBand = calculateFrequencyBand(2001, 20000, sampleRate, binCount);

        analysisInterval = setInterval(analyzeAudio, 50);

    } catch (err) {
        alert('Error accessing the microphone: ' + err.message);
    }
}


function analyzeAudio() {
    analyser.getByteFrequencyData(freqData);

    let bandVolumes = [];
    for (let i = 0; i < freqIndecies.length; i++) {
        let bandVolume = calculateAverageVolume(freqData, freqIndecies[i].lowIndex, freqIndecies[i].highIndex)
        bandVolumes.push(bandVolume);
    }

    //const lowAvg = calculateAverageVolume(freqData, lowBand.lowIndex, lowBand.highIndex);
    //const midAvg = calculateAverageVolume(freqData, midBand.lowIndex, midBand.highIndex);
    //const highAvg = calculateAverageVolume(freqData, highBand.lowIndex, highBand.highIndex);


    for (let i = 0; i < bandVolumes.length; i++) {
        updateBarLength(`bar${i}`, bandVolumes[i]);
    }
    

    //updateBarLength('lowFreq', lowAvg);
    //updateBarLength('midFreq', midAvg);
    //updateBarLength('highFreq', highAvg);
}

function calculateAverageVolume(data, startIndex, endIndex) {
    let sum = 0;
    for (let i = startIndex; i <= endIndex; i++) {
        sum += data[i];
    }
    return sum / (endIndex - startIndex + 1);
}

function updateBarLength(barId, volume) {
    const barElement = document.getElementById(barId);
    const maxBarHeight = 300; // Assuming the max height of the bar in pixels
    const height = Math.round((volume / 255) * maxBarHeight);
    barElement.style.height = `${height}px`;
}

function stopAudioProcessing() {
    if (audioContext) {
        clearInterval(analysisInterval);
        audioContext.close(); // Close the audio context
        audioContext = null;
    }
}

