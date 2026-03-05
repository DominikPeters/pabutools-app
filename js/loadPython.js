import { calculateRules } from './CalculateRules.js';

export async function loadPython() {
    document.getElementById("loading-container").style.display = "block";
    let loading = document.getElementById("loading-indicator");
    // window.highs = await HiGHS();
    loading.innerHTML = "Loading... (20%)";
    window.pyodide = await loadPyodide();
    loading.innerHTML = "Loading... (30%)";
    await window.pyodide.loadPackage("micropip");
    const micropip = window.pyodide.pyimport("micropip");
    window.micropip = micropip;
    loading.innerHTML = "Loading... (40%)";
    // await micropip.install("/pulp-master/dist/PuLP-2.7.0-py3-none-any.whl?" + Math.random(), keep_going = true);
    // await micropip.install("pip/PuLP-2.7.0-py3-none-any.whl?1", true);
    await micropip.add_mock_package("gurobipy", "10.0.0");
    loading.innerHTML = "Loading... (50%)";
    await micropip.install("numpy", true);
    loading.innerHTML = "Loading... (60%)";
    await micropip.install("gmpy2", true);
    loading.innerHTML = "Loading... (70%)";
    setTimeout(function () {
        loading.innerHTML = "Loading... (80%)";
    }, 300);
    await micropip.install("pip/pabutools-1.2.3-py3-none-any.whl?" + Math.random(), true);
    await window.pyodide.runPython(`
        import js
        import json
        from pabutools.election import *
        from pabutools.election.pabulib import *
        from pabutools.rules import greedy_utilitarian_welfare, method_of_equal_shares, sequential_phragmen, completion_by_rule_combination, exhaustion_by_budget_increase
    `);
    // enable all buttons and inputs
    document.querySelectorAll("button, input").forEach(function (el) {
        el.disabled = false;
    });
    loading.innerHTML = "Loading... (90%)";
    calculateRules();
    loading.innerHTML = "Loading... (100%)";
    // hide loading indicator after 200ms
    setTimeout(function () {
        document.getElementById("loading-container").style.display = "none";
    }, 200);
}