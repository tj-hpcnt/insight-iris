#!/usr/bin/env python3
"""
score_random_profiles.py

Usage:
  python score_random_profiles.py --data_dir path/to/data_folder

This script takes the outputs of embed_insights.py and simulates a comparison 
of 50 pairs of random profiles. Each profile comprises 25 random insights 
selected from the set. The script prints all selected insights, then computes 
scores by summing the importance of the ones in the comparisons as well as 
using the embedding predictions.
"""

import argparse
import json
import os
import numpy as np
import random
from collections import defaultdict
from itertools import combinations


def load_data(data_dir):
    """Load all necessary data files."""
    # Load insights
    insights_path = os.path.join(data_dir, 'inspirations.json')
    with open(insights_path, 'r') as f:
        insights = json.load(f)
    
    # Load comparisons
    comparisons_path = os.path.join(data_dir, 'comparisons.json')
    with open(comparisons_path, 'r') as f:
        comparisons = json.load(f)
    
    # Load embedding matrix
    embedding_matrix_path = os.path.join(data_dir, 'embedding_matrix.json')
    with open(embedding_matrix_path, 'r') as f:
        embedding_matrix = np.array(json.load(f))
    
    return insights, comparisons, embedding_matrix


def create_comparison_lookup(comparisons):
    """Create a lookup dictionary for original comparisons."""
    comparison_lookup = {}
    for comp in comparisons:
        a = comp['insightAId']
        b = comp['insightBId']
        importance = comp.get('importance', 0)
        polarity = comp.get('polarity', 1)
        weight = importance * polarity
        
        # Store with both orderings for easy lookup
        comparison_lookup[(a, b)] = weight
        comparison_lookup[(b, a)] = weight
    
    return comparison_lookup


def generate_random_profile(insights, profile_size=25):
    """Generate a random profile by selecting random insights."""
    if len(insights) < profile_size:
        raise ValueError(f"Not enough insights ({len(insights)}) to create profile of size {profile_size}")
    
    selected_insights = random.sample(insights, profile_size)
    return selected_insights


def calculate_profile_scores(profile_a, profile_b, comparison_lookup, embedding_matrix, id_to_idx):
    """Calculate scores between two profiles using both original comparisons and embeddings."""
    original_score = 0
    embedding_score = 0
    comparison_count = 0
    
    # Track individual pair contributions
    pair_contributions = []
    
    # Get all pairs between the two profiles
    for insight_a in profile_a:
        for insight_b in profile_b:
            id_a = insight_a['id']
            id_b = insight_b['id']
            
            original_contrib = 0
            embedding_contrib = 0
            
            # Original comparison score
            if (id_a, id_b) in comparison_lookup:
                original_contrib = comparison_lookup[(id_a, id_b)]
                original_score += original_contrib
                comparison_count += 1
            
            # Embedding score
            if id_a in id_to_idx and id_b in id_to_idx:
                idx_a = id_to_idx[id_a]
                idx_b = id_to_idx[id_b]
                embedding_contrib = np.dot(embedding_matrix[:, idx_a], embedding_matrix[:, idx_b])
                embedding_score += embedding_contrib
            
            # Store pair contribution info
            pair_info = {
                'insight_a': {
                    'id': id_a,
                    'subject': insight_a.get('insightSubject', 'Unknown'),
                    'text': insight_a['insightText'][:100] + '...' if len(insight_a['insightText']) > 100 else insight_a['insightText']
                },
                'insight_b': {
                    'id': id_b,
                    'subject': insight_b.get('insightSubject', 'Unknown'),
                    'text': insight_b['insightText'][:100] + '...' if len(insight_b['insightText']) > 100 else insight_b['insightText']
                },
                'original_contribution': original_contrib,
                'embedding_contribution': embedding_contrib,
                'has_explicit_comparison': (id_a, id_b) in comparison_lookup
            }
            pair_contributions.append(pair_info)
    
    return {
        'original_score': original_score,
        'embedding_score': embedding_score,
        'comparison_count': comparison_count,
        'total_pairs': len(profile_a) * len(profile_b),
        'pair_contributions': pair_contributions
    }


def print_profile(profile, profile_name):
    """Print a profile's insights in a readable format."""
    print(f"\n{profile_name}:")
    print("=" * 50)
    
    # Sort insights by subject
    sorted_profile = sorted(profile, key=lambda x: x.get('insightSubject', 'Unknown'))
    
    for i, insight in enumerate(sorted_profile, 1):
        subject = insight.get('insightSubject', 'Unknown')
        text = insight['insightText']
        print(f"{i:2d}. [{subject}] {text}")


def print_top_bottom_pairs(pair_contributions, approach_name, score_key, top_n=5):
    """Print the top and bottom N pairs for a given scoring approach."""
    # Filter out pairs with zero contribution for this approach
    non_zero_pairs = [p for p in pair_contributions if p[score_key] != 0]
    
    if not non_zero_pairs:
        print(f"\nNo pairs with non-zero {approach_name} scores found.")
        return
    
    # Sort by contribution (descending for top, ascending for bottom)
    sorted_pairs = sorted(non_zero_pairs, key=lambda x: x[score_key], reverse=True)
    
    print(f"\n{approach_name.upper()} APPROACH - TOP {min(top_n, len(sorted_pairs))} PAIRS:")
    print("-" * 80)
    for i, pair in enumerate(sorted_pairs[:top_n]):
        print(f"{i+1}. Score: {pair[score_key]:.4f}")
        print(f"   A: [{pair['insight_a']['subject']}] {pair['insight_a']['text']}")
        print(f"   B: [{pair['insight_b']['subject']}] {pair['insight_b']['text']}")
        if approach_name == "original" and pair['has_explicit_comparison']:
            print(f"   (Explicit comparison found)")
        print()
    
    if len(sorted_pairs) > top_n:
        print(f"{approach_name.upper()} APPROACH - BOTTOM {min(top_n, len(sorted_pairs))} PAIRS:")
        print("-" * 80)
        bottom_pairs = sorted_pairs[-top_n:] if len(sorted_pairs) >= top_n else []
        for i, pair in enumerate(reversed(bottom_pairs)):
            print(f"{len(bottom_pairs)-i}. Score: {pair[score_key]:.4f}")
            print(f"   A: [{pair['insight_a']['subject']}] {pair['insight_a']['text']}")
            print(f"   B: [{pair['insight_b']['subject']}] {pair['insight_b']['text']}")
            if approach_name == "original" and pair['has_explicit_comparison']:
                print(f"   (Explicit comparison found)")
            print()


def print_overall_top_bottom_pairs(pair_contributions, approach_name, score_key, top_n=5):
    """Print the top and bottom N pairs for a given scoring approach across all comparisons."""
    # Filter out pairs with zero contribution for this approach
    non_zero_pairs = [p for p in pair_contributions if p[score_key] != 0]
    
    if not non_zero_pairs:
        print(f"\nNo pairs with non-zero {approach_name} scores found.")
        return
    
    # Sort by contribution (descending for top, ascending for bottom)
    sorted_pairs = sorted(non_zero_pairs, key=lambda x: x[score_key], reverse=True)
    
    print(f"\n{approach_name.upper()} APPROACH - TOP {min(top_n, len(sorted_pairs))} PAIRS:")
    print("-" * 80)
    for i, pair in enumerate(sorted_pairs[:top_n]):
        print(f"{i+1}. Score: {pair[score_key]:.4f} (Profile Pair {pair['profile_pair']})")
        print(f"   A: [{pair['insight_a']['subject']}] {pair['insight_a']['text']}")
        print(f"   B: [{pair['insight_b']['subject']}] {pair['insight_b']['text']}")
        if approach_name == "original" and pair['has_explicit_comparison']:
            print(f"   (Explicit comparison found)")
        print()
    
    if len(sorted_pairs) > top_n:
        print(f"{approach_name.upper()} APPROACH - BOTTOM {min(top_n, len(sorted_pairs))} PAIRS:")
        print("-" * 80)
        bottom_pairs = sorted_pairs[-top_n:] if len(sorted_pairs) >= top_n else []
        for i, pair in enumerate(reversed(bottom_pairs)):
            print(f"{len(bottom_pairs)-i}. Score: {pair[score_key]:.4f} (Profile Pair {pair['profile_pair']})")
            print(f"   A: [{pair['insight_a']['subject']}] {pair['insight_a']['text']}")
            print(f"   B: [{pair['insight_b']['subject']}] {pair['insight_b']['text']}")
            if approach_name == "original" and pair['has_explicit_comparison']:
                print(f"   (Explicit comparison found)")
            print()


def main():
    parser = argparse.ArgumentParser(description="Score random profiles using embedding outputs")
    parser.add_argument('--data_dir', '-d', type=str, required=True,
                        help="Directory containing the outputs from embed_insights.py")
    parser.add_argument('--num_pairs', '-n', type=int, default=50,
                        help="Number of profile pairs to generate (default: 50)")
    parser.add_argument('--profile_size', '-s', type=int, default=25,
                        help="Number of insights per profile (default: 25)")
    parser.add_argument('--seed', type=int, default=42,
                        help="Random seed for reproducibility (default: 42)")
    args = parser.parse_args()

    # Set random seed for reproducibility
    random.seed(args.seed)
    np.random.seed(args.seed)

    print(f"Loading data from {args.data_dir}...")
    insights, comparisons, embedding_matrix = load_data(args.data_dir)
    
    # Create mappings
    id_to_idx = {insight['id']: idx for idx, insight in enumerate(insights)}
    comparison_lookup = create_comparison_lookup(comparisons)
    
    print(f"Loaded {len(insights)} insights, {len(comparisons)} comparisons")
    print(f"Embedding matrix shape: {embedding_matrix.shape}")
    print(f"Generating {args.num_pairs} pairs of profiles with {args.profile_size} insights each...")
    
    # Generate and score profile pairs
    results = []
    
    for pair_idx in range(args.num_pairs):
        print(f"\n{'='*80}")
        print(f"PROFILE PAIR {pair_idx + 1}")
        print(f"{'='*80}")
        
        # Generate two random profiles
        profile_a = generate_random_profile(insights, args.profile_size)
        profile_b = generate_random_profile(insights, args.profile_size)
        
        # Print both profiles
        print_profile(profile_a, f"Profile A (Pair {pair_idx + 1})")
        print_profile(profile_b, f"Profile B (Pair {pair_idx + 1})")
        
        # Calculate scores
        scores = calculate_profile_scores(profile_a, profile_b, comparison_lookup, 
                                        embedding_matrix, id_to_idx)
        
        # Print comparison results
        print(f"\nCOMPARISON RESULTS:")
        print(f"-" * 30)
        print(f"Original Score (sum of explicit comparisons): {scores['original_score']:.4f}")
        print(f"Embedding Score (sum of dot products): {scores['embedding_score']:.4f}")
        print(f"Explicit comparisons found: {scores['comparison_count']} out of {scores['total_pairs']} total pairs")
        print(f"Coverage: {scores['comparison_count'] / scores['total_pairs'] * 100:.2f}%")
        
        # Print top and bottom pairs
        print_top_bottom_pairs(scores['pair_contributions'], 'original', 'original_contribution')
        print_top_bottom_pairs(scores['pair_contributions'], 'embedding', 'embedding_contribution')
        
        # Store results
        result = {
            'pair_index': pair_idx + 1,
            'profile_a_ids': [insight['id'] for insight in profile_a],
            'profile_b_ids': [insight['id'] for insight in profile_b],
            'scores': scores
        }
        results.append(result)
    
    # Summary statistics
    print(f"\n{'='*80}")
    print("SUMMARY STATISTICS")
    print(f"{'='*80}")
    
    original_scores = [r['scores']['original_score'] for r in results]
    embedding_scores = [r['scores']['embedding_score'] for r in results]
    comparison_counts = [r['scores']['comparison_count'] for r in results]
    coverages = [r['scores']['comparison_count'] / r['scores']['total_pairs'] for r in results]
    
    print(f"Original Scores - Mean: {np.mean(original_scores):.4f}, Std: {np.std(original_scores):.4f}")
    print(f"Embedding Scores - Mean: {np.mean(embedding_scores):.4f}, Std: {np.std(embedding_scores):.4f}")
    print(f"Comparison Counts - Mean: {np.mean(comparison_counts):.2f}, Std: {np.std(comparison_counts):.2f}")
    print(f"Coverage - Mean: {np.mean(coverages)*100:.2f}%, Std: {np.std(coverages)*100:.2f}%")
    
    # Correlation between original and embedding scores
    if len(original_scores) > 1:
        correlation = np.corrcoef(original_scores, embedding_scores)[0, 1]
        print(f"Correlation between original and embedding scores: {correlation:.4f}")
    
    # Aggregate all pair contributions for overall top/bottom analysis
    all_original_pairs = []
    all_embedding_pairs = []
    
    for result in results:
        for pair in result['scores']['pair_contributions']:
            if pair['original_contribution'] != 0:
                pair_copy = pair.copy()
                pair_copy['profile_pair'] = result['pair_index']
                all_original_pairs.append(pair_copy)
            
            if pair['embedding_contribution'] != 0:
                pair_copy = pair.copy()
                pair_copy['profile_pair'] = result['pair_index']
                all_embedding_pairs.append(pair_copy)
    
    # Show overall top and bottom pairs across all comparisons
    print(f"\n{'='*80}")
    print("OVERALL TOP AND BOTTOM PAIRS ACROSS ALL COMPARISONS")
    print(f"{'='*80}")
    
    if all_original_pairs:
        print_overall_top_bottom_pairs(all_original_pairs, 'original', 'original_contribution')
    
    if all_embedding_pairs:
        print_overall_top_bottom_pairs(all_embedding_pairs, 'embedding', 'embedding_contribution')
    
    # Save results to file
    output_path = os.path.join(args.data_dir, 'random_profile_scores.json')
    output_data = {
        'parameters': {
            'num_pairs': args.num_pairs,
            'profile_size': args.profile_size,
            'seed': args.seed
        },
        'summary_stats': {
            'original_scores_mean': np.mean(original_scores),
            'original_scores_std': np.std(original_scores),
            'embedding_scores_mean': np.mean(embedding_scores),
            'embedding_scores_std': np.std(embedding_scores),
            'comparison_counts_mean': np.mean(comparison_counts),
            'coverage_mean': np.mean(coverages),
            'correlation': correlation if len(original_scores) > 1 else None
        },
        'results': results
    }
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\nResults saved to {output_path}")


if __name__ == "__main__":
    main() 