#!/usr/bin/env python3
"""
explain_dimensions.py

Usage:
  python explain_dimensions.py --data_dir path/to/data_folder

This script reads the embedding matrix and insights from embed_insights.py output,
and for each dimension, finds the top and bottom 5 insights by their actual values
(not absolute values). This helps explain what each dimension represents by showing
the most positive and most negative insights for each dimension.
"""

import argparse
import json
import os
import numpy as np
from collections import defaultdict


def main():
    parser = argparse.ArgumentParser(description="Explain embedding dimensions by finding top/bottom insights")
    parser.add_argument('--data_dir', '-d', type=str, required=True,
                        help="Directory containing embedding_matrix.json and inspirations.json")
    args = parser.parse_args()

    # Paths to input files
    insights_path = os.path.join(args.data_dir, 'inspirations.json')
    embedding_matrix_path = os.path.join(args.data_dir, 'embedding_matrix.json')
    output_path = os.path.join(args.data_dir, 'dimension_explanations.json')

    # Check if required files exist
    if not os.path.exists(insights_path):
        raise FileNotFoundError(f"Insights file not found: {insights_path}")
    if not os.path.exists(embedding_matrix_path):
        raise FileNotFoundError(f"Embedding matrix file not found: {embedding_matrix_path}")

    # Load insights
    with open(insights_path, 'r') as f:
        insights = json.load(f)
    
    # Create mapping from index to insight
    insight_lookup = {idx: insight for idx, insight in enumerate(insights)}
    
    # Load embedding matrix
    with open(embedding_matrix_path, 'r') as f:
        embedding_matrix = json.load(f)
    
    W = np.array(embedding_matrix)  # Shape: (K, N) where K is dimensions, N is number of insights
    K, N = W.shape
    
    if N != len(insights):
        raise ValueError(f"Mismatch: embedding matrix has {N} insights but insights file has {len(insights)} insights")

    print(f"Analyzing {K} dimensions for {N} insights...")

    # For each dimension, find top and bottom insights by actual value
    dimension_explanations = {}
    
    for dim in range(K):
        dimension_values = W[dim, :]  # Get all values for this dimension
        
        # Get indices sorted by actual value (descending for top, ascending for bottom)
        sorted_indices = np.argsort(dimension_values)  # Sort ascending by actual value
        
        # Get top 5 (highest values) and bottom 5 (lowest values)
        top_5_indices = sorted_indices[-5:][::-1]  # Last 5, reversed to get highest first
        bottom_5_indices = sorted_indices[:5]  # First 5 (lowest values)
        
        # Prepare top 5 insights (highest values)
        top_insights = []
        for idx in top_5_indices:
            if idx < len(insights):
                insight = insights[idx]
                value = float(dimension_values[idx])
                top_insights.append({
                    'insight_id': insight['id'],
                    'insight_text': insight['insightText'],
                    'insight_subject': insight.get('insightSubject', 'Unknown'),
                    'dimension_value': value
                })
        
        # Prepare bottom 5 insights (lowest values)
        bottom_insights = []
        for idx in bottom_5_indices:
            if idx < len(insights):
                insight = insights[idx]
                value = float(dimension_values[idx])
                bottom_insights.append({
                    'insight_id': insight['id'],
                    'insight_text': insight['insightText'],
                    'insight_subject': insight.get('insightSubject', 'Unknown'),
                    'dimension_value': value
                })
        
        # Calculate dimension statistics
        abs_values = np.abs(dimension_values)
        dim_stats = {
            'mean': float(np.mean(dimension_values)),
            'std': float(np.std(dimension_values)),
            'min': float(np.min(dimension_values)),
            'max': float(np.max(dimension_values)),
            'mean_abs': float(np.mean(abs_values)),
            'median_abs': float(np.median(abs_values))
        }
        
        dimension_explanations[f'dimension_{dim}'] = {
            'dimension_index': dim,
            'statistics': dim_stats,
            'top_5_highest_values': top_insights,
            'bottom_5_lowest_values': bottom_insights
        }
        
        print(f"Dimension {dim}: mean={dim_stats['mean']:.4f}, "
              f"range=[{dim_stats['min']:.4f}, {dim_stats['max']:.4f}]")

    # Also analyze which subjects are most represented in extreme insights across all dimensions
    subject_dimension_analysis = defaultdict(lambda: {'extreme_appearances': 0, 'dimensions': []})
    
    for dim_key, dim_data in dimension_explanations.items():
        dim_idx = dim_data['dimension_index']
        # Count both top and bottom insights as "extreme"
        for insight in dim_data['top_5_highest_values'] + dim_data['bottom_5_lowest_values']:
            subject = insight['insight_subject']
            subject_dimension_analysis[subject]['extreme_appearances'] += 1
            subject_dimension_analysis[subject]['dimensions'].append({
                'dimension': dim_idx,
                'value': insight['dimension_value'],
                'insight_text': insight['insight_text'][:100] + '...' if len(insight['insight_text']) > 100 else insight['insight_text']
            })
    
    # Sort subjects by number of extreme appearances
    sorted_subjects = sorted(subject_dimension_analysis.items(), 
                           key=lambda x: x[1]['extreme_appearances'], reverse=True)
    
    subject_analysis = {}
    for subject, data in sorted_subjects:
        subject_analysis[subject] = {
            'total_extreme_appearances': data['extreme_appearances'],
            'dimensions_appeared_in': data['dimensions']
        }

    # Prepare final output
    output_data = {
        'metadata': {
            'num_dimensions': K,
            'num_insights': N,
            'analysis_description': 'For each dimension, shows top 5 highest values and bottom 5 lowest values'
        },
        'dimension_explanations': dimension_explanations,
        'subject_analysis': subject_analysis
    }

    # Write output
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)

    print(f"\nDimension explanations written to {output_path}")
    print(f"Found {len(subject_analysis)} unique subjects across all dimensions")
    
    # Print summary of top subjects
    print("\nTop subjects by appearance in extreme values (high or low):")
    for subject, data in list(sorted_subjects)[:5]:
        print(f"  {subject}: {data['extreme_appearances']} appearances")


if __name__ == "__main__":
    main() 