#!/bin/bash
# Generate Android Release Keystore for Sticker Guard

echo "========================================="
echo "Android Release Keystore Generation"
echo "========================================="
echo ""

KEYSTORE_PATH="android/app/release.keystore"
KEY_ALIAS="sticker-guard-key"

# Check if keystore already exists
if [ -f "$KEYSTORE_PATH" ]; then
    echo "⚠️  Keystore already exists at $KEYSTORE_PATH"
    read -p "Do you want to overwrite? (yes/no): " OVERWRITE
    if [ "$OVERWRITE" != "yes" ]; then
        echo "Cancelled."
        exit 0
    fi
    rm "$KEYSTORE_PATH"
fi

echo "Creating new keystore..."
echo ""

# Generate keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✓ Keystore created successfully!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Encode keystore to base64 for GitHub Secrets:"
    echo "   base64 -i $KEYSTORE_PATH -o ${KEYSTORE_PATH}.base64"
    echo ""
    echo "2. Add secrets to GitHub:"
    echo "   - ANDROID_KEYSTORE_BASE64: (content of ${KEYSTORE_PATH}.base64)"
    echo "   - ANDROID_KEYSTORE_PASSWORD: (password you just entered)"
    echo "   - ANDROID_KEY_ALIAS: $KEY_ALIAS"
    echo "   - ANDROID_KEY_PASSWORD: (key password you just entered)"
    echo ""
    echo "⚠️  IMPORTANT: Keep your passwords safe!"
    echo "   Store them in a secure password manager."
    echo "   If lost, you cannot update your app on Play Store."
else
    echo ""
    echo "✗ Failed to create keystore"
    exit 1
fi
