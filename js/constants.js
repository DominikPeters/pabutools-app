export const properties = {}

export const rules = {
    "av": {
        "fullName": "Greedy Utilitarian Welfare",
        "shortName": "Greedy",
        "command": "greedy_utilitarian_welfare(instance, profile, sat_class=Cost_Sat)",
        "active": 1
    },
    "mes": {
        "fullName": "Method of Equal Shares (cost sat., add1u completion)",
        "shortName": "Equal Shares",
        "command": `completion_by_rule_combination(instance, profile, [exhaustion_by_budget_increase, greedy_utilitarian_welfare], [{"rule": method_of_equal_shares, "rule_params": {"sat_class": Cost_Sat}}, {"sat_class": Cost_Sat}])`,
        "active": 1,
        "mesAnalytics": "Cost_Sat",
    },
    "phragmen": {
        "fullName": "Sequential Phragmén",
        "shortName": "Phragmén",
        "command": "sequential_phragmen(instance, profile)",
        "active": 1
    },
    "max_welfare": {
        "fullName": "Max Additive Utilitarian Welfare (cost sat.)",
        "shortName": "Max Welfare",
        "command": "max_additive_utilitarian_welfare(instance, profile, sat_class=Cost_Sat, inner_algo=MaxAddUtilWelfareAlgo.PRIMAL_DUAL)",
        "active": 1
    },
    "av_card": {
        "fullName": "Greedy Utilitarian Welfare (cardinality sat.)",
        "shortName": "Greedy (card.)",
        "command": "greedy_utilitarian_welfare(instance, profile, sat_class=Cardinality_Sat)",
        "active": 1
    },
    "mes_card": {
        "fullName": "Method of Equal Shares (cardinality sat.)",
        "shortName": "Equal Shares (card.)",
        "command": "method_of_equal_shares(instance, profile, sat_class=Cardinality_Sat, voter_budget_increment=1)",
        "active": 1,
        "mesAnalytics": "Cardinality_Sat",
    },
    "av_cc": {
        "fullName": "Greedy Chamberlin-Courant",
        "shortName": "Greedy (CC)",
        "command": "greedy_utilitarian_welfare(instance, profile, sat_class=CC_Sat)",
        "active": 1
    },
    "mes_cc": {
        "fullName": "Method of Equal Shares (CC sat.)",
        "shortName": "Equal Shares (CC)",
        "command": "method_of_equal_shares(instance, profile, sat_class=CC_Sat, voter_budget_increment=1)",
        "active": 1,
        "mesAnalytics": "CC_Sat",
    },
}

export const deleteIconHTML = `<div class="delete-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
    </svg>
</div>`;

export const infoIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
</svg>`;