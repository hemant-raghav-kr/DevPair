# DevPair AI Team & Project Matching Engine — Machine Learning Subsystem

This directory contains the machine learning training, evaluation, and serialization pipeline for DevPair's intelligent team and project matching engine.

---

## 1. Problem Formulation

DevPair matches college students to open project roles. The core question is:

$$\text{Given a candidate student } S \text{ and an open project role } R \text{ within project } P \text{, what is the probability } P(\text{good\_match} \mid S, R, P) \text{?}$$

### Output
1. **Match Probability**: $P \in [0.0, 1.0]$.
2. **Compatibility Score**: $\text{Score} = \text{round}(P \times 100) \in [0, 100]$.
3. **Quality & Fit Level**: Tiered rating (`Exceptional Fit`, `Strong Fit`, `Moderate Fit`, `Developing Fit`).
4. **Explainable Matching Factors**: Human-readable strengths (`✓ ...`) and growth/gap areas (`△ ...`) derived directly from feature attributions and values.

---

## 2. Feature Engineering

All features are strictly derived from DevPair's relational schema (`profiles`, `skills`, `user_skills`, `projects`, `project_roles`):

| Feature Name | Description | Range | Schema Sources |
|---|---|---|---|
| `required_skill_match` | Binary indicator whether candidate has role's required skill | $0.0$ or $1.0$ | `project_roles.required_skill_id`, `user_skills.skill_id` |
| `required_skill_proficiency` | Normalized proficiency in required skill (beginner=0.333, intermediate=0.667, advanced=1.0) | $[0.0, 1.0]$ | `user_skills.proficiency` |
| `skill_category_overlap_ratio` | Proportion of student's skills sharing the category of the required skill | $[0.0, 1.0]$ | `skills.category`, `user_skills` |
| `project_category_alignment` | Domain alignment between student skill portfolio and project category | $[0.0, 1.0]$ | `projects.category`, `skills.category` |
| `availability_fit` | Ratio of student weekly availability to role intensity expectation (10h standard, 15h hackathon) | $[0.0, 1.0]$ | `profiles.availability_hours_per_week`, `projects.is_hackathon` |
| `total_skills_count_norm` | Breadth of technical toolkit: $\min(\text{skills\_count} / 10.0, 1.0)$ | $[0.0, 1.0]$ | `user_skills` count |
| `avg_skill_proficiency` | Mean proficiency score across all student skills | $[0.0, 1.0]$ | `user_skills.proficiency` |
| `advanced_skills_count_norm` | Proportion of verified skills at Advanced proficiency | $[0.0, 1.0]$ | `user_skills.proficiency` |

No arbitrary or fabricated database fields are introduced.

---

## 3. Synthetic Bootstrap Dataset

Because DevPair is an early-stage platform without historical acceptance/rejection records, an initial training set of **2,500 candidate-role scenarios** is generated using a fixed random seed (`seed = 42`) for 100% reproducibility:

- **Scenarios Generated**:
  - Strong Skill Matches (30%)
  - Partial Skill Matches (30%)
  - Weak / Unrelated Matches (20%)
  - Availability Mismatches (10%)
  - Category / Domain Mismatches (10%)
- **Class Balance**: 47.6% positive ($y = 1$), 52.4% negative ($y = 0$).
- **Realistic Human Variance**: Gaussian noise ($\sigma = 0.08$) simulates real-world factors such as personal interview impressions, communication styles, and portfolio link nuances.

> [!NOTE]
> **Limitation Disclosure**: This model is an interpretable ML proof-of-concept trained on synthetic bootstrap data. It represents reasonable prior heuristics until real student application outcomes are collected.

---

## 4. Model Selection & Architecture

### Logistic Regression
- **Algorithm**: `LogisticRegression(C=1.0, solver='lbfgs', max_iter=1000, random_state=42)`
- **Mathematical Form**:
  $$z = \sum_{i=1}^d w_i x_i + b$$
  $$P(\text{good\_match}) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
- **Why Logistic Regression?**:
  1. **Strictly Interpretable**: Coefficients directly reflect the directional influence of each factor on the log-odds.
  2. **Calibrated Probabilities**: Outputs smooth $[0, 1]$ probabilities ideal for ranking.
  3. **Zero-Python Deployment**: The model parameters (weights $w$ and intercept $b$) serialize cleanly to JSON and execute in TypeScript with $< 10^{-6}$ numerical error, maintaining full Next.js and Vercel serverless compatibility without external microservices.

---

## 5. Evaluation Metrics (Held-Out Test Set, N = 500)

| Metric | Score |
|---|---|
| **Accuracy** | **97.60%** |
| **Precision** | **96.69%** |
| **Recall** | **98.32%** |
| **F1-Score** | **97.50%** |
| **ROC-AUC** | **0.9966** |

### Confusion Matrix:
- True Negatives (TN): 254
- False Positives (FP): 8
- False Negatives (FN): 4
- True Positives (TP): 234

### Learned Feature Coefficients:
```text
availability_fit              : +6.1025
required_skill_match          : +5.4153
required_skill_proficiency    : +2.0422
project_category_alignment    : +1.8902
skill_category_overlap_ratio  : +1.5411
advanced_skills_count_norm    : +0.7354
total_skills_count_norm       : +0.7252
avg_skill_proficiency         : -0.0440
intercept                     : -11.3189
```

---

## 6. Runtime Deployment & Serialization

```text
Offline Python Pipeline:
  generate_training_data.py -> train_model.py -> evaluate_model.py
                                     │
                                     ▼
                          model_artifact.json
                                     │
Online Next.js / Vercel:             ▼
  src/features/matching/model_artifact.json
  src/features/matching/features.ts
  src/features/matching/model.ts
  src/features/matching/explanation.ts
  src/features/matching/service.ts
```

In Next.js, the TypeScript runtime evaluates:
```ts
const z = dotProduct(weights, features) + intercept;
const probability = 1 / (1 + Math.exp(-z));
const score = Math.round(probability * 100);
```
Zero Python runtime dependency is required for Vercel production deployment.

---

## 7. Future Retraining on Real User Interaction Data

As DevPair users apply for roles and project owners review applications, real feedback is generated:

```text
Synthetic Bootstrap Model
          │
          ▼
Student Join Requests & Applications
          │
          ├─ status = 'accepted'  --> Positive Label (y = 1)
          ├─ status = 'rejected'  --> Negative Label (y = 0)
          └─ status = 'withdrawn' --> Neutral / Excluded
          │
          ▼
Retrain Logistic Regression Pipeline on Real Interaction Logs
          │
          ▼
Continuous Performance Improvements & Calibrated Personalization
```
