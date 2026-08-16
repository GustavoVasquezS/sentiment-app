import { describe, expect, it, vi, afterEach } from "vitest";
import { mlClient } from "../../src/clients/ml.client.js";
import { UpstreamMLError } from "../../src/errors/AppError.js";

const originalFetch = global.fetch;

describe("mlClient", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("maps a successful /predict call to the typed response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ prevision: "Positivo", probabilidad: 0.91, review_required: false }),
    }) as unknown as typeof fetch;

    const result = await mlClient.predict("Excelente producto");

    expect(result.prevision).toBe("Positivo");
    expect(result.probabilidad).toBe(0.91);
  });

  it("throws UpstreamMLError when the ML service responds with a non-2xx status", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;

    await expect(mlClient.predict("texto")).rejects.toBeInstanceOf(UpstreamMLError);
  });

  it("throws UpstreamMLError when the network call itself fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;

    await expect(mlClient.predict("texto")).rejects.toBeInstanceOf(UpstreamMLError);
  });
});
