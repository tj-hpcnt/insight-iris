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
    embedding_matrix_path = os.path.join(args.data_dir, 'embedding_matrix.json')

    # Load insights
    with open(insights_path, 'r') as f:
        insights = json.load(f)
    insight_ids = [ins['id'] for ins in insights]
    id_to_idx = {id_: idx for idx, id_ in enumerate(insight_ids)}
    N = len(insight_ids)

    if N < 1:
        raise ValueError("No insights found. Exiting.")
    if args.dimension > N:
        raise ValueError(f"Dimension {args.dimension} is greater than number of insights {N}. Exiting.")

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
        if a not in id_to_idx or b not in id_to_idx:
            raise ValueError(f"Comparison involving unknown insight ID(s): {a}, {b}")
        idx_a = id_to_idx[a]
        idx_b = id_to_idx[b]
        rows.extend([idx_a, idx_b])
        cols.extend([idx_b, idx_a])
        data.extend([weight, weight])

    if not data: # Handle case with no valid comparisons
        raise ValueError("No valid comparison data found. Proceeding with an empty matrix.")

    M = sparse.coo_matrix((data, (rows, cols)), shape=(N, N))

    # Summary of input data
    num_comparisons = len(comparisons)
    density = M.nnz / float(N * N) if N > 0 else 0
    summary = {
        'num_insights': N,
        'num_comparisons': num_comparisons,
        'matrix_density': density,
        'dimension': args.dimension,
    }
    
    W = np.zeros((args.dimension, N)) # Default W if SVD cannot run

    if not (M.nnz > 0 and N > 0 and args.dimension > 0 and args.dimension <=N): 
        raise ValueError("SVD cannot run. Matrix has no non-zero elements, or N=0, or dimension=0 or dimension > N.")
    
    # Perform truncated SVD
    svd = TruncatedSVD(n_components=args.dimension, random_state=42)
    svd.fit(M)
    
    # Build embedding matrix W of shape (K, N)
    # W = diag(sqrt(singular_values)) @ components
    S_sqrt = np.sqrt(svd.singular_values_)
    # Pad W if n_components_for_svd < args.dimension
    W_svd = (S_sqrt[:, np.newaxis] * svd.components_)
    W[:args.dimension, :] = W_svd
    
    singular_values = svd.singular_values_.tolist()
    explained_variance_ratio = svd.explained_variance_ratio_.tolist()

    # Compute simplified predictions for importance
    predictions = []
    actuals = []
    comparison_details = []
    for comp in comparisons:
        a = comp['insightAId']
        b = comp['insightBId']
        if a not in id_to_idx or b not in id_to_idx:
            raise ValueError(f"Comparison involving unknown insight ID(s): {a}, {b}")
        importance = comp.get('importance', 0)
        polarity = comp.get('polarity', 1)
        idx_a = id_to_idx[a]
        idx_b = id_to_idx[b]
        insight_a_text = next((ins['insightText'] for ins in insights if ins['id'] == a), 'Unknown')
        insight_b_text = next((ins['insightText'] for ins in insights if ins['id'] == b), 'Unknown')
        pred_importance = np.dot(W[:, idx_a], W[:, idx_b]) if N > 0 and args.dimension > 0 else 0
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
    
    mse = np.mean((predictions - actuals) ** 2) if len(predictions) > 0 else 0
    mae = np.mean(np.abs(predictions - actuals)) if len(predictions) > 0 else 0
    correlation = 0
    if len(predictions) > 1 and np.std(actuals) > 0 and np.std(predictions) > 0 : # Check for std dev > 0 for both
        correlation = np.corrcoef(predictions, actuals)[0, 1]
    
    # Update summary with accuracy stats
    summary.update({
        'prediction_mse': mse,
        'prediction_mae': mae,
        'prediction_correlation': correlation
    })

    # Generate random pairs not in comparisons, with actual importance 0
    existing_pairs_for_random = set()
    for comp in comparisons: # Use a separate set for random pair generation to avoid modifying original logic
        if comp['insightAId'] in id_to_idx and comp['insightBId'] in id_to_idx:
             existing_pairs_for_random.add((comp['insightAId'], comp['insightBId']))
             existing_pairs_for_random.add((comp['insightBId'], comp['insightAId']))

    random_pairs = []
    # Determine number of random pairs: aim for same number as actual comparisons, but cap if N is small.
    num_random_to_generate = len(comparisons)
    if N > 1: # Max possible unique pairs is N*(N-1)/2
        max_possible_random_pairs = (N * (N - 1) // 2) - len(existing_pairs_for_random)//2 # subtract existing unique pairs
        num_random_to_generate = min(num_random_to_generate, max_possible_random_pairs)

    generated_random_count = 0
    # Try to generate random pairs, with a limit on attempts to avoid infinite loops if few possible pairs exist
    max_attempts = num_random_to_generate * 5 + 100 # Heuristic for max attempts

    for _ in range(max_attempts):
        if generated_random_count >= num_random_to_generate:
            break
        if N < 2:
            break
        a, b = random.sample(insight_ids, 2)
        if (a,b) not in existing_pairs_for_random:
            random_pairs.append({'insightAId': a, 'insightBId': b, 'importance': 0, 'polarity': 1})
            existing_pairs_for_random.add((a,b))
            existing_pairs_for_random.add((b,a))
            generated_random_count +=1

    # Compute predictions for random pairs (zeros)
    zero_predictions = []
    zero_actuals = [] # Will be all zeros
    zero_comparison_details = []

    for comp in random_pairs: # Random pairs already checked for valid IDs implicitly by sampling from insight_ids
        a = comp['insightAId']
        b = comp['insightBId']
        importance = comp.get('importance', 0) 
        polarity = comp.get('polarity', 1)
        idx_a = id_to_idx[a]
        idx_b = id_to_idx[b]
        insight_a_text = next((ins['insightText'] for ins in insights if ins['id'] == a), 'Unknown')
        insight_b_text = next((ins['insightText'] for ins in insights if ins['id'] == b), 'Unknown')
        pred_importance = np.dot(W[:, idx_a], W[:, idx_b]) if N > 0 and args.dimension > 0 else 0
        zero_predictions.append(pred_importance)
        zero_actuals.append(importance * polarity) # This will be 0
        zero_comparison_details.append({
            'insightA': insight_a_text,
            'insightB': insight_b_text,
            'original_importance': importance * polarity,
            'predicted_importance': pred_importance
        })

    # Calculate accuracy statistics for zeros
    zero_predictions = np.array(zero_predictions)
    zero_actuals = np.array(zero_actuals) 
    
    zero_mse = np.mean((zero_predictions - zero_actuals) ** 2) if len(zero_predictions) > 0 else 0
    zero_mae = np.mean(np.abs(zero_predictions - zero_actuals)) if len(zero_predictions) > 0 else 0
    zero_correlation = 0
    # For zero_correlation, actuals are all 0, so std(zero_actuals) will be 0.
    # Correlation is not well-defined in this case or would be NaN/error.
    # We can report 0 or skip. Let's report 0 for consistency if predictions also have no variance.
    if len(zero_predictions) > 1 and np.std(zero_predictions) > 0 : # Check if predictions have variance
         # If actuals are all zero, but predictions vary, the correlation is technically undefined or 0.
         # np.corrcoef might return nan or raise warning.
         # Let's explicitly set to 0 if actuals have no variance.
         pass # zero_correlation remains 0 as initialized

    summary.update({
        'num_zero_comparisons': len(random_pairs),
        'zero_prediction_mse': zero_mse,
        'zero_prediction_mae': zero_mae,
        'zero_prediction_correlation': zero_correlation
    })
    
    # Sort comparison details by absolute difference
    if comparison_details:
        for detail in comparison_details:
            detail['abs_diff'] = abs(detail['predicted_importance'] - detail['original_importance'])
        comparison_details.sort(key=lambda x: x['abs_diff'])
    
    if zero_comparison_details:
        for detail in zero_comparison_details:
            detail['abs_diff'] = abs(detail['predicted_importance'] - detail['original_importance'])
        zero_comparison_details.sort(key=lambda x: x['abs_diff'])

    # Prepare output file paths
    data_dir = args.data_dir
    # emb_path is defined earlier as embedding_matrix_path
    stats_path = os.path.join(data_dir, 'embedding_stats.json')
    summary_path = os.path.join(data_dir, 'embedding_summary.json')
    details_path = os.path.join(data_dir, 'comparison_details.json')
    zero_details_path = os.path.join(data_dir, 'zero_comparison_details.json')

    # Write embedding matrix
    with open(embedding_matrix_path, 'w') as f:
        json.dump(W.tolist(), f)

    # Write stats
    stats_output = {
        **summary, # Includes num_insights, num_comparisons, matrix_density, dimension, prediction_*, zero_prediction_*
        'singular_values': singular_values,
        'explained_variance_ratio': explained_variance_ratio,
    }
    with open(stats_path, 'w') as f:
        json.dump(stats_output, f, indent=2)
    
    # Write summary (which is now the same as a part of stats_output, but kept for compatibility if needed)
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    # Write comparison details
    with open(details_path, 'w') as f:
        json.dump(comparison_details, f, indent=2)

    # Write zero comparison details
    with open(zero_details_path, 'w') as f:
        json.dump(zero_comparison_details, f, indent=2)

    print(f"Embedding matrix written to {embedding_matrix_path}")
    print(f"Stats written to {stats_path}")
    print(f"Summary written to {summary_path}")
    print(f"Comparison details written to {details_path}")
    print(f"Zero comparison details written to {zero_details_path}")


if __name__ == "__main__":
    main() 