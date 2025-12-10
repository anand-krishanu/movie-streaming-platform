# Machine Learning Model Architecture

## Overview
The Movie Streaming Platform utilizes a **Hybrid Recommendation System** that combines multiple machine learning techniques to provide personalized movie suggestions. This system is designed to handle various user scenarios, including active users with rich history and new users with little to no interaction data ("Cold Start").

## 🧠 Core Components

The recommendation engine (`recommender.py`) consists of three main layers:

### 1. Collaborative Filtering (The "Pattern Matcher")
*   **Algorithm**: Non-negative Matrix Factorization (NMF).
*   **How it works**: It analyzes the "User-Item Interaction Matrix" to find hidden patterns.
    *   It decomposes the matrix into two smaller matrices: **User Features** and **Movie Features**.
    *   *Example*: It might discover that User A and User B have similar viewing habits, and since User B liked "Inception", it predicts User A will too.
*   **Strength**: Excellent at discovering non-obvious connections between users and movies.

### 2. Content-Based Filtering (The "Genre Matcher")
*   **Algorithm**: Cosine Similarity on Genre Vectors.
*   **How it works**: It analyzes movie metadata (specifically Genres).
    *   It creates a mathematical vector for each movie based on its genres (e.g., `[Action: 1, Romance: 0, Sci-Fi: 1]`).
    *   It calculates the angle (cosine similarity) between these vectors.
*   **Strength**: Ensures recommendations are thematically similar (e.g., recommending another Sci-Fi movie if you just watched one).

### 3. Popularity-Based (The "Fallback")
*   **Logic**: Weighted score of Views and Likes.
*   **Formula**: `Popularity = (Likes * 2) + Views`
*   **Usage**: Used primarily for new users who haven't interacted with enough movies yet.

---

## 📊 Data Engineering & Scoring

The system does not rely on explicit 1-5 star ratings. Instead, it infers user interest from their actions on the platform. The `DataLoader` assigns "Implicit Feedback Scores" as follows:

| User Action | Implied Score | Description |
| :--- | :--- | :--- |
| **Add to Favorites** | **5.0** | Strongest signal of interest. |
| **Watch Progress (100%)** | **3.0** | User completed the movie. |
| **Watch Progress (50%)** | **1.5** | User watched half the movie. |
| **Add to Watch Later** | **2.0** | Intent to watch, but lower priority than favorites. |

*Note: If a user performs multiple actions (e.g., watches AND favorites), the highest score is used.*

---

## 🔄 The Hybrid Strategy

When generating recommendations, the system combines the scores from the different models:

1.  **For Existing Users**:
    *   **Primary**: Collaborative Filtering predictions.
    *   **Secondary**: Content-Based similarity (used in "Because you watched..." section).
    *   **Weighting**: The system typically weights Collaborative Filtering higher (e.g., 60%) as it captures deeper user preferences.

2.  **For New Users (Cold Start)**:
    *   If the user has added movies to **Favorites**: The system immediately switches to **Content-Based Filtering** to find similar movies.
    *   If the user has **No History**: The system returns **Popular Movies** to encourage initial interaction.

---

## 🛠️ Technical Implementation

*   **Language**: Python 3.10+
*   **Libraries**:
    *   `scikit-learn`: For NMF and Cosine Similarity.
    *   `pandas` / `numpy`: For high-performance matrix operations.
    *   `pymongo`: For direct database access.
*   **API**: FastAPI (exposes endpoints for the Spring Boot backend).
*   **Training**: The model is retrained periodically (triggered via Admin Dashboard) to incorporate new user data.
