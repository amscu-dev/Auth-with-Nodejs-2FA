> ⚡ **TL;DR** [Take me straight to the Flow Diagrams](#flow-diagrams)

## Introduction

**Login Sandbox** is a comprehensive authentication platform designed to demonstrate modern, production-grade identity and access management practices. The project showcases a fully-featured, security-focused implementation that adheres to current industry standards, covering both traditional and passwordless authentication workflows.

### Project Resources

- **Live Project:** https://app.loginsandbox.xyz/
- **API Documentation:** https://docs.loginsandbox.xyz/
- **LinkedIn Profile:** https://www.linkedin.com/in/amscu/

## Features

At its core, Login Sandbox provides username-password authentication system extended with **Multi-Factor Authentication (MFA)** using **TOTP (Time-based One-Time Passwords)** to enhance account security. Beyond classical flows, the platform integrates **OpenID Connect (OIDC)** for seamless third-party authentication, currently supporting **Google** and **GitHub** as identity providers.

To highlight secure and frictionless authentication models, the project also implements **Magic Link (passwordless)** login and a fully compliant **WebAuthn / Passkey** system. This includes both **usernameless (discoverable) credentials** and **non-discoverable credentials**, enabling sign-up and sign-in without a password while ensuring strong hardware-backed cryptographic authentication.

Once authenticated, users gain access to account and session management features, such as viewing active sessions, revoking device access, and registering new passkeys. All protected resources are secured using a **token-based authorization architecture** built around **short-lived Access Tokens** and **Refresh Tokens** for persistent sessions .

All API endpoints are rigorously documented using the **OpenAPI specification**, ensuring full transparency, type safety, and predictable integration behavior. Every authentication flow is implemented strictly in accordance with the relevant **IETF RFC standards** governing OAuth 2.0, OIDC, WebAuthn, token lifecycles, and cryptographic ceremonies.

## Tech Stack

- ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) **Full-Stack TypeScript** – shared types across backend & frontend for strict end-to-end type-safety.
- ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white) **Node.js + Express** – backend API, authentication flows, secure session management.
- ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white) **MongoDB (Mongoose)** – primary database with schema validation & strong typing.
- ![OpenAPI](https://img.shields.io/badge/OpenAPI-6BA539?logo=openapiinitiative&logoColor=white) **OpenAPI Specification** – full API documentation and schema-driven backend contracts.
- ![Orval](https://img.shields.io/badge/Orval-000000?logo=swagger&logoColor=white) **Orval** – automatic generation of a **fully typed API client**, synchronized with the backend.
- ![SimpleWebAuthn](https://img.shields.io/badge/SimpleWebAuthn-0A7CAA?logo=webauthn&logoColor=white) **SimpleWebAuthn** – WebAuthn/Passkey support for usernameless & passwordless auth.
- ![Passport.js](https://img.shields.io/badge/Passport.js-34E27A?logo=passport&logoColor=white) **Passport.js** – modular authentication middleware for JWT strategies.
- ![Winston](https://img.shields.io/badge/Winston-5C5C5C?logo=winston&logoColor=white) **Winston** – structured logging with rotating file support.
- ![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white) **Next.js 14** – frontend application with server components, routing & optimized rendering.
- ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38bdf8?logo=tailwind-css&logoColor=white) **TailwindCSS** – utility-first styling, fast UI development, consistent design.
- ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?logo=shadcn&logoColor=white) **shadcn/ui** – reusable, accessible UI components built on Radix primitives.

## Flow Diagrams

### Password Authentication

- Sign Up Flow

<div align="center">
  <img src="./assets/password_signup.jpg" alt="Sequence Diagram" style="width:90%;"/>
</div>

- Sign In with 2FA Flow

<div align="center">
  <img src="./assets/password_signin_mfa.jpg" alt="Sequence Diagram" style="width:90%;"/>
</div>

- Forgot password with 2FA Flow

<div align="center">
  <img src="./assets/password_forgot_password.jpg" alt="Sequence Diagram" style="width:90%;"/>
</div>
