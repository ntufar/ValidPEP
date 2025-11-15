"""
Error handling utility
"""

import json
import traceback
from typing import Any, Dict


def handle_error(error: Exception, context: str = '') -> Dict[str, Any]:
    """
    Handle errors and return appropriate HTTP response
    
    Args:
        error: Exception that occurred
        context: Context string (e.g., 'POST /api/validate')
    
    Returns:
        Dictionary with statusCode and body for HTTP response
    """
    error_message = str(error)
    error_type = type(error).__name__
    
    # Log the error
    print(f'[ERROR] {context}: {error_type}: {error_message}')
    print(traceback.format_exc())
    
    # Determine status code based on error type
    status_code = 500
    if 'not found' in error_message.lower() or 'does not exist' in error_message.lower():
        status_code = 404
    elif 'invalid' in error_message.lower() or 'bad request' in error_message.lower():
        status_code = 400
    elif 'unauthorized' in error_message.lower() or 'forbidden' in error_message.lower():
        status_code = 401 if 'unauthorized' in error_message.lower() else 403
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': error_message,
            'error': error_type,
            'context': context
        })
    }

