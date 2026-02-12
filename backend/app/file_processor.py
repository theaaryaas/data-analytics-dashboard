import pandas as pd
import json
import os
from typing import Dict, Any, List
import io

class FileProcessor:
    """Handles CSV, Excel, and JSON file processing"""
    
    @staticmethod
    def process_csv(file_content: bytes) -> Dict[str, Any]:
        """Process CSV file"""
        try:
            # Read CSV from bytes
            df = pd.read_csv(io.BytesIO(file_content))
            return FileProcessor._prepare_response(df)
        except Exception as e:
            raise ValueError(f"CSV processing error: {str(e)}")
    
    @staticmethod
    def process_excel(file_content: bytes) -> Dict[str, Any]:
        """Process Excel file"""
        try:
            # Read Excel from bytes
            df = pd.read_excel(io.BytesIO(file_content))
            return FileProcessor._prepare_response(df)
        except Exception as e:
            raise ValueError(f"Excel processing error: {str(e)}")
    
    @staticmethod
    def process_json(file_content: bytes) -> Dict[str, Any]:
        """Process JSON file"""
        try:
            # Try to parse JSON
            data = json.loads(file_content.decode('utf-8'))
            
            # Handle different JSON structures
            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                # If it's a dict with data in a key
                if 'data' in data and isinstance(data['data'], list):
                    df = pd.DataFrame(data['data'])
                else:
                    # Flatten nested dict
                    df = pd.json_normalize(data)
            else:
                raise ValueError("Unsupported JSON structure")
            
            return FileProcessor._prepare_response(df)
        except Exception as e:
            raise ValueError(f"JSON processing error: {str(e)}")
    
    @staticmethod
    def _prepare_response(df: pd.DataFrame) -> Dict[str, Any]:
        """Prepare standardized response from DataFrame"""
        # Basic statistics
        stats = {}
        for column in df.columns:
            if pd.api.types.is_numeric_dtype(df[column]):
                stats[column] = {
                    'mean': float(df[column].mean()),
                    'min': float(df[column].min()),
                    'max': float(df[column].max()),
                    'std': float(df[column].std())
                }
        
        return {
            'columns': df.columns.tolist(),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'preview': df.head(100).to_dict(orient='records'),
            'row_count': int(len(df)),
            'column_count': int(len(df.columns)),
            'stats': stats,
            'sample_data': df.head(5).to_dict(orient='records')
        }
    
    @staticmethod
    def analyze_data(df: pd.DataFrame, analysis_type: str) -> Dict[str, Any]:
        """Perform basic data analysis"""
        if analysis_type == 'summary':
            return {
                'summary': df.describe().to_dict(),
                'null_counts': df.isnull().sum().to_dict(),
                'unique_counts': df.nunique().to_dict()
            }
        elif analysis_type == 'correlation':
            numeric_df = df.select_dtypes(include=['number'])
            if len(numeric_df.columns) > 1:
                return {'correlation': numeric_df.corr().to_dict()}
            return {'correlation': {}}
        return {}