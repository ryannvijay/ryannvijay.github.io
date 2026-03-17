---
authors:
  - rv
categories:
  - Applied AI
  - Data Strategy
comments: true
date: 2025-08-09
description: A step-by-step Python guide to building a credit risk classifier,
  covering EDA, class imbalance, four ML models, and Streamlit deployment.
draft: false
slug: credit-risk-model-machine-learning-python
tags:
  - credit risk
  - machine learning
  - python
  - classification
  - scikit-learn
  - data science
---

# How to Build a Credit Risk Model with Machine Learning in Python (Step by Step)

**TL;DR:** A step-by-step Python project that builds a credit risk classifier on the German Credit Risk dataset. Covers exploratory analysis, feature engineering, four ML models (Decision Tree, Random Forest, Extra Trees, XGBoost), class imbalance handling, and Streamlit deployment. Extra Trees wins at 66% accuracy. The real takeaway: accuracy alone does not tell you whether a model is fit for a regulated credit decision.

<!-- more -->

A 66% accurate model still gets one in three credit decisions wrong. Whether that is acceptable depends on the cost of approving a bad loan versus the cost of rejecting a good customer.

That is a business question, not a Python question. But building the model is where you start.

This project walks through the full pipeline: from raw data to a working prediction app using the German Credit Risk dataset. Along the way, we will call out the five decisions that separate a credible credit risk model from a demo that would not survive contact with a real risk team.

---

## What the Credit Risk Dataset Actually Tells You

**The dataset contains 1,000 credit applications labelled good (low risk) or bad (high risk) across 11 features, including age, credit amount, duration, housing status, and account balances. The target column is `risk`.**

Of the 1,000 rows, 700 are labelled good and 300 are labelled bad. That is a 70/30 class split, and it is the first real decision point in this project. The three numeric features are age, credit amount, and duration. The rest are categorical and need encoding before modelling.

Load and inspect the dataset first:

```python
import pandas as pd

df = pd.read_csv('german_credit_risk.csv')
df.drop(columns=['Unnamed: 0'], inplace=True)
print(df.shape)         # (1000, 10)
print(df.isnull().sum())
```

The `isnull()` check will show 394 missing values in Saving accounts and 183 in Checking account. That leads directly to the first major decision.

## Should You Drop or Impute the Missing Values?

**Drop them. An application with no account history is not missing data: it is a different kind of applicant. Imputing a value changes the meaning of the row and introduces noise the model will pick up as signal.**

You lose 480 rows and end up with 520 after cleaning. That is 48% of the original dataset, which is a significant reduction. But replacing a missing saving account balance with a median or a placeholder tells the model something that is not true. For a credit decision, that matters.

```python
df.dropna(inplace=True)
df.reset_index(drop=True, inplace=True)
print(df.shape)         # (520, 10)
```

After cleaning, the class split is 55% good and 44% bad. Closer to balanced, but still unequal enough to cause problems if you ignore it.

## Class Imbalance Is the Silent Killer of Credit Risk Models

**A classifier trained on imbalanced credit data without correction learns to predict the majority class. It looks accurate. It is not useful. On this dataset, a model that always predicts "good" scores 55% accuracy with zero effort.**

That is the floor, not the goal.

The fix for scikit-learn models is one parameter: `class_weight='balanced'`. This adjusts the loss function to penalise misclassifying the minority class more heavily.

```python
from sklearn.tree import DecisionTreeClassifier

dt = DecisionTreeClassifier(
    random_state=1,
    class_weight='balanced'
)
```

For XGBoost, use `scale_pos_weight` instead:

```python
from xgboost import XGBClassifier

neg = (y_train == 0).sum()
pos = (y_train == 1).sum()

xgb = XGBClassifier(
    scale_pos_weight=neg / pos,
    random_state=1
)
```

Do not skip this step. The accuracy gap between a balanced and an unbalanced model is real, and it shows up the moment the risk team starts questioning your false negative rate.

## Feature Engineering: What to Encode and What to Skip

The categorical features (Sex, Housing, Saving accounts, Checking account, Purpose) need label encoding before the models can use them. Tree-based algorithms handle ordinal relationships without issue, so `LabelEncoder` works here.

One point that most tutorials miss: you are not just encoding for training. You need to export the encoders so your deployment app applies the same transformations at prediction time. Export them as pickle files now:

```python
from sklearn.preprocessing import LabelEncoder
import joblib

cat_cols = (df.select_dtypes(include='object')
              .columns.drop('Risk'))
encoders = {}

for col in cat_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le
    joblib.dump(le, f'{col}_encoder.pkl')
```

No scaling needed. Tree-based models split on feature thresholds, not distances. Standard scaling makes no difference to their performance. Skip it entirely.

If you are building for a team that spans multiple roles, the
[distinction between what analysts and data scientists own](../data-analyst-vs-data-scientist-vs-data-engineer/data-analyst-vs-data-scientist-vs-data-engineer.md)
matters here: EDA and reporting typically sit with analysts; model builds and productionisation sit with data scientists.

## Four Models, One Winner: Decision Tree to Extra Trees

**Train four tree-based classifiers with GridSearchCV and 5-fold cross-validation. Extra Trees wins at 66% accuracy, ahead of XGBoost (63%), Random Forest (61%), and Decision Tree (58%).**

| Model | Accuracy |
| --- | --- |
| Decision Tree | 0.58 |
| Random Forest | 0.61 |
| XGBoost | 0.63 |
| **Extra Trees** | **0.66** |

A helper function keeps the tuning code clean:

```python
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score

def train_model(model, param_grid,
                X_train, y_train,
                X_test, y_test):
    grid = GridSearchCV(
        model, param_grid,
        cv=5, scoring='accuracy',
        n_jobs=-1
    )
    grid.fit(X_train, y_train)
    best = grid.best_estimator_
    y_pred = best.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    return best, acc, grid.best_params_
```

Why does Extra Trees beat Random Forest? Random Forest selects the best split threshold at each node from a random subset of features. Extra Trees randomises the split threshold as well. That extra randomness reduces variance, which particularly helps on smaller datasets like this one. With 520 rows after cleaning, variance is a real risk.

Export the winning model before moving to deployment:

```python
joblib.dump(best_et, 'extra_trees_credit_model.pkl')
```

## What Does 0.66 Accuracy Actually Mean for a Credit Decision?

**66% accuracy means the model gets roughly two in three credit applications right. The question is which third it is getting wrong, and what that costs the business.**

In credit risk, the two error types carry very different weights:

- **False positive (approving a bad loan):** The lender absorbs the default loss.
- **False negative (rejecting a good customer):** The lender loses revenue and the customer goes elsewhere.

Accuracy treats both errors as equal. It is the wrong primary metric for this problem. Precision, recall, and the F1 score give you a clearer picture. A confusion matrix shows exactly where the model fails.

For the next iteration, evaluate on recall for the "bad" class. You want to catch as many high-risk applicants as possible, even at the cost of some false rejections. Where to set that threshold is a business decision. The model informs it; it does not make it.

## Building the Streamlit App: From Notebook to Working Tool

Streamlit turns a trained model into an interactive prediction tool in under 50 lines of code. Load the model and encoders, build the input fields, and run predictions on button click:

```python
import streamlit as st
import pandas as pd
import joblib

model = joblib.load('extra_trees_credit_model.pkl')
encoders = {
    col: joblib.load(f'{col}_encoder.pkl')
    for col in [
        'Sex', 'Housing',
        'Saving accounts', 'Checking account'
    ]
}

st.title('Credit Risk Prediction App')
st.write('Enter applicant details to predict credit risk.')

age = st.number_input(
    'Age', min_value=18, max_value=80, value=30
)
sex = st.selectbox('Sex', ['male', 'female'])
credit_amt = st.number_input(
    'Credit Amount', min_value=0, value=1000
)
duration = st.number_input(
    'Duration (months)', min_value=1, value=12
)

if st.button('Predict Risk'):
    input_df = pd.DataFrame([{
        'Age': age,
        'Sex': encoders['Sex'].transform([sex])[0],
        'Credit amount': credit_amt,
        'Duration': duration,
        # add remaining encoded fields here
    }])
    pred = model.predict(input_df)
    if pred[0] == 1:
        st.success(
            'Predicted credit risk: **Good** (low risk)'
        )
    else:
        st.error(
            'Predicted credit risk: **Bad** (high risk)'
        )
```

Run it with `streamlit run app.py`. The model is now accessible to anyone on the team, no Python environment required.

---

## Your Turn

The gap between a model that scores well and a model the business will trust comes down to the decisions documented in this article. Class imbalance handling, honest evaluation metrics, and a usable deployment are not optional extras.

Three things to do next:

1. **Run the EDA section first.** Download the dataset, plot the distributions, and look at the class split before you touch the models. The patterns you notice will inform every decision that follows.
2. **Add precision and recall to your evaluation.** Swap accuracy for recall on the "bad" class and see how the model rankings change. That shift in metric is the shift in perspective the risk team needs.
3. **Extend the Streamlit app with probability scores.** `model.predict_proba()` returns confidence levels for both classes. A probability of 0.51 and 0.91 both predict "bad", but they carry very different weights in a credit committee.

[Connect with me on LinkedIn](https://www.linkedin.com/in/ryan-vijay){ .md-button }

P.S. 66% accuracy on a cleaned dataset of 520 rows is a starting point, not a finish line. In production, credit risk models need monitoring for drift. Economic conditions shift. A model trained on applications from one period can degrade fast as the macro environment changes. Build the deployment; then build the monitoring.
