# bwts

Small web app that converts a concrete service URL like:

`https://100.92.209.12:8443/login`

into a Bitwarden-compatible regular expression URI that keeps matching when your Tailscale IP rotates.

## What it does

- Parses an HTTP(S) URL input.
- If the host is in the Tailscale `100.x.x.x` range, it generalizes the last 3 octets.
- Keeps the same port requirement.
- Treats the provided path as a prefix (matches deeper paths, query strings, and hash fragments).
- Outputs a regex string ready for Bitwarden's **Regular Expression** URI match detection.

## Bitwarden usage

1. Generate regex in this app.
2. In your Bitwarden login item, add/edit URI.
3. Set match detection to **Regular Expression**.
4. Paste generated regex as the URI value.
