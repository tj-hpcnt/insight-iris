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
    # Store original comparisons for lookup
    original_comparisons_map = {}
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
        # Store for actual value lookup, ensure smaller ID is first for consistent key
        key = tuple(sorted((a, b)))
        original_comparisons_map[key] = {'importance': importance, 'polarity': polarity}

    if not data: # Handle case with no valid comparisons
        # This check might need adjustment if we expect to run even with no explicit comparisons
        # For now, if SVD needs data, this will be caught later.
        print("Warning: No explicit comparison data found. Matrix M will be based on implicit relationships or be empty.")


    M = sparse.coo_matrix((data, (rows, cols)), shape=(N, N))

    # Summary of input data
    num_explicit_comparisons = len(comparisons) # Renamed for clarity
    density = M.nnz / float(N * N) if N > 0 else 0
    summary = {
        'num_insights': N,
        'num_explicit_comparisons': num_explicit_comparisons,
        'matrix_density': density,
        'dimension': args.dimension,
    }
    
    W = np.zeros((args.dimension, N)) # Default W if SVD cannot run

    if M.nnz == 0 and N > 0 and args.dimension > 0 and args.dimension <= N:
        print(f"Warning: Matrix M has no non-zero elements. SVD will run on a zero matrix. Embedding vectors will likely be zero.")
    elif not (N > 0 and args.dimension > 0 and args.dimension <=N):
        # If M.nnz is 0, but other conditions for SVD are not met, this will be caught.
        raise ValueError("SVD cannot run. Conditions: N > 0, args.dimension > 0, and args.dimension <= N must be met.")

    # Perform truncated SVD
    # SVD can run on a zero matrix, it will produce zero singular values and components.
    svd = TruncatedSVD(n_components=args.dimension, random_state=42)
    svd.fit(M)
    
    # Build embedding matrix W of shape (K, N)
    # W = diag(sqrt(singular_values)) @ components
    S_sqrt = np.sqrt(svd.singular_values_)
    # Pad W if n_components_for_svd < args.dimension
    W_svd = (S_sqrt[:, np.newaxis] * svd.components_)
    # Ensure W_svd has the correct shape before assignment
    if W_svd.shape[0] < args.dimension:
        padded_W_svd = np.zeros((args.dimension, N))
        padded_W_svd[:W_svd.shape[0], :] = W_svd
        W[:args.dimension, :] = padded_W_svd
    else:
        W[:args.dimension, :] = W_svd
    
    singular_values = svd.singular_values_.tolist()
    explained_variance_ratio = svd.explained_variance_ratio_.tolist()

    # Compute predictions for ALL unique pairs
    all_pairs_predictions = []
    all_pairs_actuals = []
    all_pairs_details = []

    for i in range(N):
        for j in range(i + 1, N):
            id1 = insight_ids[i]
            id2 = insight_ids[j]
            
            idx_a = id_to_idx[id1]
            idx_b = id_to_idx[id2]

            insight_a_text = next((ins['insightText'] for ins in insights if ins['id'] == id1), 'Unknown')
            insight_b_text = next((ins['insightText'] for ins in insights if ins['id'] == id2), 'Unknown')

            # Determine actual importance
            actual_importance = 0
            key = tuple(sorted((id1, id2)))
            if key in original_comparisons_map:
                comp_data = original_comparisons_map[key]
                actual_importance = comp_data['importance'] * comp_data['polarity']
            
            # Predicted importance
            pred_importance = np.dot(W[:, idx_a], W[:, idx_b]) if args.dimension > 0 else 0
            
            all_pairs_predictions.append(pred_importance)
            all_pairs_actuals.append(actual_importance)
            all_pairs_details.append({
                'insightAId': id1,
                'insightBId': id2,
                'insightAText': insight_a_text,
                'insightBText': insight_b_text,
                'original_importance': actual_importance,
                'predicted_importance': pred_importance
            })

    # Calculate accuracy statistics for all pairs
    all_pairs_predictions_np = np.array(all_pairs_predictions)
    all_pairs_actuals_np = np.array(all_pairs_actuals)
    
    num_total_pairs = len(all_pairs_details)
    mse = np.mean((all_pairs_predictions_np - all_pairs_actuals_np) ** 2) if num_total_pairs > 0 else 0
    mae = np.mean(np.abs(all_pairs_predictions_np - all_pairs_actuals_np)) if num_total_pairs > 0 else 0
    correlation = 0
    if num_total_pairs > 1 and np.std(all_pairs_actuals_np) > 0 and np.std(all_pairs_predictions_np) > 0:
        correlation = np.corrcoef(all_pairs_predictions_np, all_pairs_actuals_np)[0, 1]
    elif num_total_pairs > 1 and np.std(all_pairs_actuals_np) == 0 and np.std(all_pairs_predictions_np) == 0:
        correlation = 1.0 # If both are constant and equal, perfect correlation (e.g. all zeros)
    
    # Update summary with unified accuracy stats
    summary.update({
        'num_total_pairs_evaluated': num_total_pairs,
        'prediction_mse': mse,
        'prediction_mae': mae,
        'prediction_correlation': correlation
    })
    
    # Sort all_pairs_details by absolute difference
    if all_pairs_details:
        for detail in all_pairs_details:
            detail['abs_diff'] = abs(detail['predicted_importance'] - detail['original_importance'])
        # Sort by insightAId, then insightBId for consistent output for "worst" predictions
        # To get worst predictions, sort by abs_diff descending.
        # For general details, could sort by IDs or keep as generated.
        # Let's sort by abs_diff descending to see largest errors first.
        all_pairs_details.sort(key=lambda x: x['abs_diff'], reverse=True)


    # Prepare output file paths
    data_dir = args.data_dir
    # emb_path is defined earlier as embedding_matrix_path
    stats_path = os.path.join(data_dir, 'embedding_stats.json')
    summary_path = os.path.join(data_dir, 'embedding_summary.json')
    details_path = os.path.join(data_dir, 'all_pairs_comparison_details.json') # Renamed for clarity

    # Write embedding matrix
    with open(embedding_matrix_path, 'w') as f:
        json.dump(W.tolist(), f)

    # Write stats
    stats_output = {
        **summary, 
        'singular_values': singular_values,
        'explained_variance_ratio': explained_variance_ratio,
    }
    with open(stats_path, 'w') as f:
        json.dump(stats_output, f, indent=2)
    
    # Write summary (which is now the same as a part of stats_output, but kept for compatibility if needed)
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    # Write all_pairs_details
    with open(details_path, 'w') as f:
        json.dump(all_pairs_details, f, indent=2)

    print(f"Embedding matrix written to {embedding_matrix_path}")
    print(f"Stats written to {stats_path}")
    print(f"Summary written to {summary_path}")
    print(f"All pairs comparison details written to {details_path}")


if __name__ == "__main__":
    main() 