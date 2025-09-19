document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const memoryDisplay = document.getElementById('memory-display');
    const timeline = document.getElementById('timeline');
    const statsDiv = document.getElementById('stats');
    const runBtn = document.getElementById('run');
    const stepBtn = document.getElementById('step');
    const resetBtn = document.getElementById('reset');
    const algorithmSelect = document.getElementById('algorithm');
    const framesInput = document.getElementById('frames');
    const frameValue = document.getElementById('frame-value');
    const refStringInput = document.getElementById('ref-string');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Chart initialization
    const statsChart = new Chart(
        document.getElementById('stats-chart'),
        {
            type: 'doughnut',
            data: {
                labels: ['Hits', 'Faults'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#4cc9f0', '#f72585'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#333',
                            font: {
                                family: 'Roboto'
                            }
                        }
                    }
                }
            }
        }
    );
    
    // State variables
    let simulationState = null;
    let currentStep = 0;
    let animationTimeline = null;
    
    // Initialize
    updateRangeValues();
    initTheme();
    
    // Event Listeners
    runBtn.addEventListener('click', runSimulation);
    stepBtn.addEventListener('click', stepSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    framesInput.addEventListener('input', updateRangeValues);
    speedInput.addEventListener('input', updateRangeValues);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Functions
    function updateRangeValues() {
        frameValue.textContent = framesInput.value;
        speedValue.textContent = speedInput.value;
    }
    
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    function runSimulation() {
        resetSimulation();
        
        // Get inputs
        const algorithm = algorithmSelect.value;
        const frameCount = parseInt(framesInput.value);
        const refString = refStringInput.value.split(',').map(num => parseInt(num.trim()));
        const speed = parseInt(speedInput.value);
        
        // Validate inputs
        if (isNaN(frameCount) || frameCount < 1 || frameCount > 10) {
            showError('Please enter a valid number of frames (1-10)');
            return;
        }
        
        if (refString.some(isNaN)) {
            showError('Please enter a valid reference string (comma-separated numbers)');
            return;
        }
        
        // Run simulation
        simulationState = simulate(algorithm, frameCount, refString);
        
        // Display initial state
        displayMemory(simulationState.history[0]);
        updateStats(simulationState);
        renderTimeline(simulationState);
        
        // Animate through steps
        animateSimulation(simulationState, speed);
    }
    
    function stepSimulation() {
        if (!simulationState) {
            runSimulation();
            return;
        }
        
        if (currentStep >= simulationState.history.length - 1) {
            showAlert('Simulation complete!');
            return;
        }
        
        currentStep++;
        displayMemory(simulationState.history[currentStep]);
        highlightTimelineStep(currentStep);
    }
    
    function resetSimulation() {
        if (animationTimeline) {
            animationTimeline.kill();
            animationTimeline = null;
        }
        
        memoryDisplay.innerHTML = '';
        timeline.innerHTML = '';
        statsDiv.innerHTML = '<p>Run a simulation to see statistics</p>';
        statsChart.data.datasets[0].data = [0, 0];
        statsChart.update();
        
        simulationState = null;
        currentStep = 0;
    }
    
    function simulate(algorithm, frameCount, refString) {
        const frames = Array(frameCount).fill(null);
        const history = [];
        let pageFaults = 0;
        const queue = []; // For FIFO and Clock
        const lruStack = []; // For LRU
        const freqMap = new Map(); // For LFU
        const clockHand = 0; // For Clock algorithm
        const referenceBits = new Map(); // For Clock algorithm
        
        for (let i = 0; i < refString.length; i++) {
            const page = refString[i];
            const step = {
                page,
                frames: [...frames],
                fault: false,
                replaced: null,
                index: i
            };
            
            // Check if page is in frames
            const frameIndex = frames.indexOf(page);
            
            if (frameIndex !== -1) {
                // Page hit
                step.fault = false;
                
                // Update algorithm-specific data structures
                if (algorithm === 'LRU') {
                    const index = lruStack.indexOf(page);
                    lruStack.splice(index, 1);
                    lruStack.unshift(page);
                } else if (algorithm === 'LFU') {
                    freqMap.set(page, (freqMap.get(page) || 0) + 1);
                } else if (algorithm === 'CLOCK') {
                    referenceBits.set(page, true);
                }
            } else {
                // Page fault
                pageFaults++;
                step.fault = true;
                
                // Find empty frame
                const emptyIndex = frames.indexOf(null);
                
                if (emptyIndex !== -1) {
                    // Use empty frame
                    frames[emptyIndex] = page;
                    
                    // Update algorithm-specific data structures
                    if (algorithm === 'FIFO' || algorithm === 'CLOCK') {
                        queue.push(page);
                    } else if (algorithm === 'LRU') {
                        lruStack.unshift(page);
                    } else if (algorithm === 'LFU') {
                        freqMap.set(page, 1);
                    }
                } else {
                    // Page replacement needed
                    let replaceIndex;
                    
                    if (algorithm === 'FIFO') {
                        // FIFO replacement
                        const firstIn = queue[0];
                        replaceIndex = frames.indexOf(firstIn);
                        queue.shift();
                        queue.push(page);
                    } else if (algorithm === 'LRU') {
                        // LRU replacement
                        const leastRecent = lruStack.pop();
                        replaceIndex = frames.indexOf(leastRecent);
                        lruStack.unshift(page);
                    } else if (algorithm === 'LFU') {
                        // LFU replacement
                        let minFreq = Infinity;
                        let candidates = [];
                        
                        for (let j = 0; j < frames.length; j++) {
                            const freq = freqMap.get(frames[j]) || 0;
                            if (freq < minFreq) {
                                minFreq = freq;
                                candidates = [j];
                            } else if (freq === minFreq) {
                                candidates.push(j);
                            }
                        }
                        
                        // If multiple candidates, use FIFO
                        if (candidates.length > 1) {
                            for (let j = 0; j < frames.length; j++) {
                                if (candidates.includes(j)) {
                                    replaceIndex = j;
                                    break;
                                }
                            }
                        } else {
                            replaceIndex = candidates[0];
                        }
                        
                        freqMap.delete(frames[replaceIndex]);
                        freqMap.set(page, 1);
                    } else if (algorithm === 'OPTIMAL') {
                        // Optimal replacement
                        let farthest = -1;
                        for (let j = 0; j < frames.length; j++) {
                            const nextUse = refString.slice(i + 1).indexOf(frames[j]);
                            if (nextUse === -1) {
                                replaceIndex = j;
                                break;
                            }
                            if (nextUse > farthest) {
                                farthest = nextUse;
                                replaceIndex = j;
                            }
                        }
                    } else if (algorithm === 'CLOCK') {
                        // Clock (Second Chance) replacement
                        let replaced = false;
                        while (!replaced) {
                            const candidate = queue[0];
                            const bit = referenceBits.get(candidate);
                            
                            if (bit) {
                                // Give second chance
                                referenceBits.set(candidate, false);
                                queue.shift();
                                queue.push(candidate);
                            } else {
                                // Replace this page
                                replaceIndex = frames.indexOf(candidate);
                                queue.shift();
                                referenceBits.delete(candidate);
                                replaced = true;
                            }
                        }
                        queue.push(page);
                        referenceBits.set(page, false);
                    } else {
                        // Random replacement
                        replaceIndex = Math.floor(Math.random() * frames.length);
                    }
                    
                    step.replaced = frames[replaceIndex];
                    frames[replaceIndex] = page;
                }
            }
            
            history.push(step);
        }
        
        return {
            algorithm,
            frameCount,
            refString,
            history,
            pageFaults,
            hits: refString.length - pageFaults
        };
    }
    
    function displayMemory(step) {
        memoryDisplay.innerHTML = '';
        
        // Create frame elements
        step.frames.forEach((frame, i) => {
            const frameEl = document.createElement('div');
            frameEl.className = 'frame';
            frameEl.textContent = frame !== null ? frame : ' ';
            
            if (frame === step.page && !step.fault) {
                frameEl.classList.add('hit');
            } else if (frame === step.page && step.fault) {
                frameEl.classList.add('fault');
            }
            
            if (frame === step.page) {
                frameEl.classList.add('current');
            }
            
            // Add frame label
            const label = document.createElement('div');
            label.className = 'frame-label';
            label.textContent = `Frame ${i}`;
            frameEl.appendChild(label);
            
            memoryDisplay.appendChild(frameEl);
        });
        
        // Animate frames
        gsap.from('.frame', {
            duration: 0.5,
            y: 20,
            opacity: 0,
            stagger: 0.1,
            ease: 'back.out'
        });
    }
    
    function renderTimeline(simulation) {
        timeline.innerHTML = '';
        
        const timelineContainer = document.createElement('div');
        timelineContainer.style.display = 'flex';
        timelineContainer.style.alignItems = 'center';
        
        simulation.history.forEach((step, i) => {
            // Create connector between steps (except first)
            if (i > 0) {
                const connector = document.createElement('div');
                connector.className = 'timeline-connector';
                connector.style.flex = '1';
                timelineContainer.appendChild(connector);
            }
            
            // Create step element
            const stepEl = document.createElement('div');
            stepEl.className = 'timeline-step';
            stepEl.dataset.index = i;
            
            const pageEl = document.createElement('div');
            pageEl.className = `timeline-page ${step.fault ? 'timeline-fault' : 'timeline-hit'}`;
            pageEl.textContent = step.page;
            
            const indexEl = document.createElement('div');
            indexEl.className = 'timeline-index';
            indexEl.textContent = i + 1;
            
            stepEl.appendChild(pageEl);
            stepEl.appendChild(indexEl);
            stepEl.addEventListener('click', () => {
                currentStep = i;
                displayMemory(simulation.history[i]);
            });
            
            timelineContainer.appendChild(stepEl);
        });
        
        timeline.appendChild(timelineContainer);
    }
    
    function highlightTimelineStep(index) {
        document.querySelectorAll('.timeline-step').forEach((step, i) => {
            if (i === index) {
                step.style.transform = 'scale(1.2)';
                step.style.zIndex = '1';
            } else {
                step.style.transform = '';
                step.style.zIndex = '';
            }
        });
    }
    
    function updateStats(simulation) {
        statsDiv.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Algorithm:</span>
                <span class="stat-value">${simulation.algorithm}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total References:</span>
                <span class="stat-value">${simulation.refString.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Page Hits:</span>
                <span class="stat-value">${simulation.hits}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Page Faults:</span>
                <span class="stat-value">${simulation.pageFaults}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Fault Rate:</span>
                <span class="stat-value">${((simulation.pageFaults / simulation.refString.length) * 100).toFixed(1)}%</span>
            </div>
        `;
        
        // Update chart
        statsChart.data.datasets[0].data = [simulation.hits, simulation.pageFaults];
        statsChart.update();
    }
    
    function animateSimulation(simulation, speed) {
        if (animationTimeline) {
            animationTimeline.kill();
        }
        
        const stepDuration = 1.1 - (speed * 0.1); // 0.1s to 1s based on speed
        animationTimeline = gsap.timeline();
        
        for (let i = 0; i < simulation.history.length; i++) {
            animationTimeline.to({}, {
                duration: stepDuration,
                onStart: () => {
                    currentStep = i;
                    displayMemory(simulation.history[i]);
                    highlightTimelineStep(i);
                    
                    // Update stats on last step
                    if (i === simulation.history.length - 1) {
                        updateStats(simulation);
                    }
                }
            });
        }
    }
    
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(errorEl);
        
        gsap.from(errorEl, {
            y: -20,
            opacity: 0,
            duration: 0.3
        });
        
        gsap.to(errorEl, {
            y: 20,
            opacity: 0,
            delay: 3,
            duration: 0.3,
            onComplete: () => errorEl.remove()
        });
    }
    
    function showAlert(message) {
        const alertEl = document.createElement('div');
        alertEl.className = 'alert-message';
        alertEl.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(alertEl);
        
        gsap.from(alertEl, {
            y: -20,
            opacity: 0,
            duration: 0.3
        });
        
        gsap.to(alertEl, {
            y: 20,
            opacity: 0,
            delay: 2,
            duration: 0.3,
            onComplete: () => alertEl.remove()
        });
    }
});