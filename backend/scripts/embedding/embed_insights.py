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

    # Prepare output file paths
    data_dir = args.data_dir
    emb_path = os.path.join(data_dir, 'embedding_matrix.json')
    stats_path = os.path.join(data_dir, 'embedding_stats.json')
    summary_path = os.path.join(data_dir, 'embedding_summary.json')
    details_path = os.path.join(data_dir, 'comparison_details.json')
    zero_details_path = os.path.join(data_dir, 'zero_comparison_details.json')

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

    print(f"Embedding matrix written to {emb_path}")
    print(f"Stats written to {stats_path}")
    print(f"Summary written to {summary_path}")
    print(f"Comparison details written to {details_path}")
    print(f"Zero comparison details written to {zero_details_path}")


if __name__ == "__main__":
    main() 