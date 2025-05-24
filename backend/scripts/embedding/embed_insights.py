#!/usr/bin/env python3
"""
embed_insights.py

Usage:
  python embed_insights.py --data_dir path/to/data_folder \
                           --dimension K

This script reads the exported insights and comparisons JSON files,
builds a relationship matrix, performs truncated SVD to reduce the 
matrix to K dimensions, and outputs the embedding matrix and stats 
as JSON files.
"""

import argparse
import json
import os
import numpy as np
from scipy import sparse
from sklearn.decomposition import TruncatedSVD
import random
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error


def main():
    parser = argparse.ArgumentParser(description="Embed insights with truncated SVD")
    parser.add_argument('--data_dir', '-d', type=str, required=True,
                        help="Directory containing inspirations.json and comparisons.json, outputs will be written here")
    parser.add_argument('--dimension', '-k', type=int, required=True,
                        help="Target embedding dimension K")
    args = parser.parse_args()

    # Paths to input files
    insights_path = os.path.join(args.data_dir, 'inspirations.json')
    comparisons_path = os.path.join(args.data_dir, 'comparisons.json')

    # Load insights
    with open(insights_path, 'r') as f:
        insights = json.load(f)
    insight_ids = [ins['id'] for ins in insights]
    id_to_idx = {id_: idx for idx, id_ in enumerate(insight_ids)}
    N = len(insight_ids)

    # Load comparisons
    with open(comparisons_path, 'r') as f:
        comparisons = json.load(f)

    # Build sparse matrix M
    rows = []
    cols = []
    data = []
    for comp in comparisons:
        a = comp['insightAId']
        b = comp['insightBId']
        importance = comp.get('importance', 0)
        polarity = comp.get('polarity', 1)  # Default to positive if not specified
        weight = importance * polarity
        idx_a = id_to_idx[a]
        idx_b = id_to_idx[b]
        rows.extend([idx_a, idx_b])
        cols.extend([idx_b, idx_a])
        data.extend([weight, weight])

    M = sparse.coo_matrix((data, (rows, cols)), shape=(N, N))

    # Summary of input data
    num_comparisons = len(comparisons)
    density = M.nnz / float(N * N)
    summary = {
        'num_insights': N,
        'num_comparisons': num_comparisons,
        'matrix_density': density,
        'dimension': args.dimension,
    }
    
    # Perform truncated SVD
    svd = TruncatedSVD(n_components=args.dimension, random_state=42)
    svd.fit(M)
    
    # Build embedding matrix W of shape (K, N)
    # W = diag(sqrt(singular_values)) @ components
    S_sqrt = np.sqrt(svd.singular_values_)
    W = (S_sqrt[:, np.newaxis] * svd.components_)

    # Compute simplified predictions for importance
    predictions = []
    actuals = []
    comparison_details = []
    for comp in comparisons:
        a = comp['insightAId']
        b = comp['insightBId']
        importance = comp.get('importance', 0)
        polarity = comp.get('polarity', 1)  # Default to positive if not specified
        idx_a = id_to_idx[a]
        idx_b = id_to_idx[b]
        # Find the insight texts
        insight_a_text = next((ins['insightText'] for ins in insights if ins['id'] == a), 'Unknown')
        insight_b_text = next((ins['insightText'] for ins in insights if ins['id'] == b), 'Unknown')
        # Compute dot product of embeddings as simplified prediction
        pred_importance = np.dot(W[:, idx_a], W[:, idx_b])
        predictions.append(pred_importance)
        actuals.append(importance * polarity)
        comparison_details.append({
            'insightA': insight_a_text,
            'insightB': insight_b_text,
            'original_importance': importance * polarity,
            'predicted_importance': pred_importance
        })
    
    # Calculate accuracy statistics
    predictions = np.array(predictions)
    actuals = np.array(actuals)
    mse = np.mean((predictions - actuals) ** 2)
    mae = np.mean(np.abs(predictions - actuals))
    correlation = np.corrcoef(predictions, actuals)[0, 1] if len(predictions) > 1 else 0

    # Update summary with accuracy stats
    summary.update({
        'prediction_mse': mse,
        'prediction_mae': mae,
        'prediction_correlation': correlation
    })

    # Generate random pairs not in comparisons, with actual importance 0
    existing_pairs = set((comp['insightAId'], comp['insightBId']) for comp in comparisons)
    random_pairs = []
    while len(random_pairs) < num_comparisons:
        a, b = random.sample(insight_ids, 2)
        if (a, b) not in existing_pairs and (b, a) not in existing_pairs:
            random_pairs.append({'insightAId': a, 'insightBId': b, 'importance': 0, 'polarity': 1})
            existing_pairs.add((a, b))

    # Compute predictions for random pairs (zeros)
    zero_predictions = []
    zero_actuals = []
    zero_comparison_details = []
    for comp in random_pairs:
        a = comp['insightAId']
        b = comp['insightBId']
        importance = comp.get('importance', 0)
        polarity = comp.get('polarity', 1)
        idx_a = id_to_idx[a]
        idx_b = id_to_idx[b]
        insight_a_text = next((ins['insightText'] for ins in insights if ins['id'] == a), 'Unknown')
        insight_b_text = next((ins['insightText'] for ins in insights if ins['id'] == b), 'Unknown')
        pred_importance = np.dot(W[:, idx_a], W[:, idx_b])
        zero_predictions.append(pred_importance)
        zero_actuals.append(importance * polarity)
        zero_comparison_details.append({
            'insightA': insight_a_text,
            'insightB': insight_b_text,
            'original_importance': importance * polarity,
            'predicted_importance': pred_importance
        })

    # Calculate accuracy statistics for zeros
    zero_predictions = np.array(zero_predictions)
    zero_actuals = np.array(zero_actuals)
    zero_mse = np.mean((zero_predictions - zero_actuals) ** 2)
    zero_mae = np.mean(np.abs(zero_predictions - zero_actuals))
    zero_correlation = np.corrcoef(zero_predictions, zero_actuals)[0, 1] if len(zero_predictions) > 1 else 0

    # Update summary with accuracy stats for zeros
    summary.update({
        'num_zero_comparisons': len(random_pairs),
        'zero_prediction_mse': zero_mse,
        'zero_prediction_mae': zero_mae,
        'zero_prediction_correlation': zero_correlation
    })

    # Phase: Fit Ridge Regression from text embeddings to latent representations
    # Extract text embeddings from insights, using only the first 256 elements
    text_embeddings = np.array([ins['embedding'][:] for ins in insights if 'embedding' in ins])
    if text_embeddings.shape[0] != N:
        raise ValueError(f"Number of embeddings ({text_embeddings.shape[0]}) does not match number of insights ({N}).")
    # Latent representations from SVD (W is of shape (K, N), so transpose to (N, K))
    latent_representations = W.T  # Shape (N, K)

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(text_embeddings, latent_representations, test_size=0.2, random_state=42)

    # Fit Ridge Regression model
    ridge_model = Ridge(alpha=1.0)
    ridge_model.fit(X_train, y_train)

    # Compute scaling factor using training set predictions
    y_train_pred = ridge_model.predict(X_train)
    train_predictions = []
    for i in range(len(X_train)):
        for j in range(i + 1, len(X_train)):
            pred_importance = np.dot(y_train_pred[i], y_train_pred[j])
            train_predictions.append(pred_importance)
    train_predictions = np.array(train_predictions)
    max_abs_pred = np.max(np.abs(train_predictions)) if len(train_predictions) > 0 else 1.0
    scaling_factor = 10.0 / max_abs_pred if max_abs_pred > 0 else 1.0
    summary.update({
        'ridge_scaling_factor': scaling_factor
    })

    # Predict on test set
    y_pred = ridge_model.predict(X_test)

    # Calculate prediction quality metrics
    mse_latent = mean_squared_error(y_test, y_pred)
    mae_latent = mean_absolute_error(y_test, y_pred)
    correlation_latent = np.corrcoef(y_pred.flatten(), y_test.flatten())[0, 1] if len(y_pred) > 1 else 0

    # Update summary with regression stats
    summary.update({
        'text_to_latent_mse': mse_latent,
        'text_to_latent_mae': mae_latent,
        'text_to_latent_correlation': correlation_latent
    })

    # Compute predictions for normal comparisons using Ridge model
    ridge_predictions = []
    ridge_actuals = []
    ridge_comparison_details = []
    for comp in comparisons:
        a = comp['insightAId']
        b = comp['insightBId']
        importance = comp.get('importance', 0)
        polarity = comp.get('polarity', 1)
        idx_a = id_to_idx[a]
        idx_b = id_to_idx[b]
        insight_a_text = next((ins['insightText'] for ins in insights if ins['id'] == a), 'Unknown')
        insight_b_text = next((ins['insightText'] for ins in insights if ins['id'] == b), 'Unknown')
        # Get text embeddings for a and b
        emb_a = text_embeddings[idx_a]
        emb_b = text_embeddings[idx_b]
        # Predict latent representations using Ridge model
        latent_a = ridge_model.predict([emb_a])[0]
        latent_b = ridge_model.predict([emb_b])[0]
        # Compute dot product as predicted importance
        pred_importance = np.dot(latent_a, latent_b) * scaling_factor
        ridge_predictions.append(pred_importance)
        ridge_actuals.append(importance * polarity)
        ridge_comparison_details.append({
            'insightA': insight_a_text,
            'insightB': insight_b_text,
            'original_importance': importance * polarity,
            'predicted_importance': pred_importance
        })

    # Calculate accuracy statistics for Ridge normal comparisons
    ridge_predictions = np.array(ridge_predictions)
    ridge_actuals = np.array(ridge_actuals)
    ridge_mse = np.mean((ridge_predictions - ridge_actuals) ** 2)
    ridge_mae = np.mean(np.abs(ridge_predictions - ridge_actuals))
    ridge_correlation = np.corrcoef(ridge_predictions, ridge_actuals)[0, 1] if len(ridge_predictions) > 1 else 0

    # Update summary with Ridge stats
    summary.update({
        'ridge_prediction_mse': ridge_mse,
        'ridge_prediction_mae': ridge_mae,
        'ridge_prediction_correlation': ridge_correlation
    })

    # Update regression stats
    regression_stats = {
        'text_embedding_dimension': len(text_embeddings[0]),
        'latent_dimension': args.dimension,
        'num_insights_with_embeddings': text_embeddings.shape[0],
        'mse': mse_latent,
        'mae': mae_latent,
        'correlation': correlation_latent,
        'normal_mse': ridge_mse,
        'normal_mae': ridge_mae,
        'normal_correlation': ridge_correlation,
        'zero_mse': zero_mse,
        'zero_mae': zero_mae,
        'zero_correlation': zero_correlation
    }

    # Save the ridge regression metrics to a separate file
    regression_stats_path = os.path.join(args.data_dir, 'text_to_latent_regression_stats.json')
    with open(regression_stats_path, 'w') as f:
        json.dump(regression_stats, f, indent=2)

    # Sort comparison details by absolute difference between predicted and actual
    for detail in comparison_details:
        detail['abs_diff'] = abs(detail['predicted_importance'] - detail['original_importance'])
    comparison_details.sort(key=lambda x: x['abs_diff'])
    
    # Similarly sort zero comparison details
    for detail in zero_comparison_details:
        detail['abs_diff'] = abs(detail['predicted_importance'] - detail['original_importance'])
    zero_comparison_details.sort(key=lambda x: x['abs_diff'])
    
    # Also sort ridge comparison details if they exist
    for detail in ridge_comparison_details:
        detail['abs_diff'] = abs(detail['predicted_importance'] - detail['original_importance'])
    ridge_comparison_details.sort(key=lambda x: x['abs_diff'])

    # Prepare output file paths
    data_dir = args.data_dir
    emb_path = os.path.join(data_dir, 'embedding_matrix.json')
    stats_path = os.path.join(data_dir, 'embedding_stats.json')
    summary_path = os.path.join(data_dir, 'embedding_summary.json')
    details_path = os.path.join(data_dir, 'comparison_details.json')
    zero_details_path = os.path.join(data_dir, 'zero_comparison_details.json')
    ridge_details_path = os.path.join(data_dir, 'ridge_comparison_details.json')

    # Write embedding matrix
    with open(emb_path, 'w') as f:
        json.dump(W.tolist(), f)

    # Write stats
    stats = {
        **summary,
        'singular_values': svd.singular_values_.tolist(),
        'explained_variance_ratio': svd.explained_variance_ratio_.tolist(),
    }
    with open(stats_path, 'w') as f:
        json.dump(stats, f, indent=2)
    
    # Write summary
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    # Write comparison details
    with open(details_path, 'w') as f:
        json.dump(comparison_details, f, indent=2)

    # Write zero comparison details
    with open(zero_details_path, 'w') as f:
        json.dump(zero_comparison_details, f, indent=2)

    # Write ridge comparison details
    with open(ridge_details_path, 'w') as f:
        json.dump(ridge_comparison_details, f, indent=2)

    print(f"Embedding matrix written to {emb_path}")
    print(f"Stats written to {stats_path}")
    print(f"Summary written to {summary_path}")
    print(f"Comparison details written to {details_path}")
    print(f"Zero comparison details written to {zero_details_path}")


if __name__ == "__main__":
    main() 