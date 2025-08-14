# Development Certificates

These are self-signed certificates generated for local development and testing.

## Files

- `dev_private.key` - Private key
- `dev_certificate.crt` - Certificate (PEM format)
- `dev_certificate.pfx` - Certificate (PFX format for Windows)
- `dev_certificate.p12` - Certificate (P12 format for macOS)
- `dev_cert.csr` - Certificate signing request

## Usage

These certificates are automatically used by the development build process. The password for all
certificates is: `devpassword`

## Security Notice

⚠️ **These are self-signed certificates for development only!**

- Do not use in production
- Do not commit to version control
- Regenerate if compromised

## Regenerating Certificates

To regenerate these certificates, run:

```bash
./scripts/generate-dev-cert.sh
```
