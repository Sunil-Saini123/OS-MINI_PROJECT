// Define global variables
let processes = [];
let ioInterrupts = [];
let chartInstance = null;
let ganttChartInstance = null;

// Process class definition
class Process {
  constructor(pid, at) {
    this.pid = pid; // Process ID
    this.at = at; // Arrival Time
    this.bt = 0; // total burst time
    this.tat = 0; // Turnaround Time
    this.ct = 0; // Completion Time
    this.wt = 0; // Waiting Time
    this.rt = 0; // remaining time of current CPU burst
    this.remaining_total_time = 0; // total remaining time for all CPU bursts
    this.cpb = []; // CPU bursts queue
    this.iob = []; // IO bursts queue
    this.completed = false;
    this.state = "new"; // Process State
    this.stateHistory = []; // History of state changes
  }

  add_cpb(cpburst) {
    this.cpb.push(cpburst);
    this.bt += cpburst;
    this.remaining_total_time += cpburst;
  }

  add_iob(ioburst) {
    this.iob.push(ioburst);
  }

  // Start the next CPU burst
  startNextBurst() {
    if (this.cpb.length > 0) {
      this.rt = this.cpb.shift();
    } else {
      this.rt = 0;
      this.completed = true;
    }
  }

  // Check if process has more bursts after current I/O
  hasMoreBursts() {
    return this.cpb.length > 0;
  }
}

// IO class definition
class IO {
  constructor(ct, p) {
    this.ioct = ct; // IO completion time
    this.p = p;
  }
}

// Add a new process
function addProcess() {
  const pid = parseInt(document.getElementById("pid").value);
  const at = parseInt(document.getElementById("at").value);
  const bt = parseInt(document.getElementById("bt").value);

  // Validate inputs
  if (isNaN(pid) || isNaN(at) || isNaN(bt)) {
    showToast("Please enter valid numbers for all fields.", "error");
    return;
  }

  if (pid < 1 || at < 0 || bt < 1) {
    showToast(
      "Process ID must be positive, Arrival Time must be non-negative, and Burst Time must be positive.",
      "error"
    );
    return;
  }

  // Check for duplicate process ID
  if (processes.some((p) => p.pid === pid)) {
    showToast("A process with this ID already exists.", "error");
    return;
  }

  // Add new process
  const process = new Process(pid, at);
  process.add_cpb(bt); // Add the CPU burst

  processes.push(process);

  // Update process list display
  updateProcessList();

  // Show success message
  showToast(`Process ${pid} added successfully!`, "success");

  // Clear input fields
  document.getElementById("pid").value = "";
  document.getElementById("at").value = "";
  document.getElementById("bt").value = "";
}

// Add a new IO interrupt and CPU burst for a process
function addIO() {
  const processId = parseInt(document.getElementById("io-pid").value);
  const ioWaitTime = parseInt(document.getElementById("io-wt").value);
  const cpuBurstAfterIO = parseInt(document.getElementById("cpu-after-io").value);

  // Validate inputs
  if (isNaN(processId) || isNaN(ioWaitTime) || isNaN(cpuBurstAfterIO)) {
    showToast("Please enter valid numbers for all fields.", "error");
    return;
  }

  if (processId < 1 || ioWaitTime < 1 || cpuBurstAfterIO < 1) {
    showToast(
      "Process ID, IO Wait Time, and CPU Burst Time must be positive.",
      "error"
    );
    return;
  }

  // Find the process
  const process = processes.find(p => p.pid === processId);
  if (!process) {
    showToast("Process with ID " + processId + " does not exist.", "error");
    return;
  }

  // Add IO burst and CPU burst after IO
  process.add_iob(ioWaitTime);
  process.add_cpb(cpuBurstAfterIO);

  // Update process list display to reflect total burst time
  updateProcessList();

  // Show success message
  showToast(`I/O interrupt added to Process ${processId}!`, "success");

  // Clear input fields
  document.getElementById("io-pid").value = "";
  document.getElementById("io-wt").value = "";
  document.getElementById("cpu-after-io").value = "";
}

function updateProcessList() {
    const processList = document.getElementById("process-list");
  
    if (processes.length === 0) {
      processList.innerHTML =
        "<h3><i class='fas fa-list'></i> Added Processes</h3><p class='empty-message'>No processes added yet. Start by adding a process above!</p>";
      return;
    }
  
    let html = "<h3><i class='fas fa-list'></i> Added Processes</h3><ul>";
    processes.forEach((process) => {
      html += `<li class="process-item">`;
      html += `Process ${process.pid} (AT: ${process.at}) - `;
  
      // Create linked list style for bursts
      const totalBursts = process.cpb.length + process.iob.length;
      let cpbIndex = 0;
      let iobIndex = 0;
  
      while (cpbIndex < process.cpb.length || iobIndex < process.iob.length) {
        if (cpbIndex < process.cpb.length) {
          html += `<span class="burst-node cpu">CPU: ${process.cpb[cpbIndex]}</span>`;
          cpbIndex++;
        }
        if (iobIndex < process.iob.length) {
          html += `<span class="burst-node io">IO: ${process.iob[iobIndex]}</span>`;
          iobIndex++;
        }
      }
  
      html += `<button class="btn btn-danger" onclick="removeProcess(${process.pid})">
                <i class="fas fa-trash-alt"></i> Remove
              </button>`;
      html += `</li>`;
    });
    html += "</ul>";
  
    processList.innerHTML = html;
}

// Remove a process
function removeProcess(pid) {
  processes = processes.filter((p) => p.pid !== pid);
  updateProcessList();
  showToast(`Process ${pid} removed!`, "info");
}

// Start simulation
function startSimulation() {
  if (processes.length === 0) {
    showToast(
      "Please add at least one process before starting the simulation.",
      "error"
    );
    return;
  }

  // Show loading indicator
  document.getElementById("loading").style.display = "block";

  // Use setTimeout to allow the loading indicator to show
  setTimeout(() => {
    try {
      // Reset process states
      processes.forEach((process) => {
        // Reset CPU and IO bursts (create a backup first)
        const cpbBackup = [...process.cpb];
        const iobBackup = [...process.iob];
        
        // Clear the current arrays
        process.cpb = [];
        process.iob = [];
        
        // Reset burst times
        process.bt = 0;
        process.remaining_total_time = 0;
        
        // Re-add the bursts
        cpbBackup.forEach(burst => process.add_cpb(burst));
        iobBackup.forEach(burst => process.add_iob(burst));
        
        // Reset other properties
        process.completed = false;
        process.ct = 0;
        process.tat = 0;
        process.wt = 0;
        process.state = "new";
        process.stateHistory = [];
      });

      // Run PBLE algorithm
      runPBLE();

      // Update results table and charts
      updateTable();
      updateCharts();

      // Switch to the results tab
      openTab(null, 'tabResults');

      // Show success message
      showToast("Simulation completed successfully!", "success");
    } catch (error) {
      console.error("Simulation error:", error);
      showToast("An error occurred during simulation.", "error");
    } finally {
      // Hide loading indicator
      document.getElementById("loading").style.display = "none";
    }
  }, 100);
}

// Load a default example
function loadDefaultExample() {
  // Clear existing data
  processes = [];

  // Add sample processes with CPU and IO bursts
  const p1 = new Process(1, 0);
  p1.add_cpb(3);
  p1.add_iob(2);
  p1.add_cpb(5);
  
  const p2 = new Process(2, 1);
  p2.add_cpb(1);
  
  const p3 = new Process(3, 2);
  p3.add_cpb(2);
  p3.add_iob(3);
  p3.add_cpb(1);
  
  const p4 = new Process(4, 3);
  p4.add_cpb(2);
  
  const p5 = new Process(5, 4);
  p5.add_cpb(4);
  p5.add_iob(1);
  p5.add_cpb(2);
  
  processes.push(p1);
  processes.push(p2);
  processes.push(p3);
  processes.push(p4);
  processes.push(p5);

  // Update displays
  updateProcessList();
  
  // Show confirmation
  showToast("Example processes loaded successfully!", "info");
}

// Reset simulation
function resetSimulation() {
  processes = [];

  // Clear displays
  updateProcessList();

  // Clear results
  document.getElementById("process-table").innerHTML = "";
  document.getElementById("execution-details").innerHTML =
    "<h3><i class='fas fa-code-branch'></i> Step-by-Step Execution</h3><p>Run the simulation to see detailed execution steps.</p>";

  // Destroy charts
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (ganttChartInstance) {
    ganttChartInstance.destroy();
    ganttChartInstance = null;
  }
  
  // Show confirmation
  showToast("Simulation reset complete!", "info");
}

// Tab switching functionality
function openTab(evt, tabName) {
  // Get all tab content and buttons
  const tabContent = document.getElementsByClassName("tab-content");
  const tabButtons = document.getElementsByClassName("tab-btn");

  // Hide all tab content
  for (let i = 0; i < tabContent.length; i++) {
    tabContent[i].classList.remove("active");
  }

  // Remove active class from all buttons
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }

  // Show the selected tab
  document.getElementById(tabName).classList.add("active");
  
  // Add active class to the button that opened the tab (if it exists)
  if (evt) {
    evt.currentTarget.classList.add("active");
  } else {
    // Find the corresponding button for this tab
    for (let i = 0; i < tabButtons.length; i++) {
      if (tabButtons[i].getAttribute("onclick").includes(tabName)) {
        tabButtons[i].classList.add("active");
        break;
      }
    }
  }
}

// Toast notification function
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  
  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 4000);
}

function runPBLE() {
  const executionLog = document.getElementById("execution-details");
  let logContent = "<h3><i class='fas fa-code-branch'></i> Step-by-Step Execution</h3>";
  
  let pq = [...processes].sort((a, b) => a.at - b.at);
  for (let p of pq) {
    p.startNextBurst();
  }
  
  let completed_process = 0;
  let total_tat = 0;
  let total_wt = 0;
  let currentTime = 0;
  let size = pq.length;

  let rq = []; // Ready queue
  let ioq = []; // IO queue
  let currentProcess = null; // Currently running process
  let needReschedule = false; // Flag to indicate we need to reschedule

  while (completed_process < size) {
    logContent += `<p><strong>Time ${currentTime}:</strong> `;
    needReschedule = false;
    
    // Handle arrivals
    while (pq.length > 0 && pq[0].at <= currentTime) {
      const arrivedProcess = pq.shift();
      rq.push(arrivedProcess);
      arrivedProcess.state = "ready";
      arrivedProcess.stateHistory.push({
        startTime: currentTime,
        endTime: null,
        state: "waiting"
      });
      logContent += `Process ${arrivedProcess.pid} arrived with burst ${arrivedProcess.rt}. `;
      if (currentProcess && arrivedProcess.rt < currentProcess.rt) {
        needReschedule = true;
      }
    }

    // Handle IO completions
    ioq.sort((a, b) => a.ioct - b.ioct);
    while (ioq.length > 0 && ioq[0].ioct === 0) {
      let ip = ioq.shift();
      let p = ip.p;
      
      p.stateHistory.forEach(state => {
        if (state.state === "io" && state.endTime === null) {
          state.endTime = currentTime;
        }
      });

      p.startNextBurst();
      
      if (!p.completed) {
        p.state = "ready";
        rq.push(p);
        p.stateHistory.push({
          startTime: currentTime,
          endTime: null,
          state: "waiting"
        });
        
        logContent += `Process ${p.pid} IO completed, back to ready queue with next burst ${p.rt}. `;
        
        // Check if this process should preempt current
        if (currentProcess && p.rt < currentProcess.rt) {
          needReschedule = true;
        }
      } else {
        p.state = "completed";
        completed_process++;
        p.ct = currentTime;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        total_wt += p.wt;
        total_tat += p.tat;
        logContent += `Process ${p.pid} has completed all bursts. `;
      }
    }

    // Decrease IO times
    for (let io of ioq) {
      io.ioct--;
    }

    // Sort ready queue
    rq.sort((a, b) => {
      if (a.rt !== b.rt) return a.rt - b.rt;
      if (a.at !== b.at) return a.at - b.at;
      return a.pid - b.pid;
    });

    // Check if we need to preempt current process
    if (currentProcess && rq.length > 0 && rq[0].rt < currentProcess.rt) {
      needReschedule = true;
    }

    // Handle preemption if needed
    if (needReschedule) {
      if (currentProcess) {
        currentProcess.state = "ready";
        currentProcess.stateHistory.forEach(state => {
          if (state.state === "running" && state.endTime === null) {
            state.endTime = currentTime;
          }
        });
        currentProcess.stateHistory.push({
          startTime: currentTime,
          endTime: null,
          state: "waiting"
        });
        rq.push(currentProcess);
        logContent += `Process ${currentProcess.pid} preempted (remaining: ${currentProcess.rt}). `;
        currentProcess = null;
      }
    }

    // If no process is running, select the next one
    if (!currentProcess && rq.length > 0) {
      currentProcess = rq.shift();
      currentProcess.state = "running";
      currentProcess.stateHistory.forEach(state => {
        if (state.state === "waiting" && state.endTime === null) {
          state.endTime = currentTime;
        }
      });
      currentProcess.stateHistory.push({
        startTime: currentTime,
        endTime: null,
        state: "running"
      });
      logContent += `Process ${currentProcess.pid} is running (remaining: ${currentProcess.rt}). `;
    }

    // Execute current process if exists
    if (currentProcess) {
      currentProcess.rt--;
      currentProcess.remaining_total_time--;
      
      if (currentProcess.rt === 0) {
        currentProcess.stateHistory.forEach(state => {
          if (state.state === "running" && state.endTime === null) {
            state.endTime = currentTime + 1;
          }
        });
        
        if (currentProcess.iob.length > 0) {
          let io_time = currentProcess.iob.shift();
          ioq.push(new IO(io_time, currentProcess));
          currentProcess.state = "blocked";
          currentProcess.stateHistory.push({
            startTime: currentTime + 1,
            endTime: null,
            state: "io"
          });
          logContent += `Process ${currentProcess.pid} needs IO for ${io_time} time units. `;
        } else if (currentProcess.hasMoreBursts()) {
          currentProcess.startNextBurst();
          currentProcess.state = "ready";
          currentProcess.stateHistory.push({
            startTime: currentTime + 1,
            endTime: null,
            state: "waiting"
          });
          rq.push(currentProcess);
          logContent += `Process ${currentProcess.pid} starting next CPU burst (${currentProcess.rt}). `;
        } else {
          currentProcess.state = "completed";
          completed_process++;
          currentProcess.ct = currentTime + 1;
          currentProcess.tat = currentProcess.ct - currentProcess.at;
          currentProcess.wt = currentProcess.tat - currentProcess.bt;
          total_wt += currentProcess.wt;
          total_tat += currentProcess.tat;
          logContent += `Process ${currentProcess.pid} completed. `;
        }
        currentProcess = null;
      }
    } else {
      logContent += `CPU idle.`;
    }

    currentTime++;
    logContent += `</p>`;
  }

  // Ensure all state history entries have end times
  processes.forEach(process => {
    process.stateHistory.forEach(state => {
      if (state.endTime === null) {
        state.endTime = currentTime;
      }
    });
  });

  executionLog.innerHTML = logContent;
  
  console.log("Average Waiting Time: " + (total_wt / size));
  console.log("Average Turnaround Time: " + (total_tat / size));
}

function updateTable() {
  const tableBody = document.getElementById("process-table");
  tableBody.innerHTML = "";
  
  let totalTAT = 0;
  let totalWT = 0;
  
  // Add rows for each process
  processes.forEach(process => {
    totalTAT += process.tat;
    totalWT += process.wt;
    
    const row = `<tr>
        <td>${process.pid}</td>
        <td>${process.at}</td>
        <td>${process.bt}</td>
        <td>${process.ct}</td>
        <td>${process.tat}</td>
        <td>${process.wt}</td>
    </tr>`;
    tableBody.innerHTML += row;
  });
  
  // Add average row if there are processes
  if (processes.length > 0) {
    const avgTAT = (totalTAT / processes.length).toFixed(1);
    const avgWT = (totalWT / processes.length).toFixed(1);
    
    tableBody.innerHTML += `<tr class="summary-row">
        <td colspan="4">Average</td>
        <td>${avgTAT}</td>
        <td>${avgWT}</td>
    </tr>`;
  }
}

function updateCharts() {
  updateMetricsChart();
  updateGanttChart();
}

function updateMetricsChart() {
  const ctx = document.getElementById("executionChart").getContext("2d");
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  // Data for chart
  const labels = processes.map(p => `Process ${p.pid}`);
  const burstTimes = processes.map(p => p.bt);
  const waitingTimes = processes.map(p => p.wt);
  const turnaroundTimes = processes.map(p => p.tat);
  
  // Create chart
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Burst Time',
          data: burstTimes,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Waiting Time',
          data: waitingTimes,
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        },
        {
          label: 'Turnaround Time',
          data: turnaroundTimes,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Processes'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Process Execution Metrics'
        }
      }
    }
  });
}

function updateGanttChart() {
  const ctx = document.getElementById("ganttChart").getContext("2d");
  
  // Destroy existing chart
  if (ganttChartInstance) {
    ganttChartInstance.destroy();
  }
  
  // Find maximum completion time
  const maxTime = Math.max(...processes.map(p => p.ct));
  
  // Create datasets for the Gantt chart
  let datasets = [];
  
  // For each process, create horizontal bars for each state
  processes.forEach(process => {
    // Create bars for each state change
    process.stateHistory.forEach(state => {
      // Skip incomplete records
      if (!state.endTime) return;
      
      // Create bar
      datasets.push({
        label: `P${process.pid} ${state.state}`,
        data: [{
          x: [state.startTime, state.endTime],
          y: `P${process.pid}`,
          state: state.state
        }],
        backgroundColor: getStateColor(state.state),
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.2)'
      });
    });
  });

   // Sort datasets by process number (extracted from the label)
   datasets.sort((a, b) => {
    const pidA = parseInt(a.label.match(/P(\d+)/)[1]);
    const pidB = parseInt(b.label.match(/P(\d+)/)[1]);
    return pidA - pidB;
  });
  
  // Create Gantt chart
  ganttChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: datasets
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: maxTime,
          stacked: false,
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'Processes'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const data = context.raw;
              const state = data.state.charAt(0).toUpperCase() + data.state.slice(1);
              return `${state} from ${data.x[0]} to ${data.x[1]}`;
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });
}

function getStateColor(state) {
  switch(state) {
    case 'running':
      return 'rgba(75, 192, 192, 0.6)';  // Teal
    case 'waiting':
      return 'rgba(255, 206, 86, 0.6)';  // Yellow
    case 'io':
      return 'rgba(255, 99, 132, 0.6)';  // Red
    default:
      return 'rgba(201, 203, 207, 0.6)'; // Gray
  }
}

// Initialize the first tab as active when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Set the Results tab as active by default
  const defaultTab = document.querySelector('.tab-btn');
  if (defaultTab) {
    defaultTab.click();
  }
});