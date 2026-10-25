#!/usr/bin/env python3
"""Seal a secret for the project-secret workflow.

Usage: printf '%s' "$VALUE" | python3 scripts/seal-secret.py <base64-public-key>
Prints the base64 sealed value. Needs PyNaCl (scripts/setup.sh installs it).
"""
import base64
import sys

from nacl import encoding, public


def seal(public_key_b64: str, value: bytes) -> str:
    key = public.PublicKey(public_key_b64.encode(), encoding.Base64Encoder())
    return base64.b64encode(public.SealedBox(key).encrypt(value)).decode()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    value = sys.stdin.buffer.read()
    if not value:
        sys.exit("Empty value on stdin.")
    print(seal(sys.argv[1], value))
