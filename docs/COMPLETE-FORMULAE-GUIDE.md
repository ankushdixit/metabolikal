# 📐 METABOLI-K-AL Complete Formulae & Calculation Guide

## 🎯 Overview

This comprehensive guide explains **every formula** used in the METABOLI-K-AL calculator and lifestyle assessment system, including how results are calculated step-by-step.

---

## 📊 Assessment Score Calculation

### **Lifestyle Score (60% of Health Score)**

**Formula:**

```
Lifestyle Score = (Sum of 7 Factors / 70) × 100
```

**7 Lifestyle Factors (Each scored 0-10):**

1. **Sleep Quality & Duration**
2. **Body Confidence & Image**
3. **Nutrition & Eating Habits**
4. **Mental Health & Clarity**
5. **Stress Management**
6. **Social Support Network**
7. **Hydration Levels**

**Example Calculation:**

```
If all factors are at 8/10:
Lifestyle Score = (8 + 8 + 8 + 8 + 8 + 8 + 8) / 70 × 100
                = 56 / 70 × 100
                = 80% (80/100)
```

**Code Location:** `js/metabolikal-final.js` Lines 1066-1073

---

## 🔥 BMR (Basal Metabolic Rate) Calculation

### **Mifflin-St Jeor Equation** (Most accurate modern formula)

**For Males:**

```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
```

**For Females:**

```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
```

**Example for Male (30 years, 75kg, 175cm):**

```
BMR = (10 × 75) + (6.25 × 175) - (5 × 30) + 5
    = 750 + 1093.75 - 150 + 5
    = 1698.75 cal/day
```

**Example for Female (30 years, 65kg, 165cm):**

```
BMR = (10 × 65) + (6.25 × 165) - (5 × 30) - 161
    = 650 + 1031.25 - 150 - 161
    = 1370.25 cal/day
```

**Code Location:** `js/metabolikal-final.js` Lines 887-893

---

## 🏥 Medical Conditions Adjustment

### **BMR Adjustment for Medical Conditions**

Each medical condition has an impact percentage (negative value):

- **Thyroid Issues:** -15%
- **PCOS:** -10%
- **Diabetes:** -5%
- **Insulin Resistance:** -8%
- **Hormonal Imbalance:** -7%
- **Sleep Disorders:** -5%

**Formula:**

```
Medical Multiplier = 1 + (Total Impact / 100)
Adjusted BMR = Base BMR × Medical Multiplier
```

**Cap:** Maximum combined impact = -25% (even if multiple conditions selected)

**Example (Thyroid Issues + PCOS):**

```
Total Impact = -15% + (-10%) = -25%
Medical Multiplier = 1 + (-25 / 100) = 0.75
If Base BMR = 1700 cal/day:
Adjusted BMR = 1700 × 0.75 = 1275 cal/day
```

**Code Location:** `js/metabolikal-final.js` Lines 895-900, 734-738

---

## ⚡ TDEE (Total Daily Energy Expenditure)

### **Base TDEE Calculation**

**Formula:**

```
TDEE = Adjusted BMR × Activity Level Multiplier
```

**Activity Level Multipliers:**
| Activity Level | Multiplier | Description |
|---------------|-----------|-------------|
| Sedentary | 1.2 | Little or no exercise |
| Lightly Active | 1.375 | Light exercise 1-3 days/week |
| Moderately Active | 1.55 | Moderate exercise 3-5 days/week |
| Very Active | 1.725 | Hard exercise 6-7 days/week |
| Extra Active | 1.9 | Very hard exercise & physical job |

**Example (BMR = 1700, Moderately Active):**

```
TDEE = 1700 × 1.55 = 2635 cal/day
```

**Code Location:** `js/metabolikal-final.js` Lines 902-904

---

## 🌟 Lifestyle-Adjusted TDEE (METABOLI-K-AL Proprietary Formula)

### **The Lifestyle Multiplier**

This is METABOLI-K-AL's unique formula that adjusts TDEE based on lifestyle quality!

**Formula:**

```
Lifestyle Multiplier = 1 + ((Lifestyle Score - 50) / 500)
```

**How It Works:**

- **Lifestyle Score = 50** → Multiplier = 1.00 (no change)
- **Lifestyle Score > 50** → Multiplier > 1.00 (metabolic boost!)
- **Lifestyle Score < 50** → Multiplier < 1.00 (metabolic suppression)

**Lifestyle-Adjusted TDEE:**

```
Adjusted TDEE = Base TDEE × Lifestyle Multiplier
```

**Example Calculations:**

**High Performer (Lifestyle Score = 80):**

```
Lifestyle Multiplier = 1 + ((80 - 50) / 500)
                     = 1 + (30 / 500)
                     = 1 + 0.06
                     = 1.06 (6% metabolic boost!)

If Base TDEE = 2635 cal/day:
Adjusted TDEE = 2635 × 1.06 = 2793 cal/day
Metabolic Boost = +158 cal/day
```

**Average Lifestyle (Lifestyle Score = 50):**

```
Lifestyle Multiplier = 1 + ((50 - 50) / 500)
                     = 1 + 0
                     = 1.00 (no change)

Adjusted TDEE = Base TDEE (2635 cal/day)
```

**Poor Lifestyle (Lifestyle Score = 30):**

```
Lifestyle Multiplier = 1 + ((30 - 50) / 500)
                     = 1 + (-20 / 500)
                     = 1 - 0.04
                     = 0.96 (4% metabolic suppression)

If Base TDEE = 2635 cal/day:
Adjusted TDEE = 2635 × 0.96 = 2530 cal/day
Metabolic Penalty = -105 cal/day
```

**Code Location:** `js/metabolikal-final.js` Lines 906-909

---

## 🎯 Target Calories Based on Goal

### **Weight Loss Goal**

**Formula:**

```
Deficit = -550 cal/day
Target Calories = Adjusted TDEE - 550
```

**Example (Adjusted TDEE = 2793):**

```
Target Calories = 2793 - 550 = 2243 cal/day
Expected Weight Loss = 0.5-0.75 kg/week (sustainable rate)
```

### **Muscle Gain Goal**

**Formula:**

```
Surplus = +475 cal/day
Target Calories = Adjusted TDEE + 475
```

**Example (Adjusted TDEE = 2793):**

```
Target Calories = 2793 + 475 = 3268 cal/day
Expected Muscle Gain = 0.25-0.5 kg/week (optimal rate)
```

### **Maintenance Goal**

**Formula:**

```
Surplus/Deficit = 0
Target Calories = Adjusted TDEE
```

**Example (Adjusted TDEE = 2793):**

```
Target Calories = 2793 cal/day (maintain current weight)
```

**Code Location:** `js/metabolikal-final.js` Lines 911-922

---

## 💪 Physical Score Calculation (40% of Health Score)

### **Base Score + BMI Score + Body Fat Score**

**Formula:**

```
Physical Score = Base (75) + BMI Points + Body Fat Points
Maximum Score = 100
```

### **BMI Scoring**

**BMI Formula:**

```
BMI = weight_kg / (height_m²)
```

**BMI Point Awards:**
| BMI Range | Category | Points |
|-----------|----------|--------|
| 18.5 - 24.9 | Optimal | +15 |
| 25.0 - 29.9 | Overweight | +10 |
| 17.0 - 18.4 | Slightly Underweight | +10 |
| Other ranges | Outside optimal | +5 |

### **Body Fat Scoring (Gender-Specific)**

**Male Body Fat Points:**
| Body Fat % | Category | Points |
|-----------|----------|--------|
| 10-20% | Optimal | +10 |
| 8-24% | Acceptable | +7 |
| Other | Outside optimal | +3 |

**Female Body Fat Points:**
| Body Fat % | Category | Points |
|-----------|----------|--------|
| 18-28% | Optimal | +10 |
| 15-32% | Acceptable | +7 |
| Other | Outside optimal | +3 |

### **Example Calculations:**

**Male (75kg, 175cm, 18% body fat):**

```
BMI = 75 / (1.75)² = 75 / 3.0625 = 24.49

Physical Score = 75 (base)
               + 15 (BMI 24.49 in optimal range)
               + 10 (body fat 18% in optimal male range)
               = 100
```

**Female (65kg, 165cm, 25% body fat):**

```
BMI = 65 / (1.65)² = 65 / 2.7225 = 23.88

Physical Score = 75 (base)
               + 15 (BMI 23.88 in optimal range)
               + 10 (body fat 25% in optimal female range)
               = 100
```

**Code Location:** `js/metabolikal-final.js` Lines 1101-1134

---

## 🏆 Overall Health Score

### **Weighted Average: 60% Lifestyle + 40% Physical**

**Formula:**

```
Health Score = (Lifestyle Score × 0.6) + (Physical Score × 0.4)
```

**Example Calculation:**

```
Lifestyle Score = 80
Physical Score = 100

Health Score = (80 × 0.6) + (100 × 0.4)
             = 48 + 40
             = 88/100
```

**Score Interpretation:**

- **90-100:** Elite Metabolic Health 🔥
- **80-89:** Excellent Progress 💪
- **70-79:** Good Foundation ✅
- **60-69:** Building Momentum 📈
- **50-59:** Early Progress 🌱
- **Below 50:** Optimization Opportunity 🎯

**Code Location:** `js/metabolikal-final.js` Lines 924-928

---

## 🎯 Priority Areas Determination

### **Top 3 Lowest Scoring Lifestyle Areas**

**Process:**

1. Assess all 7 lifestyle factors (sleep, body, nutrition, mental, stress, support, hydration)
2. Sort by score (lowest to highest)
3. Select top 3 lowest scores
4. Assign recommendations based on score level

**Score Levels:**

- **Low (0-3):** Requires immediate attention
- **Medium (4-7):** Moderate improvement needed
- **High (8-10):** Strong foundation, optimization focus

**Example:**

```
Assessment Scores:
- Sleep: 4
- Body: 8
- Nutrition: 6
- Mental: 9
- Stress: 3  ← Priority #1
- Support: 7
- Hydration: 5

Priority Areas (sorted by lowest):
1. Stress Management (score: 3) - Low level recommendation
2. Sleep & Recovery (score: 4) - Medium level recommendation
3. Hydration (score: 5) - Medium level recommendation
```

**Code Location:** `js/metabolikal-final.js` Lines 1161-1185

---

## 📈 Progressive Targets (30-Day Challenge)

### **Daily Target Increase: 10% Compound Growth**

**Formula:**

```
Tomorrow's Target = Today's Achievement × 1.10
```

**Example Progression (Steps):**

| Day | Achievement  | Next Day Target            |
| --- | ------------ | -------------------------- |
| 1   | 5,000 steps  | 5,500 steps (5,000 × 1.10) |
| 2   | 5,500 steps  | 6,050 steps (5,500 × 1.10) |
| 3   | 6,050 steps  | 6,655 steps (6,050 × 1.10) |
| 7   | 9,741 steps  | 10,715 steps               |
| 14  | 18,847 steps | 20,732 steps               |
| 30  | 87,247 steps | 95,972 steps               |

**Why 10%?**

- Challenging but achievable
- Compound growth over 30 days
- Builds consistency and discipline
- Prevents plateau

**Protection Logic:**

- **NEW entry:** Awards full points
- **EDIT entry (same day):** No additional points (once-per-day protection)

**Code Location:** `js/smart-metrics-tracker.js`

---

## 🏅 Points System (30-Day Challenge)

### **Maximum: 150 Points Per Day**

**Point Breakdown:**

| Metric             | Targets       | Points |
| ------------------ | ------------- | ------ |
| **Daily Steps**    | 7,000 steps   | 15 pts |
|                    | 10,000 steps  | 30 pts |
|                    | 15,000+ steps | 45 pts |
| **Water Intake**   | 3.0-3.5 L     | 15 pts |
|                    | 3.5-4.0 L     | 30 pts |
|                    | 4.0-4.5 L     | 45 pts |
| **Floors Climbed** | 4 floors      | 15 pts |
|                    | 10 floors     | 30 pts |
|                    | 14+ floors    | 45 pts |
| **Protein Intake** | 70g+          | 15 pts |
| **Sleep Duration** | 7+ hours      | 15 pts |
| **Daily Check-in** | Completed     | 15 pts |

**Total Possible:** 45 + 45 + 45 + 15 + 15 + 15 = **180 points**
**Capped at:** **150 points per day**

### **Week Unlocking Logic**

**Formula:**

```
Week Unlocks When: Previous Week Completion ≥ 90%
```

**Example:**

```
Week 1 (7 days):
- Completed 6 days = 85.7% (Week 2 stays locked)
- Completed 7 days = 100% (Week 2 unlocks!)

Week 2 requires: (7 × 0.90) = 6.3 → Must complete 7 days

Week 4 (7 days):
- Completed 6 days = 85.7% (Week 5 stays locked)
- Need 7 days for Week 5 unlock
```

**Code Location:** `js/challenge-hub.js`

---

## 📊 Complete Example Walkthrough

### **User Profile:**

- **Gender:** Male
- **Age:** 30 years
- **Weight:** 75 kg
- **Height:** 175 cm
- **Body Fat:** 18%
- **Activity Level:** Moderately Active (1.55)
- **Goal:** Weight Loss
- **Medical Conditions:** None

### **Assessment Scores:**

- Sleep: 8
- Body: 7
- Nutrition: 8
- Mental: 9
- Stress: 6
- Support: 7
- Hydration: 7

---

### **Step 1: Lifestyle Score**

```
Lifestyle Score = (8 + 7 + 8 + 9 + 6 + 7 + 7) / 70 × 100
                = 52 / 70 × 100
                = 74.29 ≈ 74
```

### **Step 2: Base BMR**

```
BMR = (10 × 75) + (6.25 × 175) - (5 × 30) + 5
    = 750 + 1093.75 - 150 + 5
    = 1698.75 cal/day
```

### **Step 3: Medical Adjustment**

```
No medical conditions selected
Medical Multiplier = 1.0
Adjusted BMR = 1698.75 × 1.0 = 1698.75 cal/day
```

### **Step 4: Base TDEE**

```
TDEE = BMR × Activity Level
     = 1698.75 × 1.55
     = 2633 cal/day
```

### **Step 5: Lifestyle-Adjusted TDEE**

```
Lifestyle Multiplier = 1 + ((74 - 50) / 500)
                     = 1 + (24 / 500)
                     = 1.048

Adjusted TDEE = 2633 × 1.048
              = 2759 cal/day

Metabolic Boost = 2759 - 2633 = +126 cal/day (4.8% boost!)
```

### **Step 6: Target Calories (Weight Loss)**

```
Deficit = -550 cal/day
Target Calories = 2759 - 550
                = 2209 cal/day
```

### **Step 7: Physical Score**

```
BMI = 75 / (1.75)² = 24.49

Physical Score = 75 (base)
               + 15 (optimal BMI)
               + 10 (optimal body fat for male)
               = 100
```

### **Step 8: Health Score**

```
Health Score = (Lifestyle × 0.6) + (Physical × 0.4)
             = (74 × 0.6) + (100 × 0.4)
             = 44.4 + 40
             = 84.4 ≈ 84/100
```

### **Step 9: Priority Areas**

```
Sorted scores (lowest first):
1. Stress: 6 → Priority #1
2. Body: 7 → Priority #2
3. Support: 7 → Priority #3
4. Hydration: 7
5. Sleep: 8
6. Nutrition: 8
7. Mental: 9
```

---

## 📝 Summary of All Formulae

### **Core Calculations:**

1. **Lifestyle Score** = `(Sum of 7 factors / 70) × 100`
2. **BMR Male** = `(10 × kg) + (6.25 × cm) - (5 × age) + 5`
3. **BMR Female** = `(10 × kg) + (6.25 × cm) - (5 × age) - 161`
4. **Medical Adjusted BMR** = `BMR × (1 + Medical Impact/100)`
5. **Base TDEE** = `BMR × Activity Level`
6. **Lifestyle Multiplier** = `1 + ((Lifestyle Score - 50) / 500)`
7. **Adjusted TDEE** = `Base TDEE × Lifestyle Multiplier`
8. **Target Calories** = `Adjusted TDEE ± Goal Adjustment`
9. **Physical Score** = `75 + BMI Points + Body Fat Points` (max 100)
10. **Health Score** = `(Lifestyle × 0.6) + (Physical × 0.4)`

### **Challenge Formulae:**

11. **Progressive Target** = `Yesterday's Achievement × 1.10`
12. **Week Unlock** = `Previous Week Completion ≥ 90%`
13. **Max Daily Points** = `150 points` (capped from 180 possible)

---

## 🎯 Key Insights

### **What Makes METABOLI-K-AL Unique:**

1. **Lifestyle Multiplier** - Your lifestyle quality directly affects metabolism (±10% range)
2. **Medical Condition Adjustment** - Personalized BMR based on health conditions
3. **Holistic Scoring** - 60% lifestyle + 40% physical (not just body metrics)
4. **Progressive Targets** - 10% daily growth creates sustainable habits
5. **Priority Focus** - Top 3 weakest areas identified for improvement

### **Why These Numbers Matter:**

- **550 cal deficit** = Safe, sustainable 0.5-0.75 kg/week weight loss
- **475 cal surplus** = Optimal 0.25-0.5 kg/week muscle gain
- **10% daily increase** = Challenging but achievable progressive overload
- **90% completion** = Ensures consistency before advancing to next week
- **150 point cap** = Prevents gaming the system, encourages balanced approach

---

## 🔍 Code References

All calculations implemented in:

- **Main Calculator:** `js/metabolikal-final.js`
- **Metrics Tracker:** `js/smart-metrics-tracker.js`
- **Challenge Hub:** `js/challenge-hub.js`
- **Points System:** `js/simple-points-system.js`

**Version:** 3.3.109  
**Last Updated:** November 1, 2025  
**Status:** Production-Ready ✅
