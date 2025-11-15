"""
Logging utility for Python backend
"""

import logging
import sys
from typing import Any, Dict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(asctime)s - %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S.%fZ'
)

logger = logging.getLogger(__name__)


def get_logger():
    """Get the application logger"""
    return logger


def log_info(message: str, extra: Dict[str, Any] = None):
    """Log info message"""
    if extra:
        logger.info(f'{message} {extra}')
    else:
        logger.info(message)


def log_error(message: str, extra: Dict[str, Any] = None):
    """Log error message"""
    if extra:
        logger.error(f'{message} {extra}')
    else:
        logger.error(message)


