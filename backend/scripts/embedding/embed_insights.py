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
        # If negative importance encodes negative relationship, this will be included automatically
        weight = importance
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

    # Prepare output file paths
    data_dir = args.data_dir
    emb_path = os.path.join(data_dir, 'embedding_matrix.json')
    stats_path = os.path.join(data_dir, 'embedding_stats.json')
    summary_path = os.path.join(data_dir, 'embedding_summary.json')

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

    print(f"Embedding matrix written to {emb_path}")
    print(f"Stats written to {stats_path}")
    print(f"Summary written to {summary_path}")


if __name__ == "__main__":
    main() 