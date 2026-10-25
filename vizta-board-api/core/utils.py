"""
Shared utilities: field encryption, helpers.
"""
import base64
import hashlib
import os
from typing import Optional

from django.conf import settings


def _get_encryption_key() -> bytes:
    """Derive a 32-byte key from FIELD_ENCRYPTION_KEY setting."""
    raw = settings.FIELD_ENCRYPTION_KEY.encode()
    return hashlib.sha256(raw).digest()


def encrypt_field(plaintext: str) -> str:
    """AES-256-CBC encryption. Returns base64-encoded ciphertext:iv."""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives import padding

    key = _get_encryption_key()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    padder = padding.PKCS7(128).padder()
    padded = padder.update(plaintext.encode()) + padder.finalize()
    ct = encryptor.update(padded) + encryptor.finalize()

    payload = base64.b64encode(ct).decode() + ":" + base64.b64encode(iv).decode()
    return payload


def decrypt_field(payload: str) -> Optional[str]:
    """Decrypt value encrypted by encrypt_field. Returns None on failure."""
    try:
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives import padding

        ct_b64, iv_b64 = payload.split(":")
        ct = base64.b64decode(ct_b64)
        iv = base64.b64decode(iv_b64)

        key = _get_encryption_key()
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded = decryptor.update(ct) + decryptor.finalize()

        unpadder = padding.PKCS7(128).unpadder()
        return (unpadder.update(padded) + unpadder.finalize()).decode()
    except Exception:
        return None


def generate_invoice_number(owner_id: str) -> str:
    """Generate a sequential invoice number. INV-{OWNER_SUFFIX}-{SEQ}"""
    from apps.finance.models import Invoice

    suffix = str(owner_id)[-6:].upper()
    count = Invoice.objects.filter(booking__billboard__owner_id=owner_id).count() + 1
    return f"INV-{suffix}-{count:06d}"
