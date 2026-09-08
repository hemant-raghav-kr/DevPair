"""
DevPair AI Matching Engine - Synthetic Training Data Generator
Generates realistic student-to-role matching data based strictly on the DevPair relational schema.
Uses a fixed random seed for 100% reproducible dataset creation.
"""

import json
import os
import random
import numpy as np

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Schema categories
SKILL_CATEGORIES = [
    "frontend", "backend", "fullstack", "mobile", "ai_ml",
    "devops_cloud", "data_science", "ui_ux_design"
]

PROJECT_CATEGORIES = [
    "web_development", "mobile_app", "ai_machine_learning",
    "open_source", "game_development", "hardware_iot"
]

# Alignment mapping between project categories and relevant skill categories
CATEGORY_ALIGNMENT_MAP = {
    "web_development": ["frontend", "backend", "fullstack", "ui_ux_design", "devops_cloud"],
    "mobile_app": ["mobile", "frontend", "backend", "ui_ux_design"],
    "ai_machine_learning": ["ai_ml", "data_science", "backend", "devops_cloud"],
    "open_source": ["backend", "frontend", "fullstack", "devops_cloud"],
    "game_development": ["frontend", "ui_ux_design", "ai_ml"],
    "hardware_iot": ["backend", "ai_ml", "devops_cloud"],
}

PROFICIENCY_VALUES = {
    "beginner": 0.333,
    "intermediate": 0.667,
    "advanced": 1.0,
}

FEATURE_NAMES = [
    "required_skill_match",
    "required_skill_proficiency",
    "skill_category_overlap_ratio",
    "project_category_alignment",
    "availability_fit",
    "total_skills_count_norm",
    "avg_skill_proficiency",
    "advanced_skills_count_norm",
]


def generate_sample(scenario_type: str) -> dict:
    """Generate a single realistic (student, project_role) pair and its feature vector."""
    proj_cat = random.choice(PROJECT_CATEGORIES)
    aligned_cats = CATEGORY_ALIGNMENT_MAP.get(proj_cat, ["backend", "fullstack"])
    role_cat = random.choice(aligned_cats)
    is_hackathon = random.random() < 0.25
    expected_hours = 15.0 if is_hackathon else 10.0

    if scenario_type == "strong_match":
        req_match = 1.0
        req_prof = random.choice([0.667, 1.0])
        student_skills_count = random.randint(4, 9)
        # Most student skills align with role and project
        num_aligned = random.randint(int(student_skills_count * 0.7), student_skills_count)
        overlap_ratio = num_aligned / student_skills_count
        proj_align = min(1.0, (num_aligned + 1) / student_skills_count)
        avail_hours = random.randint(12, 25)
        avail_fit = min(1.0, avail_hours / expected_hours)
        avg_prof = random.uniform(0.65, 0.95)
        adv_ratio = random.uniform(0.3, 0.7)

    elif scenario_type == "partial_match":
        # Has skill at beginner or has strong category alignment without exact skill
        if random.random() < 0.5:
            req_match = 1.0
            req_prof = 0.333
        else:
            req_match = 0.0
            req_prof = 0.0
        student_skills_count = random.randint(3, 7)
        num_aligned = random.randint(1, student_skills_count - 1)
        overlap_ratio = num_aligned / student_skills_count
        proj_align = random.uniform(0.4, 0.75)
        avail_hours = random.randint(8, 16)
        avail_fit = min(1.0, avail_hours / expected_hours)
        avg_prof = random.uniform(0.4, 0.7)
        adv_ratio = random.uniform(0.0, 0.4)

    elif scenario_type == "availability_mismatch":
        # Decent skills, but critically insufficient availability (e.g. 2-5 hrs/wk vs 10-15 expected)
        req_match = 1.0 if random.random() < 0.7 else 0.0
        req_prof = random.choice([0.333, 0.667, 1.0]) if req_match == 1.0 else 0.0
        student_skills_count = random.randint(3, 7)
        overlap_ratio = random.uniform(0.4, 0.8)
        proj_align = random.uniform(0.4, 0.8)
        avail_hours = random.randint(2, 5)  # Severely insufficient
        avail_fit = min(1.0, avail_hours / expected_hours)
        avg_prof = random.uniform(0.5, 0.8)
        adv_ratio = random.uniform(0.1, 0.4)

    elif scenario_type == "category_mismatch":
        # Student skills belong to completely different domain
        req_match = 0.0
        req_prof = 0.0
        student_skills_count = random.randint(2, 6)
        overlap_ratio = random.uniform(0.0, 0.15)
        proj_align = random.uniform(0.0, 0.2)
        avail_hours = random.randint(10, 20)
        avail_fit = min(1.0, avail_hours / expected_hours)
        avg_prof = random.uniform(0.4, 0.8)
        adv_ratio = random.uniform(0.1, 0.4)

    else:  # "weak_match"
        req_match = 0.0
        req_prof = 0.0
        student_skills_count = random.randint(1, 3)
        overlap_ratio = random.uniform(0.0, 0.2)
        proj_align = random.uniform(0.0, 0.25)
        avail_hours = random.randint(4, 10)
        avail_fit = min(1.0, avail_hours / expected_hours)
        avg_prof = random.uniform(0.3, 0.5)
        adv_ratio = 0.0

    total_skills_norm = min(1.0, student_skills_count / 10.0)

    # Feature vector
    features = [
        round(req_match, 4),
        round(req_prof, 4),
        round(overlap_ratio, 4),
        round(proj_align, 4),
        round(avail_fit, 4),
        round(total_skills_norm, 4),
        round(avg_prof, 4),
        round(adv_ratio, 4),
    ]

    # Balanced latent suitability formulation
    # Severe availability deficiency (<0.45) directly penalizes project viability
    avail_penalty = -0.25 if avail_fit < 0.45 else 0.0

    latent_score = (
        0.28 * req_match +
        0.22 * req_prof +
        0.15 * overlap_ratio +
        0.13 * proj_align +
        0.14 * avail_fit +
        0.04 * total_skills_norm +
        0.04 * avg_prof +
        avail_penalty
    )

    # Realistic human noise: interview impression, communication, portfolio nuances
    noise = np.random.normal(0, 0.08)
    final_score = latent_score + noise

    # Binary label: 1 = suitable match, 0 = unsuitable match
    label = 1 if final_score >= 0.50 else 0

    return {
        "scenario": scenario_type,
        "features": features,
        "label": label,
        "latent_score": round(latent_score, 4),
    }


def generate_dataset(n_samples: int = 2500) -> list:
    """Generate balanced dataset across realistic scenario types."""
    scenarios = [
        ("strong_match", 0.30),
        ("partial_match", 0.30),
        ("weak_match", 0.20),
        ("availability_mismatch", 0.10),
        ("category_mismatch", 0.10),
    ]

    samples = []
    for scenario, proportion in scenarios:
        count = int(n_samples * proportion)
        for _ in range(count):
            samples.append(generate_sample(scenario))

    # Shuffle dataset
    random.shuffle(samples)
    return samples


if __name__ == "__main__":
    print(f"Generating {2500} synthetic matching records (seed={SEED})...")
    data = generate_dataset(2500)

    pos_count = sum(1 for d in data if d["label"] == 1)
    neg_count = sum(1 for d in data if d["label"] == 0)

    print(f"Total samples: {len(data)}")
    print(f"Positive labels (1 = Good Match): {pos_count} ({pos_count / len(data) * 100:.1f}%)")
    print(f"Negative labels (0 = Poor Match): {neg_count} ({neg_count / len(data) * 100:.1f}%)")

    output_file = os.path.join(OUTPUT_DIR, "synthetic_matching_data.json")
    with open(output_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Saved dataset to: {output_file}")
