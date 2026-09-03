import { describe, it, expect } from "vitest";
import { validateHealthStatus } from "../src/validation/health-status";
import { LilyValidationError } from "../src/errors/sdk-error";

describe("validateHealthStatus", () => {
  describe("non-null object validation", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["number", 123],
      ["string", "healthy"],
      ["boolean", true],
    ])("throws LilyValidationError when data is %s", (_label, value) => {
      expect(() => validateHealthStatus(value)).toThrow(LilyValidationError);
      try {
        validateHealthStatus(value);
      } catch (err) {
        expect(err).toBeInstanceOf(LilyValidationError);
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus must be a non-null object");
      }
    });
  });

  describe("status field validation", () => {
    it("throws when status is missing", () => {
      expect(() => validateHealthStatus({})).toThrow(LilyValidationError);
      try {
        validateHealthStatus({});
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus.status must be a string");
      }
    });

    it.each([
      ["number", 1],
      ["null", null],
      ["boolean", false],
      ["object", {}],
    ])("throws when status is %s", (_label, value) => {
      expect(() => validateHealthStatus({ status: value })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: value });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus.status must be a string");
      }
    });

    it.each(["healthy", "unknown", "UP", "DOWN", "ready", ""])(
      'throws when status is an unrecognized string "%s"',
      (status) => {
        expect(() => validateHealthStatus({ status })).toThrow(
          LilyValidationError,
        );
        try {
          validateHealthStatus({ status });
        } catch (err) {
          const valErr = err as LilyValidationError;
          expect(valErr.code).toBe("VALIDATION_ERROR");
          expect(valErr.message).toBe(
            "HealthStatus.status must be one of: ok, degraded, down",
          );
        }
      },
    );
  });

  describe("version field validation", () => {
    it("throws when version is missing", () => {
      expect(() => validateHealthStatus({ status: "ok", timestamp: "2024-01-01", checks: {} })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: "ok", timestamp: "2024-01-01", checks: {} });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus.version must be a string");
      }
    });

    it.each([
      ["number", 100],
      ["boolean", true],
      ["object", {}],
      ["array", ["1.0.0"]],
    ])("throws when version is present but is %s", (_label, version) => {
      expect(() => validateHealthStatus({ status: "ok", version, timestamp: "2024-01-01", checks: {} })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: "ok", version, timestamp: "2024-01-01", checks: {} });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus.version must be a string");
      }
    });
  });

  describe("timestamp field validation", () => {
    it("throws when timestamp is missing", () => {
      expect(() => validateHealthStatus({ status: "ok", version: "1.0.0", checks: {} })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: "ok", version: "1.0.0", checks: {} });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus.timestamp must be a string");
      }
    });

    it.each([
      ["number", 123],
      ["boolean", true],
      ["object", {}],
    ])("throws when timestamp is present but is %s", (_label, timestamp) => {
      expect(() => validateHealthStatus({ status: "ok", version: "1.0.0", timestamp, checks: {} })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: "ok", version: "1.0.0", timestamp, checks: {} });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus.timestamp must be a string");
      }
    });
  });

  describe("checks field validation", () => {
    it("throws when checks is missing", () => {
      expect(() => validateHealthStatus({ status: "ok", version: "1.0.0", timestamp: "2024-01-01" })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: "ok", version: "1.0.0", timestamp: "2024-01-01" });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toBe("HealthStatus.checks must be an object");
      }
    });

    it.each([
      ["null", null],
      ["array", []],
      ["string", "ok"],
    ])("throws when checks is present but is %s", (_label, checks) => {
      expect(() => validateHealthStatus({ status: "ok", version: "1.0.0", timestamp: "2024-01-01", checks })).toThrow(
        LilyValidationError,
      );
    });

    it("throws when a check value is invalid", () => {
      expect(() => validateHealthStatus({ status: "ok", version: "1.0.0", timestamp: "2024-01-01", checks: { db: "unknown" } })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: "ok", version: "1.0.0", timestamp: "2024-01-01", checks: { db: "unknown" } });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe("VALIDATION_ERROR");
        expect(valErr.message).toContain("checks[db]");
      }
    });
  });

  describe("valid payloads", () => {
    it.each(["ok", "degraded", "down"] as const)(
      'passes and returns valid status "%s"',
      (status) => {
        const payload = { status, version: "1.0.0", timestamp: "2024-01-01T00:00:00Z", checks: { db: status } };
        const result = validateHealthStatus(payload);
        expect(result).toEqual(payload);
      },
    );

    it("passes with all required fields", () => {
      const payload = {
        status: "ok",
        version: "1.2.3",
        timestamp: "2024-01-01T00:00:00Z",
        checks: { db: "ok", cache: "degraded" },
      };
      const result = validateHealthStatus(payload);
      expect(result).toEqual(payload);
    });
  });
});
