# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Typed error hierarchy (`LilySdkError`, `LilyConfigError`, `LilyTransportError`, `LilyValidationError`, `LilyAuthenticationError`, `LilyApiError`)
- Fetch-based HTTP transport with retry and timeout support
- SDK configuration resolution and validation (`LilySdkConfig`)
- Domain models for agents, wallets, payments, and identity
- Client modules: `AgentClient`, `WalletClient`, `PaymentClient`, `IdentityClient`, `SystemClient`
- Runnable quickstart example
- Contributor onboarding documentation

### Changed
- Initial package scaffolding and build toolchain (tsup, vitest, eslint, prettier)
