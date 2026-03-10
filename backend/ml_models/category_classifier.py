from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

training_data = [
    ("swiggy order", "food"),
    ("zomato delivery", "food"),
    ("grocery shopping", "food"),
    ("restaurant dinner", "food"),
    ("lunch at cafe", "food"),
    ("dominos pizza", "food"),
    ("mcdonalds", "food"),
    ("milk and vegetables", "food"),
    ("uber ride", "transport"),
    ("ola cab", "transport"),
    ("bus pass", "transport"),
    ("metro card recharge", "transport"),
    ("auto rickshaw", "transport"),
    ("petrol refill", "transport"),
    ("flight ticket", "transport"),
    ("amazon purchase", "shopping"),
    ("flipkart order", "shopping"),
    ("myntra clothes", "shopping"),
    ("new shoes", "shopping"),
    ("winter jacket", "shopping"),
    ("laptop bag", "shopping"),
    ("electronics store", "shopping"),
    ("netflix subscription", "entertainment"),
    ("spotify premium", "entertainment"),
    ("movie tickets", "entertainment"),
    ("hotstar subscription", "entertainment"),
    ("prime video", "entertainment"),
    ("concert tickets", "entertainment"),
    ("doctor visit", "health"),
    ("medical checkup", "health"),
    ("pharmacy", "health"),
    ("hospital bill", "health"),
    ("gym membership", "health"),
    ("medicine purchase", "health"),
    ("electricity bill", "utilities"),
    ("water bill", "utilities"),
    ("internet recharge", "utilities"),
    ("gas cylinder", "utilities"),
    ("mobile recharge", "utilities"),
    ("rent payment", "utilities"),
]

descriptions = [d for d, _ in training_data]
labels = [l for _, l in training_data]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(descriptions)

classifier = LogisticRegression()
classifier.fit(X, labels)


def predict_category(description: str) -> str:
    x = vectorizer.transform([description.lower()])
    return classifier.predict(x)[0]
