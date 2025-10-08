import pandas as pd
from datasets import load_dataset
import os
import shutil
from sklearn.model_selection import train_test_split

def download_and_prepare_dataset():
    """Download and prepare the BigBasket dataset from Hugging Face"""
    print("Downloading BigBasket dataset from Hugging Face...")
    
    # Load the dataset
    dataset = load_dataset("AmirMohseni/GroceryList")
    
    # Convert to pandas DataFrame
    df = dataset['train'].to_pandas()
    
    print(f"Dataset loaded with {len(df)} rows")
    print("Columns:", df.columns.tolist())
    
    # Create dataset directory structure
    dataset_dir = "./dataset"
    if os.path.exists(dataset_dir):
        shutil.rmtree(dataset_dir)
    
    os.makedirs(dataset_dir, exist_ok=True)
    
    # Create train/val directories
    train_dir = os.path.join(dataset_dir, "train")
    val_dir = os.path.join(dataset_dir, "val")
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    
    # Split data into train/val (80/20)
    train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)
    
    print(f"Train samples: {len(train_df)}")
    print(f"Validation samples: {len(val_df)}")
    
    # Save train and validation data
    train_df.to_csv(os.path.join(train_dir, "data.csv"), index=False)
    val_df.to_csv(os.path.join(val_dir, "data.csv"), index=False)
    
    # Save full dataset
    df.to_csv(os.path.join(dataset_dir, "full_data.csv"), index=False)
    
    print("Dataset preparation completed!")
    print(f"Dataset saved to {dataset_dir}")
    
    return df

if __name__ == "__main__":
    download_and_prepare_dataset()