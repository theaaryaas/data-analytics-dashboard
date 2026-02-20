import pandas as pd
import json
import io
from datetime import datetime
from typing import Dict, Any

class FileProcessor:
    """Handles CSV, Excel, and JSON file processing"""

    @staticmethod
    def _fix_dates(df: pd.DataFrame) -> pd.DataFrame:
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].astype(str)
        return df

    @staticmethod
    def process_csv(file_content: bytes) -> Dict[str, Any]:
        try: return FileProcessor._prepare_response(FileProcessor._fix_dates(pd.read_csv(io.BytesIO(file_content), parse_dates=False)))
        except Exception as e: raise ValueError(f"CSV processing error: {e}")

    @staticmethod
    def process_excel(file_content: bytes) -> Dict[str, Any]:
        try: return FileProcessor._prepare_response(FileProcessor._fix_dates(pd.read_excel(io.BytesIO(file_content), parse_dates=False)))
        except Exception as e: raise ValueError(f"Excel processing error: {e}")

    @staticmethod
    def process_json(file_content: bytes) -> Dict[str, Any]:
        try:
            data = json.loads(file_content.decode('utf-8'))
            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                df = pd.DataFrame(data['data']) if 'data' in data and isinstance(data['data'], list) else pd.json_normalize(data)
            else:
                raise ValueError("Unsupported JSON structure")
            return FileProcessor._prepare_response(df)
        except Exception as e:
            raise ValueError(f"JSON processing error: {e}")

    @staticmethod
    def _convert_timestamps(obj):
        fmt = lambda dt: dt.strftime('%Y-%m-%d' if (dt.hour, dt.minute, dt.second) == (0, 0, 0) else '%Y-%m-%d %H:%M:%S')
        if isinstance(obj, (pd.Timestamp, datetime)): return fmt(obj)
        if isinstance(obj, dict): return {k: FileProcessor._convert_timestamps(v) for k, v in obj.items()}
        if isinstance(obj, list): return [FileProcessor._convert_timestamps(i) for i in obj]
        if pd.isna(obj): return None
        return obj

    @staticmethod
    def _prepare_response(df: pd.DataFrame) -> Dict[str, Any]:
        stats = {col: {'mean': float(df[col].mean()), 'min': float(df[col].min()), 'max': float(df[col].max()), 'std': float(df[col].std())} for col in df.columns if pd.api.types.is_numeric_dtype(df[col])}
        convert = lambda d: FileProcessor._convert_timestamps(d)
        return {'columns': df.columns.tolist(), 'preview': convert(df.head(100).to_dict(orient='records')), 'row_count': int(len(df)), 'stats': stats}

    @staticmethod
    def analyze_data(df: pd.DataFrame, analysis_type: str) -> Dict[str, Any]:
        if analysis_type == 'summary': return {'summary': df.describe().to_dict(), 'null_counts': df.isnull().sum().to_dict(), 'unique_counts': df.nunique().to_dict()}
        if analysis_type == 'correlation': return {'correlation': (numeric_df := df.select_dtypes(include=['number'])).corr().to_dict() if len(numeric_df.columns) > 1 else {}}
        return {}