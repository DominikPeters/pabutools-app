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
        from pabutools.rules import (
            greedy_utilitarian_welfare, method_of_equal_shares, sequential_phragmen,
            completion_by_rule_combination, exhaustion_by_budget_increase,
            max_additive_utilitarian_welfare, MaxAddUtilWelfareAlgo, BudgetAllocation,
        )
        from pabutools.analysis import (
            avg_satisfaction, percent_non_empty_handed, gini_coefficient_of_satisfaction,
            calculate_effective_supports, calculate_project_loss,
        )

        def _pb_outcome_stats(selected_indices):
            sel = [projects[i] for i in selected_indices]
            stats = {"total_cost": int(total_cost(sel)), "budget": int(instance.budget_limit)}
            if profile.num_ballots() > 0:
                stats["pct_non_empty"] = round(float(percent_non_empty_handed(instance, profile, sel)) * 100, 1)
                stats["avg_cost_sat"] = round(float(avg_satisfaction(instance, profile, sel, Cost_Sat)), 2)
                try:
                    stats["gini"] = round(float(gini_coefficient_of_satisfaction(instance, profile, sel, Cost_Sat)), 3)
                except:
                    stats["gini"] = None
            else:
                stats["pct_non_empty"] = None
                stats["avg_cost_sat"] = None
                stats["gini"] = None
            return json.dumps(stats)

        def _pb_mes_trace(sat_class_name="Cost_Sat"):
            sat_class = globals()[sat_class_name]
            try:
                alloc = method_of_equal_shares(instance, profile, sat_class=sat_class, analytics=True)
            except Exception as e:
                return json.dumps({"error": str(e)})
            details = alloc.details
            if details is None or not hasattr(details, "iterations"):
                return json.dumps({"error": "No analytics details available"})

            n = profile.num_ballots()
            initial_budget_per_voter = round(float(instance.budget_limit) / n, 4) if n > 0 else 0
            selected_set = {int(p.name) for p in alloc}

            rounds = []
            for iteration in details.iterations:
                sel = iteration.selected_project
                if sel is None:
                    continue  # final termination iteration has no selected project
                supporters = getattr(sel, "supporter_indices", [])
                n_supporters = sum(details.voter_multiplicity[i] for i in supporters)
                budget_before = iteration.voters_budget
                budget_after = iteration.voters_budget_after_selection
                total_paid = sum(
                    (float(budget_before[i]) - float(budget_after[i])) * details.voter_multiplicity[i]
                    for i in supporters
                ) if budget_before and budget_after else float(sel.cost)
                discarded = [int(pd.project.name) for pd in iteration if pd.discarded]
                rounds.append({
                    "selected": int(sel.name),
                    "cost": float(sel.cost),
                    "n_supporters": int(n_supporters),
                    "avg_payment": round(total_paid / n_supporters, 4) if n_supporters > 0 else 0,
                    "discarded": discarded,
                })

            all_considered = {int(pd.project.name) for iteration in details.iterations for pd in iteration}
            no_supporters = [int(p.name) for p in instance
                             if int(p.name) not in all_considered and int(p.name) not in selected_set]

            project_losses = []
            try:
                for loss in calculate_project_loss(details):
                    proj_name = int(loss.name)
                    if proj_name not in selected_set:
                        lost_to = {int(p.name): round(float(v), 2) for p, v in loss.budget_lost.items()}
                        project_losses.append({
                            "proj": proj_name,
                            "cost": float(loss.cost),
                            "supporters_budget": round(float(loss.supporters_budget), 2),
                            "budget_lost": lost_to,
                            "total_lost": round(float(loss.total_budget_lost()), 2),
                        })
            except:
                pass

            return json.dumps({
                "initial_budget_per_voter": initial_budget_per_voter,
                "n_voters": n,
                "budget": int(instance.budget_limit),
                "rounds": rounds,
                "selected": sorted(selected_set),
                "project_losses": project_losses,
                "no_supporters": no_supporters,
                "sat_class": sat_class_name,
            })
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