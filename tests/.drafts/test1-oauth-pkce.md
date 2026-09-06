# Draft: OAuth 2.0 PKCE Flow Research

## Research Question
What is the OAuth 2.0 Authorization Code flow with PKCE? Cite the specific RFC sections (RFC 7636, RFC 6749). What security properties does PKCE add? What are the code_verifier/code_challenge mechanics?

## Evidence Table

| Claim | Source | Section | Verified |
|-------|--------|---------|----------|
| PKCE mitigates authorization code interception attack | RFC 7636 | Abstract | Yes |
| code_verifier is 43-128 character high-entropy random string | RFC 7636 | Section 4.1 | Yes |
| S256 method: code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier))) | RFC 7636 | Section 4.2 | Yes |
| S256 is Mandatory To Implement (MTI) on server | RFC 7636 | Section 4.2 | Yes |
| code_verifier sent to token endpoint with authorization code | RFC 7636 | Section 4.5 | Yes |
| Server verifies code_verifier by comparing transformed value to stored code_challenge | RFC 7636 | Section 4.6 | Yes |
| Plain method: code_challenge = code_verifier | RFC 7636 | Section 4.2 | Yes |
| Authorization Code flow defined in Section 4.1 of RFC 6749 | RFC 6749 | Section 4.1 | Yes |
| Authorization code must expire within 10 minutes | RFC 6749 | Section 4.1.2 | Yes |
| S256 protects against eavesdropping; plain does not | RFC 7636 | Section 7.2 | Yes |

## Findings

### Overview
PKCE (Proof Key for Code Exchange, pronounced "pixy") is defined in RFC 7636 (September 2015) as an extension to OAuth 2.0 (RFC 6749, October 2012). It protects public clients using the Authorization Code Grant from authorization code interception attacks.

### Flow Steps (RFC 7636 Section 4)
1. **Client Creates Code Verifier** (Section 4.1): A high-entropy cryptographic random string of 43-128 characters using unreserved characters [A-Z]/[a-z]/[0-9]/"-"/"."/"_"/"~"
2. **Client Creates Code Challenge** (Section 4.2): Derives challenge from verifier using either:
   - `plain`: code_challenge = code_verifier
   - `S256`: code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
3. **Authorization Request** (Section 4.3): Client sends code_challenge and code_challenge_method with OAuth 2.0 Authorization Request (Section 4.1.1 of RFC 6749)
4. **Server Returns Code** (Section 4.4): Server associates code_challenge and code_challenge_method with the issued authorization code
5. **Token Request** (Section 4.5): Client sends authorization code AND code_verifier to token endpoint
6. **Server Verifies** (Section 4.6): Server calculates code_challenge from received code_verifier and compares it to the stored code_challenge

### Security Properties
- **Mitigates authorization code interception**: An attacker who intercepts the authorization code cannot exchange it for tokens without the code_verifier (RFC 7636 Abstract)
- **S256 protection against eavesdroppers**: Even if code_challenge is observed, the code_verifier cannot be derived from it due to SHA-256 one-way hashing (Section 7.2)
- **Downgrade protection**: Error when S256 is presented can only mean server fault or MITM downgrade attack (Section 7.1)
- **Entropy requirement**: 32-octet random sequence base64url-encoded produces 43-character verifier (Section 4.1)

## Sources
1. RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients (https://www.rfc-editor.org/rfc/rfc7636.html)
2. RFC 6749 - The OAuth 2.0 Authorization Framework (https://www.rfc-editor.org/rfc/rfc6749.html)
3. Auth0 Authorization Code Flow Documentation (https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow)
