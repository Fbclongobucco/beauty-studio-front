import { describe, expect, it } from "vitest";
import { detectImageType } from "./photo";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("detectImageType", () => {
  it("reconhece JPEG, PNG e WebP pela assinatura", () => {
    expect(detectImageType(bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]))).toBe("image/jpeg");
    expect(detectImageType(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))).toBe("image/png");
    expect(detectImageType(bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 "))).toBe("image/webp");
  });

  it("recusa PDF renomeado, outros RIFF e arquivo vazio", () => {
    expect(detectImageType(bytes("%PDF-1.7\n"))).toBeNull();
    expect(detectImageType(bytes("RIFF", [0x24, 0, 0, 0], "WAVEfmt "))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
    expect(detectImageType(bytes([0xff, 0xd8]))).toBeNull();
  });
});
