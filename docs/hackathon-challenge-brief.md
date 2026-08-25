# Hackathon Challenge Brief: Simplified LCA Comparison Tool

## Context

This hackathon challenges you to build working software using AI coding tools, while minimising the number of tokens you spend doing so. Your solution will be scored on functionality and token efficiency. The challenge is intentionally chosen so that a single well-crafted prompt will not produce a complete solution — you will need to iterate, understand the domain, and make design decisions.

---

## Domain Primer: Life Cycle Assessment (LCA)

Life Cycle Assessment is a standardised methodology (ISO 14040/14044) for measuring the environmental impact of a product across its entire lifespan — from raw material extraction through manufacturing, transport, and use, to end-of-life disposal. Unlike a simple carbon footprint (one number), LCA produces a **profile of impacts across multiple environmental categories**, which means a product can perform better on one dimension and worse on another. There is no automatic winner.

### Key concepts you need to understand

**Functional unit**
The functional unit is the reference against which all impacts are measured. It is not the product itself, but the *service it delivers*. For example, "deliver 1 litre of beverage to a consumer" is a functional unit. If product A is sold in 330ml bottles and product B in 500ml bottles, both must be scaled to the same functional unit before their impacts can be compared. Getting this normalization right is central to the tool.

**Lifecycle stages**
For this challenge, a product's lifecycle is divided into four stages:
- **Raw material extraction** — mining, farming, harvesting of input materials
- **Processing** — refining or transforming raw materials into usable inputs
- **Manufacturing** — assembling the final product
- **Transport** — moving materials and products between stages (expressed per kg·km)

End-of-life is out of scope for this challenge.

**Flows**
Within each lifecycle stage, a product has a set of *flows*: material inputs (e.g. "steel, 2.3 kg"), energy inputs (e.g. "electricity, 0.8 kWh"), and transport inputs (e.g. "road freight, 120 kg·km"). Each flow has a quantity and references a material in the emission factor database.

**Impact categories**
This tool uses three impact categories:

| Category | Unit | What it measures |
|---|---|---|
| Global Warming Potential (GWP) | kg CO₂ equivalent | Climate change contribution |
| Freshwater Eutrophication | kg PO₄ equivalent | Nutrient pollution of waterways |
| Water Consumption | litres | Total freshwater consumed |

**Emission factors**
An emission factor tells you how much environmental impact is caused by one unit of a material or process. For example: 1 kg of primary aluminium production = 8.24 kg CO₂e (GWP). These are looked up from a database — you do not calculate them yourself.

**Impact calculation**
For each flow in each lifecycle stage:

```
impact = quantity × emission_factor
```

Total product impact = sum of all flow impacts across all stages, for each impact category separately.

Normalised impact = total impact ÷ functional unit scaling factor

---

## What You Are Building

A desktop or web application that allows a user to:

1. **Import** a provided data file containing an emission factor database and lifecycle data for two products
2. **View and edit** the lifecycle flows for each product individually
3. **Compare** the normalised environmental impact of both products side by side
4. **Manually enter or edit** any data in the application (products, flows, emission factors)

---

## Provided Data

You will be given a single JSON file at the start of the hackathon containing:

### Emission factor database
A list of materials/processes, each with:
- `id` — unique identifier
- `name` — human-readable name (e.g. "Electricity, grid average, NL")
- `unit` — the unit the factor applies to (e.g. `kg`, `kWh`, `kg·km`)
- `region` — optional geographic variant (`NL`, `EU`, `GLO` for global)
- `gwp` — kg CO₂e per unit
- `eutrophication` — kg PO₄e per unit
- `water` — litres per unit

Note: some materials appear multiple times with different region values. Your tool must handle this — the user should be able to choose which regional variant applies.

### Two product definitions
Each product contains:
- `name`
- `functional_unit` — description of the service delivered (e.g. "1 litre of beverage delivered")
- `functional_unit_quantity` — the quantity of product that delivers one functional unit (e.g. a 330ml bottle has a scaling factor of `1000/330 ≈ 3.03` to reach 1 litre)
- `stages` — an array of lifecycle stages, each containing an array of flows
- Each flow references a material by `id`, specifies a `quantity`, and confirms the `unit`

---

## Functional Requirements

### 1. Import
- Accept the provided JSON file via file picker or drag-and-drop
- Validate the structure on import and surface clear errors if the file is malformed or references unknown material IDs
- After import, all data must be editable within the application

### 2. Product flow view
- For each product, display its lifecycle stages and the flows within each stage
- Show the calculated impact contribution of each flow for all three impact categories
- Show stage subtotals and a product total
- All quantities must be editable; changes must recalculate immediately
- Users must be able to add new flows, remove existing ones, and reassign the material reference

### 3. Emission factor database view
- Display the full list of materials in the database
- Allow users to add, edit, and delete entries
- Where regional variants exist for a material, display them grouped

### 4. Comparison view
- Display both products side by side, normalised to a common functional unit
- For each impact category, clearly indicate which product performs better
- Include a visual element (chart or indicator) that communicates the trade-off: a product that wins on GWP but loses on water should not read as an overall winner
- Display the functional unit and scaling factor for each product so the user understands what they are comparing

### 5. Manual product creation
- Users must be able to create a product from scratch without importing a file
- Required fields: name, functional unit description, functional unit quantity, at least one stage with one flow

---

## Non-Functional Requirements

- The application must run locally without requiring external API calls or cloud services
- All state must persist between sessions (local file or embedded database — your choice)
- The comparison view must remain legible when impact scores differ by several orders of magnitude
- All generated source code must have approximately 80% test coverage

---

## Judging Criteria

| Criterion | Weight |
|---|---|
| Functional completeness (all requirements met) | 40% |
| Token efficiency  | 40% |
| Code quality and maintainability | 10% |
| UX clarity, especially the comparison view | 10% |

The winner is selected based on feature completeness and token efficiency. In the case of a tie, code quality and UX clarity are used as tie breaker criteria.

---

## Out of Scope

- End-of-life / disposal lifecycle stage
- Uncertainty quantification or sensitivity analysis
- Upstream process graph traversal (you use the provided emission factors directly — you do not walk a supply chain graph)
- Multi-user or collaborative features
- Allocation methods other than mass-based
