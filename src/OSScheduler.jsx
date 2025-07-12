import React, { useState, useEffect } from "react";
import {
  Play,
  Plus,
  Trash2,
  BarChart3,
  Clock,
  Zap,
  Moon,
  Sun,
} from "lucide-react";

const OSScheduler = () => {
  const [processes, setProcesses] = useState([
    { id: 1, name: "P1", arrivalTime: 0, burstTime: 5, priority: 2 },
    { id: 2, name: "P2", arrivalTime: 1, burstTime: 3, priority: 1 },
    { id: 3, name: "P3", arrivalTime: 2, burstTime: 8, priority: 3 },
  ]);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState("FCFS");
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [results, setResults] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("osSchedulerTheme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("osSchedulerTheme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const algorithms = [
    {
      id: "FCFS",
      name: "First Come First Serve",
      needsPriority: false,
      needsQuantum: false,
    },
    {
      id: "SJF",
      name: "Shortest Job First",
      needsPriority: false,
      needsQuantum: false,
    },
    {
      id: "SRTF",
      name: "Shortest Remaining Time First",
      needsPriority: false,
      needsQuantum: false,
    },
    {
      id: "Priority",
      name: "Priority Scheduling",
      needsPriority: true,
      needsQuantum: false,
    },
    { id: "RR", name: "Round Robin", needsPriority: false, needsQuantum: true },
  ];

  const addProcess = () => {
    const newId = Math.max(...processes.map((p) => p.id), 0) + 1;
    setProcesses([
      ...processes,
      {
        id: newId,
        name: `P${newId}`,
        arrivalTime: 0,
        burstTime: 1,
        priority: 1,
      },
    ]);
  };

  const removeProcess = (id) => {
    setProcesses(processes.filter((p) => p.id !== id));
  };

  const updateProcess = (id, field, value) => {
    setProcesses(
      processes.map((p) =>
        p.id === id ? { ...p, [field]: parseInt(value) || 0 } : p
      )
    );
  };

  const updateProcessName = (id, name) => {
    setProcesses(processes.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  // FCFS Algorithm
  const fcfs = (procs) => {
    const sorted = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const gantt = [];
    const processResults = [];

    sorted.forEach((process) => {
      if (currentTime < process.arrivalTime) {
        gantt.push({
          name: "Idle",
          start: currentTime,
          end: process.arrivalTime,
          color: isDarkMode ? "#374151" : "#e5e7eb",
        });
        currentTime = process.arrivalTime;
      }

      const startTime = currentTime;
      const endTime = currentTime + process.burstTime;
      const waitingTime = startTime - process.arrivalTime;
      const turnaroundTime = endTime - process.arrivalTime;

      gantt.push({
        name: process.name,
        start: startTime,
        end: endTime,
        color: getProcessColor(process.id),
      });

      processResults.push({
        ...process,
        startTime,
        endTime,
        waitingTime,
        turnaroundTime,
      });

      currentTime = endTime;
    });

    return { gantt, processResults };
  };

  // SJF Algorithm
  const sjf = (procs) => {
    const gantt = [];
    const processResults = [];
    let currentTime = 0;
    const remaining = [...procs];

    while (remaining.length > 0) {
      const available = remaining.filter((p) => p.arrivalTime <= currentTime);

      if (available.length === 0) {
        const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
        gantt.push({
          name: "Idle",
          start: currentTime,
          end: nextArrival,
          color: isDarkMode ? "#374151" : "#e5e7eb",
        });
        currentTime = nextArrival;
        continue;
      }

      const shortest = available.reduce((min, p) =>
        p.burstTime < min.burstTime ? p : min
      );

      const startTime = currentTime;
      const endTime = currentTime + shortest.burstTime;
      const waitingTime = startTime - shortest.arrivalTime;
      const turnaroundTime = endTime - shortest.arrivalTime;

      gantt.push({
        name: shortest.name,
        start: startTime,
        end: endTime,
        color: getProcessColor(shortest.id),
      });

      processResults.push({
        ...shortest,
        startTime,
        endTime,
        waitingTime,
        turnaroundTime,
      });

      currentTime = endTime;
      remaining.splice(remaining.indexOf(shortest), 1);
    }

    return { gantt, processResults };
  };

  // SRTF Algorithm
  const srtf = (procs) => {
    const gantt = [];
    const processResults = [];
    let currentTime = 0;
    const remaining = procs.map((p) => ({
      ...p,
      remainingTime: p.burstTime,
      startTime: null,
    }));

    while (remaining.some((p) => p.remainingTime > 0)) {
      const available = remaining.filter(
        (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
      );

      if (available.length === 0) {
        const nextArrival = Math.min(
          ...remaining
            .filter((p) => p.remainingTime > 0)
            .map((p) => p.arrivalTime)
        );
        gantt.push({
          name: "Idle",
          start: currentTime,
          end: nextArrival,
          color: isDarkMode ? "#374151" : "#e5e7eb",
        });
        currentTime = nextArrival;
        continue;
      }

      const shortest = available.reduce((min, p) =>
        p.remainingTime < min.remainingTime ? p : min
      );

      if (shortest.startTime === null) {
        shortest.startTime = currentTime;
      }

      const executeTime = 1;
      shortest.remainingTime -= executeTime;

      if (gantt.length > 0 && gantt[gantt.length - 1].name === shortest.name) {
        gantt[gantt.length - 1].end = currentTime + executeTime;
      } else {
        gantt.push({
          name: shortest.name,
          start: currentTime,
          end: currentTime + executeTime,
          color: getProcessColor(shortest.id),
        });
      }

      currentTime += executeTime;

      if (shortest.remainingTime === 0) {
        const endTime = currentTime;
        const waitingTime = endTime - shortest.arrivalTime - shortest.burstTime;
        const turnaroundTime = endTime - shortest.arrivalTime;

        processResults.push({
          ...shortest,
          endTime,
          waitingTime,
          turnaroundTime,
        });
      }
    }

    return { gantt, processResults };
  };

  // Priority Algorithm
  const priority = (procs) => {
    const gantt = [];
    const processResults = [];
    let currentTime = 0;
    const remaining = [...procs];

    while (remaining.length > 0) {
      const available = remaining.filter((p) => p.arrivalTime <= currentTime);

      if (available.length === 0) {
        const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
        gantt.push({
          name: "Idle",
          start: currentTime,
          end: nextArrival,
          color: isDarkMode ? "#374151" : "#e5e7eb",
        });
        currentTime = nextArrival;
        continue;
      }

      const highest = available.reduce(
        (max, p) => (p.priority < max.priority ? p : max) // Lower number = higher priority
      );

      const startTime = currentTime;
      const endTime = currentTime + highest.burstTime;
      const waitingTime = startTime - highest.arrivalTime;
      const turnaroundTime = endTime - highest.arrivalTime;

      gantt.push({
        name: highest.name,
        start: startTime,
        end: endTime,
        color: getProcessColor(highest.id),
      });

      processResults.push({
        ...highest,
        startTime,
        endTime,
        waitingTime,
        turnaroundTime,
      });

      currentTime = endTime;
      remaining.splice(remaining.indexOf(highest), 1);
    }

    return { gantt, processResults };
  };

  // Round Robin Algorithm
  const roundRobin = (procs, quantum) => {
    const gantt = [];
    const processResults = [];
    let currentTime = 0;
    const queue = [];
    const remaining = procs.map((p) => ({
      ...p,
      remainingTime: p.burstTime,
      startTime: null,
    }));
    const arrived = [];

    while (remaining.some((p) => p.remainingTime > 0) || queue.length > 0) {
      // Add newly arrived processes to queue
      remaining.forEach((p) => {
        if (
          p.arrivalTime <= currentTime &&
          !arrived.includes(p.id) &&
          p.remainingTime > 0
        ) {
          queue.push(p);
          arrived.push(p.id);
        }
      });

      if (queue.length === 0) {
        const nextArrival = Math.min(
          ...remaining
            .filter((p) => p.remainingTime > 0)
            .map((p) => p.arrivalTime)
        );
        gantt.push({
          name: "Idle",
          start: currentTime,
          end: nextArrival,
          color: isDarkMode ? "#374151" : "#e5e7eb",
        });
        currentTime = nextArrival;
        continue;
      }

      const current = queue.shift();
      if (current.startTime === null) {
        current.startTime = currentTime;
      }

      const executeTime = Math.min(quantum, current.remainingTime);
      current.remainingTime -= executeTime;

      gantt.push({
        name: current.name,
        start: currentTime,
        end: currentTime + executeTime,
        color: getProcessColor(current.id),
      });

      currentTime += executeTime;

      // Add newly arrived processes during execution
      remaining.forEach((p) => {
        if (
          p.arrivalTime <= currentTime &&
          !arrived.includes(p.id) &&
          p.remainingTime > 0
        ) {
          queue.push(p);
          arrived.push(p.id);
        }
      });

      if (current.remainingTime > 0) {
        queue.push(current);
      } else {
        const endTime = currentTime;
        const waitingTime = endTime - current.arrivalTime - current.burstTime;
        const turnaroundTime = endTime - current.arrivalTime;

        processResults.push({
          ...current,
          endTime,
          waitingTime,
          turnaroundTime,
        });
      }
    }

    return { gantt, processResults };
  };

  const getProcessColor = (id) => {
    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#f97316",
      "#06b6d4",
      "#84cc16",
    ];
    return colors[id % colors.length];
  };

  const executeAlgorithm = (algorithm) => {
    if (processes.length === 0) return null;

    switch (algorithm) {
      case "FCFS":
        return fcfs(processes);
      case "SJF":
        return sjf(processes);
      case "SRTF":
        return srtf(processes);
      case "Priority":
        return priority(processes);
      case "RR":
        return roundRobin(processes, timeQuantum);
      default:
        return null;
    }
  };

  const simulate = () => {
    const result = executeAlgorithm(selectedAlgorithm);
    setResults(result);

    // Generate comparison with all algorithms
    const comp = {};
    algorithms.forEach((alg) => {
      const algResult = executeAlgorithm(alg.id);
      if (algResult) {
        const avgWaiting =
          algResult.processResults.reduce((sum, p) => sum + p.waitingTime, 0) /
          algResult.processResults.length;
        const avgTurnaround =
          algResult.processResults.reduce(
            (sum, p) => sum + p.turnaroundTime,
            0
          ) / algResult.processResults.length;
        comp[alg.id] = {
          name: alg.name,
          avgWaiting: avgWaiting.toFixed(2),
          avgTurnaround: avgTurnaround.toFixed(2),
        };
      }
    });
    setComparison(comp);
  };

  const GanttChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxTime = Math.max(...data.map((item) => item.end));
    const scale = Math.max(600 / maxTime, 20);

    return (
      <div
        className={`p-6 rounded-lg shadow-lg transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3
          className={`text-xl font-bold mb-4 flex items-center gap-2 ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          Gantt Chart
        </h3>
        <div className="overflow-x-auto">
          <div
            className="flex items-center mb-4"
            style={{ minWidth: `${maxTime * scale}px` }}
          >
            {data.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-white font-semibold text-sm border-r border-gray-300 relative"
                style={{
                  width: `${(item.end - item.start) * scale}px`,
                  height: "50px",
                  backgroundColor: item.color,
                  minWidth: "30px",
                }}
              >
                {item.name}
                <div
                  className={`absolute -bottom-6 left-0 text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {item.start}
                </div>
              </div>
            ))}
            <div
              className={`text-xs ml-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {maxTime}
            </div>
          </div>
          <div
            className={`flex text-xs mt-8 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <div className="mr-4">Time →</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      } p-6`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1
              className={`text-4xl font-bold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              OS Scheduling Algorithms
            </h1>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              } shadow-lg`}
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Simulate and compare different CPU scheduling algorithms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Process Input */}
          <div
            className={`lg:col-span-2 p-6 rounded-lg shadow-lg transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Process Input
              </h2>
              <button
                onClick={addProcess}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Process
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Process
                    </th>
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Arrival Time
                    </th>
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Burst Time
                    </th>
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Priority
                    </th>
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => (
                    <tr
                      key={process.id}
                      className={`${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <td
                        className={`border p-3 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <input
                          type="text"
                          value={process.name}
                          onChange={(e) =>
                            updateProcessName(process.id, e.target.value)
                          }
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                        />
                      </td>
                      <td
                        className={`border p-3 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          value={process.arrivalTime}
                          onChange={(e) =>
                            updateProcess(
                              process.id,
                              "arrivalTime",
                              e.target.value
                            )
                          }
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                        />
                      </td>
                      <td
                        className={`border p-3 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <input
                          type="number"
                          min="1"
                          value={process.burstTime}
                          onChange={(e) =>
                            updateProcess(
                              process.id,
                              "burstTime",
                              e.target.value
                            )
                          }
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                        />
                      </td>
                      <td
                        className={`border p-3 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <input
                          type="number"
                          min="1"
                          value={process.priority}
                          onChange={(e) =>
                            updateProcess(
                              process.id,
                              "priority",
                              e.target.value
                            )
                          }
                          className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                        />
                      </td>
                      <td
                        className={`border p-3 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <button
                          onClick={() => removeProcess(process.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          disabled={processes.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Algorithm Selection */}
          <div
            className={`p-6 rounded-lg shadow-lg transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Algorithm Selection
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Scheduling Algorithm
                </label>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {algorithms.map((alg) => (
                    <option key={alg.id} value={alg.id}>
                      {alg.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAlgorithm === "RR" && (
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Time Quantum
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={timeQuantum}
                    onChange={(e) =>
                      setTimeQuantum(parseInt(e.target.value) || 1)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>
              )}

              <button
                onClick={simulate}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Simulate
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            <GanttChart data={results.gantt} />

            {/* Process Results Table */}
            <div
              className={`p-6 rounded-lg shadow-lg transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                <Clock className="w-5 h-5" />
                Process Results
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr
                      className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                    >
                      <th
                        className={`border p-3 text-left ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        Process
                      </th>
                      <th
                        className={`border p-3 text-left ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        Arrival Time
                      </th>
                      <th
                        className={`border p-3 text-left ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        Burst Time
                      </th>
                      <th
                        className={`border p-3 text-left ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        Start Time
                      </th>
                      <th
                        className={`border p-3 text-left ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        End Time
                      </th>
                      <th
                        className={`border p-3 text-left ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        Waiting Time
                      </th>
                      <th
                        className={`border p-3 text-left ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        Turnaround Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.processResults.map((process) => (
                      <tr
                        key={process.id}
                        className={`${
                          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        } transition-colors`}
                      >
                        <td
                          className={`border p-3 font-medium ${
                            isDarkMode
                              ? "border-gray-600 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {process.name}
                        </td>
                        <td
                          className={`border p-3 ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300"
                              : "border-gray-300"
                          }`}
                        >
                          {process.arrivalTime}
                        </td>
                        <td
                          className={`border p-3 ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300"
                              : "border-gray-300"
                          }`}
                        >
                          {process.burstTime}
                        </td>
                        <td
                          className={`border p-3 ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300"
                              : "border-gray-300"
                          }`}
                        >
                          {process.startTime}
                        </td>
                        <td
                          className={`border p-3 ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300"
                              : "border-gray-300"
                          }`}
                        >
                          {process.endTime}
                        </td>
                        <td
                          className={`border p-3 ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300"
                              : "border-gray-300"
                          }`}
                        >
                          {process.waitingTime}
                        </td>
                        <td
                          className={`border p-3 ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300"
                              : "border-gray-300"
                          }`}
                        >
                          {process.turnaroundTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className={`mt-4 p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-blue-50"
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-800"
                    }`}
                  >
                    <strong>Average Waiting Time:</strong>{" "}
                    {(
                      results.processResults.reduce(
                        (sum, p) => sum + p.waitingTime,
                        0
                      ) / results.processResults.length
                    ).toFixed(2)}
                  </div>
                  <div
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-800"
                    }`}
                  >
                    <strong>Average Turnaround Time:</strong>{" "}
                    {(
                      results.processResults.reduce(
                        (sum, p) => sum + p.turnaroundTime,
                        0
                      ) / results.processResults.length
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Comparison */}
        {comparison && (
          <div
            className={`mt-6 p-6 rounded-lg shadow-lg transition-colors duration-300 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3
              className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              <Zap className="w-5 h-5" />
              Algorithm Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Algorithm
                    </th>
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Average Waiting Time
                    </th>
                    <th
                      className={`border p-3 text-left ${
                        isDarkMode
                          ? "border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      Average Turnaround Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(comparison).map(([key, data]) => (
                    <tr
                      key={key}
                      className={
                        selectedAlgorithm === key
                          ? isDarkMode
                            ? "bg-blue-900"
                            : "bg-blue-50"
                          : isDarkMode
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td
                        className={`border p-3 font-medium ${
                          isDarkMode
                            ? "border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {data.name}
                        {selectedAlgorithm === key && (
                          <span
                            className={`ml-2 text-sm ${
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          >
                            (Selected)
                          </span>
                        )}
                      </td>
                      <td
                        className={`border p-3 ${
                          isDarkMode
                            ? "border-gray-600 text-gray-300"
                            : "border-gray-300"
                        }`}
                      >
                        {data.avgWaiting}
                      </td>
                      <td
                        className={`border p-3 ${
                          isDarkMode
                            ? "border-gray-600 text-gray-300"
                            : "border-gray-300"
                        }`}
                      >
                        {data.avgTurnaround}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OSScheduler;
