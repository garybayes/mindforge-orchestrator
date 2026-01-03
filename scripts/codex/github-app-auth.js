import crypto from "crypto";
import fs from "fs";
import { execSync } from "child_process";

/**
 * Minimal GitHub App installation token generator.
 * No external dependencies.
 */

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function runJSON(cmd) {
  return JSON.parse(
    execSync(cmd, { stdio: ["ignore", "pipe", "inherit"] }).toString()
  );
}

export function getInstallationToken({ appId, privateKey, owner }) {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: appId
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const data = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(data);
  signer.end();

  const signature = base64url(
    signer.sign(privateKey)
  );

  const jwt = `${data}.${signature}`;

  // 1. Get installation for org
  const installations = runJSON(
    `curl -s \
      -H "Authorization: Bearer ${jwt}" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/app/installations`
  );

  const installation = installations.find(
    i => i.account?.login === owner
  );

  if (!installation) {
    throw new Error(`No Codex installation found for org: ${owner}`);
  }

  // 2. Create installation token
  const tokenResponse = runJSON(
    `curl -s -X POST \
      -H "Authorization: Bearer ${jwt}" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/app/installations/${installation.id}/access_tokens`
  );

  return tokenResponse.token;
}
