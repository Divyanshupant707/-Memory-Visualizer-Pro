# Memory Visualizer Pro

Memory Visualizer Pro is an interactive, web-based tool designed to simulate and visualize Operating System (OS) page replacement algorithms. It provides an intuitive interface to help students and developers visualize memory states, track real-time statistics (hits, faults, rates), and step through reference strings to understand how virtual memory allocation works under the hood.

<img width="1897" height="960" alt="image" src="https://github.com/user-attachments/assets/0f586d41-729d-4d9f-bef2-18b7a17b2ceb" />


## 🚀 Features

* **Algorithm Selection:** Simulate standard page replacement policies (such as FIFO).
* **Interactive Timeline:** Track every historical reference sequentially, highlighting hits vs. faults clearly with distinctive color coding.
* **Live Memory State:** View the exact contents of active frames (e.g., Frame 0, Frame 1, Frame 2) at any given moment.
* **Real-time Statistics:** Get instant metrics including:
  * Total References
  * Page Hits
  * Page Faults
  * Fault Rate (visualized via a dynamic doughnut chart)
* **Simulation Controls:** Adjust the number of frames, simulation execution speed, and custom page reference strings.
* **Control Modes:** Run the simulation automatically (`Run`), walk through step-by-step (`Step`), or clear everything (`Reset`).
* **Virtual Memory Assistant:** Built-in floating chat panel helper to assist users during simulations.
* **Theme Support:** Supports both light and dark mode switching.

## 📁 Repository Structure

As shown in `image_dc8b22.png`, this lightweight project is built natively using core web technologies without any heavy frameworks:

* `index.html` - The core skeletal structure and UI dashboard layouts.
* `style.css` - Modern, clean, dashboard-themed styling (with dark/light mode rules).
* `script.js` - Core simulation logic, state management, charts, and algorithm execution.

## 🛠️ Getting Started

Since this project relies completely on standard frontend technologies, there is no build process or installation required.

### Prerequisites
Any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, etc.).

### Local Setup
1. **Clone the repository:**
```bash
   git clone [https://github.com/Divyanshupant707/Memory-Visualizer-Pro.git](https://github.com/Divyanshupant707/Memory-Visualizer-Pro.git)
