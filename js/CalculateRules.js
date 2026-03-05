import { settings, state } from './globalState.js';
import { rules, properties } from './constants.js';

function computeTiedAllocations() {
    const rule = this.dataset.rule;
    const pre = document.getElementById("committee-info-modal-all-committees");
    pre.innerHTML = "Computing...";
    const btn = this;
    btn.disabled = true;
    setTimeout(() => {
        try {
            const result = _calculateRule(rule, true);
            if (result.length === 0) {
                pre.innerHTML = "(none found)";
            } else {
                pre.innerHTML = result.map(alloc => "{" + alloc.map(i => `P${i+1}`).join(", ") + "}").join("\n");
            }
        } catch (e) {
            pre.innerHTML = `Error: ${e.message}`;
        }
        btn.disabled = false;
    }, 0);
}

function computeMESAnalytics() {
    const rule = this.dataset.rule;
    const satClass = rules[rule].mesAnalytics === true ? "Cost_Sat"
        : (rules[rule].mesAnalytics || "Cost_Sat");
    const btn = this;
    btn.disabled = true;
    btn.textContent = "Computing...";
    const contentDiv = document.getElementById("mes-analytics-content");
    contentDiv.innerHTML = "";
    setTimeout(() => {
        try {
            const traceJson = window.pyodide.runPython(`_pb_mes_trace("${satClass}")`);
            const trace = JSON.parse(traceJson);
            if (trace.error) {
                contentDiv.innerHTML = `<span style="color:red">Error: ${trace.error}</span>`;
                btn.disabled = false;
                btn.textContent = "Recompute";
                return;
            }

            const selectedByBase = new Set(trace.selected);
            const selectedByRule = new Set(state.storedCommittee[rule] || []);
            const addedByCompletion = [...selectedByRule].filter(i => !selectedByBase.has(i));

            let html = `<p class="mes-analytics-note" style="margin-bottom:0.5em">`;
            html += `Initial budget per voter: <strong>${trace.initial_budget_per_voter}</strong>`;
            html += ` (= ${trace.budget} / ${trace.n_voters})`;
            if (satClass !== "Cost_Sat") html += ` &middot; satisfaction: ${satClass}`;
            html += `</p>`;

            if (trace.rounds.length === 0) {
                html += `<p class="mes-analytics-note">Base MES selected no projects.</p>`;
            } else {
                html += `<table class="mes-analytics-table"><thead><tr>`;
                html += `<th>Round</th><th>Selected</th><th>Cost</th><th>Supporters</th><th>Avg paid</th><th>Eliminated</th>`;
                html += `</tr></thead><tbody>`;
                for (let r = 0; r < trace.rounds.length; r++) {
                    const round = trace.rounds[r];
                    const pLabel = `P${round.selected + 1}`;
                    const elim = round.discarded.length > 0
                        ? round.discarded.map(i => `P${i+1}`).join(", ")
                        : `<span class="stat-hint">—</span>`;
                    html += `<tr>`;
                    html += `<td>${r + 1}</td>`;
                    html += `<td class="mes-selected-yes">${pLabel}</td>`;
                    html += `<td>${round.cost}</td>`;
                    html += `<td>${round.n_supporters} / ${trace.n_voters}</td>`;
                    html += `<td>${round.avg_payment.toFixed(2)}</td>`;
                    html += `<td>${elim}</td>`;
                    html += `</tr>`;
                }
                html += `</tbody></table>`;
                const baseList = trace.selected.map(i => `P${i+1}`).join(", ") || "(none)";
                html += `<p class="mes-analytics-note" style="margin-top:0.4em">Base MES outcome: <strong>${baseList}</strong>`;
                if (addedByCompletion.length > 0) {
                    html += ` &nbsp;+&nbsp; <span style="color:#888">completion added: ${addedByCompletion.map(i=>`P${i+1}`).join(", ")}</span>`;
                }
                html += `</p>`;
            }

            const lostProjects = trace.project_losses.filter(l => !selectedByBase.has(l.proj));
            const noSupp = trace.no_supporters;
            if (lostProjects.length > 0 || noSupp.length > 0) {
                html += `<p class="mes-analytics-note" style="margin-top:0.8em; margin-bottom:0.3em"><strong>Why weren't other projects selected?</strong></p>`;
                html += `<table class="mes-analytics-table"><thead><tr>`;
                html += `<th>Project</th><th>Cost</th><th>Supporters had</th><th>Spent on others</th><th>Left</th><th>Reason</th>`;
                html += `</tr></thead><tbody>`;
                for (const loss of lostProjects) {
                    const remaining = loss.supporters_budget - loss.total_lost;
                    const spentOn = Object.entries(loss.budget_lost)
                        .map(([p, v]) => `P${parseInt(p)+1}: ${v}`)
                        .join(", ");
                    const reason = remaining < loss.cost
                        ? `<span class="mes-sup-low">budget exhausted</span>`
                        : `<span class="mes-sup-mid">not cheapest per vote</span>`;
                    html += `<tr>`;
                    html += `<td>P${loss.proj + 1}</td>`;
                    html += `<td>${loss.cost}</td>`;
                    html += `<td>${loss.supporters_budget}</td>`;
                    html += `<td>${spentOn || `<span class="stat-hint">—</span>`}</td>`;
                    html += `<td>${remaining.toFixed(2)}</td>`;
                    html += `<td>${reason}</td>`;
                    html += `</tr>`;
                }
                for (const proj of noSupp) {
                    html += `<tr>`;
                    html += `<td>P${proj + 1}</td>`;
                    html += `<td>${state.cost[proj]}</td>`;
                    html += `<td colspan="3"><span class="stat-hint">—</span></td>`;
                    html += `<td><span class="mes-sup-low">no supporters</span></td>`;
                    html += `</tr>`;
                }
                html += `</tbody></table>`;
            }

            contentDiv.innerHTML = html;
        } catch (e) {
            contentDiv.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
        }
        btn.disabled = false;
        btn.textContent = "Recompute";
    }, 0);
}

function populateCommitteeInfoModal(rule) {
    document.getElementById("committee-info-modal-rule-name").textContent = rules[rule].fullName;

    const statsDiv = document.getElementById("committee-info-stats");
    const selectedIndices = state.storedCommittee[rule] || [];
    try {
        const statsJson = window.pyodide.runPython(
            `_pb_outcome_stats(${JSON.stringify(selectedIndices)})`
        );
        const stats = JSON.parse(statsJson);
        const pctBudget = stats.budget > 0 ? Math.round(stats.total_cost / stats.budget * 100) : 0;
        const projList = selectedIndices.length > 0
            ? selectedIndices.map(i => `P${i+1} (cost&nbsp;${state.cost[i]})`).join(", ")
            : "(none)";
        let html = `<table class="outcome-stats-table">`;
        html += `<tr><td>Selected projects</td><td>${projList}</td></tr>`;
        html += `<tr><td>Budget used</td><td>${stats.total_cost} / ${stats.budget} (${pctBudget}%)</td></tr>`;
        if (stats.pct_non_empty !== null) {
            html += `<tr><td>Non-empty-handed voters</td><td>${stats.pct_non_empty}%</td></tr>`;
            html += `<tr><td>Avg cost satisfaction</td><td>${stats.avg_cost_sat}</td></tr>`;
            if (stats.gini !== null) {
                html += `<tr><td>Satisfaction Gini</td><td>${stats.gini} <span class="stat-hint">(0&nbsp;=&nbsp;perfectly&nbsp;equal)</span></td></tr>`;
            }
        }
        html += `</table>`;
        statsDiv.innerHTML = html;
    } catch (e) {
        statsDiv.innerHTML = `<p style="color:red">Error computing stats: ${e.message}</p>`;
    }

    const mesSection = document.getElementById("mes-analytics-section");
    const mesBtn = document.getElementById("compute-mes-analytics-button");
    if (rules[rule].mesAnalytics) {
        mesSection.style.display = "block";
        mesBtn.dataset.rule = rule;
        mesBtn.disabled = false;
        mesBtn.textContent = "Compute";
        mesBtn.onclick = computeMESAnalytics;
        document.getElementById("mes-analytics-content").innerHTML = "";
    } else {
        mesSection.style.display = "none";
    }

    const tiedBtn = document.getElementById("compute-tied-allocations-button");
    tiedBtn.dataset.rule = rule;
    tiedBtn.disabled = false;
    tiedBtn.textContent = "Compute";
    tiedBtn.onclick = computeTiedAllocations;
    document.getElementById("committee-info-modal-all-committees").innerHTML = "";
}

function _calculateRule(rule, forceIrresolute = false) {
    let result;
    if (settings.resolute && !forceIrresolute) {
        result = window.pyodide.runPython(`
            committee = ${rules[rule].command}
            results = [[int(c.name) for c in committee]]
            json.dumps(results)
        `);
    } else {
        result = window.pyodide.runPython(`
            committees = ${rules[rule].command.replace(")", ", resoluteness=False)")}
            results = [[int(c.name) for c in committee] for committee in committees]
            json.dumps(results)
        `);
    }
    return JSON.parse(result);
}

export async function calculateRules() {
    if (!settings.liveMode) {
        return;
    }
    let profileString = "[";
    for (let i of state.N) {
        let voterString = "ApprovalBallot([";
        let ballotIsEmpty = true;   
        for (let j of state.C) {
            if (state.u[j][i] == 1) {
                voterString += `projects[${j}],`;
                ballotIsEmpty = false;
            }
        }
        if (!ballotIsEmpty) {
            voterString = voterString.slice(0, -1); // remove trailing comma
        }
        voterString += "])";
        profileString += voterString + ",";
    }
    profileString = profileString.slice(0, -1) + "]"; // remove trailing comma
    window.pyodide.runPython(`
        costs = ${JSON.stringify(state.C.map(c => state.cost[c]))}
        projects = {c : Project(str(c), costs[c]) for c in range(${state.C.length})}
        instance = Instance()
        instance.update(projects.values())
        instance.project_meta = {projects[c] : {} for c in range(${state.C.length})}
        instance.meta["description"] = "Exported instance from https://pref.tools/pabutools"
        instance.meta["country"] = "N/A"
        instance.meta["unit"] = "N/A"
        instance.meta["instance"] = "N/A"
        instance.meta["rule"] = "N/A"
        instance.budget_limit = ${state.budget}
        profile = ApprovalProfile(${profileString})
    `);
    let table = document.getElementById("profile-table");
    let tBody = table.getElementsByTagName("tbody")[0];
    for (let rule in rules) {
        if (!rules[rule].active) {
            continue;
        }
        if (settings.resolute) {
            setTimeout(() => {
                let result = _calculateRule(rule);
                for (let committee of result) {
                    state.storedCommittee[rule] = committee;
                    for (let j of state.C) {
                        let cell = document.getElementById("rule-" + rule + "-candidate-" + j + "-cell");
                        if (committee.includes(j)) {
                            cell.innerHTML = "✓";
                            cell.classList.add("in-committee");
                        } else {
                            cell.innerHTML = "";
                            cell.classList.add("not-in-committee");
                        }
                    }
                }
                let row = document.getElementById("rule-" + rule + "-row");
                row.dataset.hystmodal = "#committee-info-modal";
                row.onclick = function () {
                    populateCommitteeInfoModal(rule);
                };
                if (settings.showPropertyinTable) {
                    setTimeout(() => {
                        let cell = document.getElementById("rule-" + rule + "-property-cell");
                        let result = window.pyodide.runPython(`
                            properties.check("${settings.showPropertyinTable}", profile, ${JSON.stringify(state.storedCommittee[rule])})
                        `);
                        if (result) {
                            let span = document.createElement("span");
                            span.classList.add("property-cell-satisfied");
                            span.innerHTML = "✓ " + properties[settings.showPropertyinTable].shortName;
                            cell.appendChild(span);
                        } else {
                            let span = document.createElement("span");
                            span.classList.add("property-cell-failed");
                            span.innerHTML = "✗ " + properties[settings.showPropertyinTable].shortName;
                            cell.appendChild(span);
                        }
                    }, 0);
                }
            }, 0);
        } else {
            let result = await _calculateRule(rule);
            // add to table
            for (let committee of result) {
                // need to add rows
                let row = tBody.insertRow();
                let cell = row.insertCell();
                let span = document.createElement("span");
                span.innerHTML = rules[rule].shortName;
                tippy(span, {
                    content: rules[rule].fullName,
                    theme: "light",
                });
                cell.appendChild(span);
                for (let j of state.C) {
                    let cell = row.insertCell();
                    if (committee.includes(j)) {
                        cell.innerHTML = "✓";
                    } else {
                        cell.innerHTML = "";
                    }
                }
            }
        }
    }
    return true;
}