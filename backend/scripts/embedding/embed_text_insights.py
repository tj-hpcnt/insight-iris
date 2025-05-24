#!/usr/bin/env python3
"""
embed_text_insights.py

Usage:
  python embed_text_insights.py --data_dir path/to/data_folder

This script reads exported insights, comparisons, and the SVD embedding matrix.
It then fits a Ridge Regression model to map text embeddings (from insights)
to the SVD latent space representations. It outputs regression performance
statistics and predicted comparison importances based on this model.
"""

import argparse
import json
import os
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
from collections import defaultdict

def load_json(file_path, file_desc):
    if not os.path.exists(file_path):
        print(f"Error: {file_desc} file not found at {file_path}")
        return None
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_desc} file at {file_path}")
        return None
    except Exception as e:
        print(f"Error loading {file_desc} file at {file_path}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Fit Ridge Regression from text embeddings to SVD latent space")
    parser.add_argument('--data_dir', '-d', type=str, required=True,
                        help="Directory containing inspirations.json, comparisons.json, embedding_matrix.json. Outputs will be written here.")
    args = parser.parse_args()

    # Paths to input files
    insights_path = os.path.join(args.data_dir, 'inspirations.json')
    comparisons_path = os.path.join(args.data_dir, 'comparisons.json')
    embedding_matrix_path = os.path.join(args.data_dir, 'embedding_matrix.json') # SVD W matrix

    # Load insights
    insights = load_json(insights_path, "Insights")
    if insights is None: return
    
    insight_ids = [ins['id'] for ins in insights]
    id_to_idx = {id_: idx for idx, id_ in enumerate(insight_ids)}
    N = len(insight_ids)

    if N == 0:
        print("Error: No insights found in inspirations.json. Exiting.")
        return

    # Load SVD embedding matrix W (K, N)
    W_svd_list = load_json(embedding_matrix_path, "SVD Embedding Matrix")
    if W_svd_list is None: return
    
    try:
        W_svd = np.array(W_svd_list)
    except Exception as e:
        print(f"Error converting SVD embedding matrix to numpy array: {e}")
        return

    dimension = W_svd.shape[0]
    if W_svd.shape[1] != N:
        print(f"Error: SVD embedding matrix number of insights ({W_svd.shape[1]}) does not match number of insights in inspirations.json ({N}).")
        return
    
    latent_representations = W_svd.T  # Shape (N, K)

    # Extract text embeddings from insights
    text_embeddings_list = []
    valid_insight_indices = [] # Keep track of indices of insights that have embeddings

    for i, ins in enumerate(insights):
        if 'embedding' in ins and isinstance(ins['embedding'], list) and len(ins['embedding']) > 0:
            text_embeddings_list.append(ins['embedding'])
            valid_insight_indices.append(i)
        else:
            print(f"Warning: Insight ID {ins.get('id', 'Unknown')} at index {i} is missing a valid text embedding. It will be excluded from Ridge Regression.")

    if not text_embeddings_list:
        print("Error: No valid text embeddings found in any of the insights. Cannot proceed with Ridge Regression.")
        return
        
    text_embeddings = np.array(text_embeddings_list)
    # Filter latent_representations to only include those insights that had text_embeddings
    if not valid_insight_indices: # Should be caught by text_embeddings_list check, but defensive
        print("Error: No valid insight indices after filtering for text_embeddings. Exiting.")
        return
    latent_representations_filtered = latent_representations[valid_insight_indices, :]

    if text_embeddings.shape[0] != latent_representations_filtered.shape[0]:
         print(f"Error: Mismatch after filtering. Text embeddings: {text_embeddings.shape[0]}, Filtered latent representations: {latent_representations_filtered.shape[0]}. This should not happen.")
         return
    
    if text_embeddings.shape[0] < 2 : # Need at least 2 samples for train_test_split
        print(f"Error: Only {text_embeddings.shape[0]} insights with text embeddings available. Need at least 2 for training and testing the Ridge model. Exiting.")
        return

    # Split data into training and testing sets
    test_size_ratio = 0.2
    num_samples = text_embeddings.shape[0]
    
    # Ensure at least one sample in test and one in train if possible
    if num_samples < 5:
        raise ValueError(f"Not enough samples ({num_samples}) to perform a valid train/test split for Ridge model (need at least 1 for train and 1 for test). Exiting.")
    n_test_samples = int(num_samples * test_size_ratio)
    if n_test_samples == 0: # Should not happen if num_samples * test_size_ratio >=1, but defensive
        n_test_samples = 1


    X_train, X_test, y_train, y_test = train_test_split(
        text_embeddings, latent_representations_filtered, test_size=n_test_samples, random_state=42
    )

    if X_train.shape[0] == 0 or X_test.shape[0] == 0:
        print(f"Error: Train or test set is empty after split (Train: {X_train.shape[0]}, Test: {X_test.shape[0]}). Cannot proceed.")
        return

    # Fit Ridge Regression model
    ridge_model = Ridge(alpha=1.0) # Default alpha, can be tuned
    ridge_model.fit(X_train, y_train)

    y_train_pred_latent = ridge_model.predict(X_train)
    train_predicted_importances = []
    num_train_samples_model = y_train_pred_latent.shape[0]
    if num_train_samples_model > 1:
        for i in range(num_train_samples_model):
            for j in range(i + 1, num_train_samples_model):
                pred_importance = np.dot(y_train_pred_latent[i], y_train_pred_latent[j])
                train_predicted_importances.append(pred_importance)
    
    scaling_factor = 1.0 
    if train_predicted_importances:
        train_predicted_importances_np = np.array(train_predicted_importances)
        if train_predicted_importances_np.size > 0:
            max_abs_pred_importance = np.max(np.abs(train_predicted_importances_np))
            scaling_factor = 10.0 / max_abs_pred_importance if max_abs_pred_importance > 0 else 1.0
    
    y_test_pred_latent = ridge_model.predict(X_test)

    mse_latent = mean_squared_error(y_test, y_test_pred_latent)
    mae_latent = mean_absolute_error(y_test, y_test_pred_latent)
    correlation_latent = 0
    if y_test.size > 1 and y_test_pred_latent.size > 1 and y_test.ndim == y_test_pred_latent.ndim and y_test.shape == y_test_pred_latent.shape:
        flat_y_test = y_test.flatten()
        flat_y_pred_latent = y_test_pred_latent.flatten()
        if np.std(flat_y_test) > 0 and np.std(flat_y_pred_latent) > 0:
            correlation_latent = np.corrcoef(flat_y_pred_latent, flat_y_test)[0, 1]
    
    comparisons = load_json(comparisons_path, "Comparisons")
    if comparisons is None: comparisons = []

    ridge_predictions_importance = []
    ridge_actuals_importance = []

    # Build a map for actual comparisons for quick lookup
    original_comparisons_map_text = {}
    for comp_item in comparisons:
        a_id_comp = comp_item['insightAId']
        b_id_comp = comp_item['insightBId']
        importance_comp = comp_item.get('importance', 0)
        polarity_comp = comp_item.get('polarity', 1)
        weight_comp = importance_comp * polarity_comp
        key_comp = tuple(sorted((a_id_comp, b_id_comp)))
        original_comparisons_map_text[key_comp] = weight_comp

    for comp in comparisons:
        a_id = comp['insightAId']
        b_id = comp['insightBId']
        
        if not (a_id in id_to_idx and b_id in id_to_idx and \
                id_to_idx[a_id] in valid_insight_indices and \
                id_to_idx[b_id] in valid_insight_indices):
            continue

        idx_a_original = id_to_idx[a_id]
        idx_b_original = id_to_idx[b_id]

        # Retrieve the original text embeddings directly from the `insights` list using original indices
        emb_a_text = np.array(insights[idx_a_original]['embedding']).reshape(1, -1)
        emb_b_text = np.array(insights[idx_b_original]['embedding']).reshape(1, -1)

        latent_a_pred = ridge_model.predict(emb_a_text)[0]
        latent_b_pred = ridge_model.predict(emb_b_text)[0]
        
        pred_importance = np.dot(latent_a_pred, latent_b_pred) * scaling_factor
        original_importance = comp.get('importance', 0) * comp.get('polarity', 1)
        
        ridge_predictions_importance.append(pred_importance)
        ridge_actuals_importance.append(original_importance)

    ridge_predictions_importance_np = np.array(ridge_predictions_importance)
    ridge_actuals_importance_np = np.array(ridge_actuals_importance)

    ridge_mse_importance = 0
    ridge_mae_importance = 0
    ridge_correlation_importance = 0

    if ridge_predictions_importance_np.size > 0:
        ridge_mse_importance = np.mean((ridge_predictions_importance_np - ridge_actuals_importance_np) ** 2)
        ridge_mae_importance = np.mean(np.abs(ridge_predictions_importance_np - ridge_actuals_importance_np))
    if ridge_predictions_importance_np.size > 1 and np.std(ridge_actuals_importance_np) > 0 and np.std(ridge_predictions_importance_np) > 0:
        ridge_correlation_importance = np.corrcoef(ridge_predictions_importance_np, ridge_actuals_importance_np)[0, 1]

    # --- All Pairs Evaluation (for insights with text embeddings) ---
    all_pairs_text_predictions_importance = []
    all_pairs_text_actuals_importance = []
    all_pairs_text_comparison_details = []
    subject_pairs = defaultdict(list)  # Group pairs by subject
    
    num_valid_insights = text_embeddings.shape[0]

    if num_valid_insights >= 2: # Need at least two insights to form a pair
        for i in range(num_valid_insights):
            for j in range(i + 1, num_valid_insights):
                original_idx_a = valid_insight_indices[i]
                original_idx_b = valid_insight_indices[j]

                insight_a = insights[original_idx_a]
                insight_b = insights[original_idx_b]

                id_a = insight_a['id']
                id_b = insight_b['id']

                # Use pre-filtered text_embeddings
                emb_a_text_pair = text_embeddings[i].reshape(1, -1)
                emb_b_text_pair = text_embeddings[j].reshape(1, -1)

                latent_a_pred_pair = ridge_model.predict(emb_a_text_pair)[0]
                latent_b_pred_pair = ridge_model.predict(emb_b_text_pair)[0]
                
                pred_importance_pair = np.dot(latent_a_pred_pair, latent_b_pred_pair) * scaling_factor
                
                key_pair = tuple(sorted((id_a, id_b)))
                actual_importance_pair = original_comparisons_map_text.get(key_pair, 0.0)
                
                all_pairs_text_predictions_importance.append(pred_importance_pair)
                all_pairs_text_actuals_importance.append(actual_importance_pair)
                
                pair_info = {
                    'insightAId': id_a,
                    'insightBId': id_b,
                    'insightAText': insight_a.get('insightText', 'Unknown'),
                    'insightBText': insight_b.get('insightText', 'Unknown'),
                    'original_importance': actual_importance_pair,
                    'predicted_importance': pred_importance_pair
                }
                all_pairs_text_comparison_details.append(pair_info)
                
                # Group by subject
                subject = insight_a.get('insightSubject', 'Unknown')
                subject_pairs[subject].append(pair_info)

    all_pairs_text_predictions_np = np.array(all_pairs_text_predictions_importance)
    all_pairs_text_actuals_np = np.array(all_pairs_text_actuals_importance)

    all_pairs_text_mse = 0
    all_pairs_text_mae = 0
    all_pairs_text_correlation = 0
    num_all_pairs_evaluated = len(all_pairs_text_comparison_details)

    if num_all_pairs_evaluated > 0:
        all_pairs_text_mse = np.mean((all_pairs_text_predictions_np - all_pairs_text_actuals_np) ** 2)
        all_pairs_text_mae = np.mean(np.abs(all_pairs_text_predictions_np - all_pairs_text_actuals_np))
    
    if num_all_pairs_evaluated > 1:
        std_actuals = np.std(all_pairs_text_actuals_np)
        std_predictions = np.std(all_pairs_text_predictions_np)
        if std_actuals > 0 and std_predictions > 0:
            all_pairs_text_correlation = np.corrcoef(all_pairs_text_predictions_np, all_pairs_text_actuals_np)[0, 1]
        elif std_actuals == 0 and std_predictions == 0 and np.array_equal(all_pairs_text_actuals_np, all_pairs_text_predictions_np): # Both constant and equal
             all_pairs_text_correlation = 1.0

    # Sort pairs by predicted score for each subject
    subject_top_bottom_pairs = {}
    for subject, pairs in subject_pairs.items():
        # Sort by predicted importance
        sorted_pairs = sorted(pairs, key=lambda x: x['predicted_importance'], reverse=True)
        subject_top_bottom_pairs[subject] = {
            'top_20': sorted_pairs[:20],
            'bottom_20': sorted_pairs[-20:]
        }

    regression_stats = {
        'text_embedding_dimension': text_embeddings.shape[1] if text_embeddings.ndim > 1 and text_embeddings.shape[0] > 0 else 0,
        'svd_latent_dimension': dimension,
        'num_insights_total': N,
        'num_insights_with_text_embeddings': text_embeddings.shape[0],
        'num_train_samples_ridge': X_train.shape[0],
        'num_test_samples_ridge': X_test.shape[0],
        'ridge_alpha': ridge_model.alpha,
        'ridge_scaling_factor': scaling_factor,
        'text_to_latent_mapping_mse': mse_latent,
        'text_to_latent_mapping_mae': mae_latent,
        'text_to_latent_mapping_correlation': correlation_latent,
        'importance_prediction_mse_via_ridge': ridge_mse_importance,
        'importance_prediction_mae_via_ridge': ridge_mae_importance,
        'importance_prediction_correlation_via_ridge': ridge_correlation_importance,
        'num_comparisons_evaluated_for_importance': len(ridge_predictions_importance),
        # New stats for all pairs
        'all_pairs_text_embedding_importance_mse': all_pairs_text_mse,
        'all_pairs_text_embedding_importance_mae': all_pairs_text_mae,
        'all_pairs_text_embedding_importance_correlation': all_pairs_text_correlation,
        'num_all_pairs_evaluated_text_ridge': num_all_pairs_evaluated
    }

    regression_stats_path = os.path.join(args.data_dir, 'text_to_latent_regression_stats.json')
    with open(regression_stats_path, 'w') as f:
        json.dump(regression_stats, f, indent=2)
    print(f"Text-to-latent regression stats written to {regression_stats_path}")

    # Write top and bottom pairs for each subject
    top_bottom_pairs_path = os.path.join(args.data_dir, 'text_ridge_subject_top_bottom_pairs.json')
    with open(top_bottom_pairs_path, 'w') as f:
        json.dump(subject_top_bottom_pairs, f, indent=2)
    print(f"Top and bottom pairs by subject written to {top_bottom_pairs_path}")

if __name__ == "__main__":
    main() 