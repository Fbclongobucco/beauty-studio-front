// Gera os PNGs da logo do Longo Bucco Beauty Studio.
// Uso: npm run logo
// Saída: public/brand/logo.png (1024), logo-512.png, logo-mark.png,
//        icon.png (512), icon-192.png, icon-maskable.png (512) e apple-icon.png (180).
// Fontes OFL em scripts/fonts/ (licenças ao lado de cada arquivo).
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";
import sharp from "sharp";

const h = React.createElement;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const font = (f) => readFile(path.join(root, "scripts/fonts", f));

// Paleta amostrada do flyer de reinauguração.
const C = {
  ringLight: "#E9C2A6",
  ringMid: "#B97A5F",
  ringDark: "#8A4F3A",
  inner: "#F6E3D7",
  innerEdge: "#EFD2C2",
  text: "#7A3E2C",
  textDark: "#5A2A1C",
};

const metal = `linear-gradient(135deg, ${C.ringMid} 0%, ${C.ringLight} 30%, ${C.ringDark} 55%, ${C.ringMid} 75%, ${C.ringLight} 100%)`;
const metalText = `linear-gradient(160deg, #874B36 0%, #B87C61 35%, #5E2B1E 60%, #93573F 100%)`;

function Heart({ size, color }) {
  return h(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24" },
    h("path", {
      d: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
      fill: color,
      stroke: color,
      strokeWidth: 1,
    }),
  );
}

// Monograma "LB" (como no flyer): L serifado alto, com laço caligráfico na base,
// e B serifado sobreposto à direita, mais baixo.
function Monogram({ size }) {
  const s = size / 100;
  const letter = (ch, left, top, fs) =>
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: left * s,
          top: top * s,
          fontFamily: "Playfair",
          fontSize: fs * s,
          lineHeight: 1,
          backgroundImage: metalText,
          backgroundClip: "text",
          color: "transparent",
        },
      },
      ch,
    );
  return h(
    "div",
    { style: { position: "relative", width: size, height: size, display: "flex" } },
    letter("I", 24, -8, 104),
    letter("B", 40, 12, 82),
    // Laço do L: sai da base da haste, faz a volta à esquerda e corre sob o B.
    h(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 100 100",
        style: { position: "absolute", left: 0, top: 0 },
      },
      h("path", {
        d: "M34 80 C 31 88, 20 94, 10 91 C 2 88, 6 79, 18 81 C 32 83, 44 93, 60 93 C 70 93, 78 91, 86 88",
        fill: "none",
        stroke: C.ringDark,
        strokeWidth: 2.2,
        strokeLinecap: "round",
      }),
    ),
  );
}

function Ring({ d }) {
  const band = Math.round(d * 0.022);
  return h(
    "div",
    {
      style: {
        width: d,
        height: d,
        borderRadius: d,
        backgroundImage: metal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    h(
      "div",
      {
        style: {
          width: d - band * 2,
          height: d - band * 2,
          borderRadius: d,
          backgroundImage: `radial-gradient(circle at 50% 40%, ${C.inner} 0%, ${C.inner} 55%, ${C.innerEdge} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      h(Monogram, { size: Math.round(d * 0.66) }),
    ),
  );
}

function FullLogo({ w }) {
  const u = w / 100;
  return h(
    "div",
    {
      style: {
        width: w,
        height: Math.round(w * 1.02),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "transparent",
      },
    },
    h(Ring, { d: Math.round(w * 0.62) }),
    h(
      "div",
      {
        style: {
          marginTop: 5 * u,
          fontFamily: "Cinzel",
          fontWeight: 600,
          fontSize: 10.4 * u,
          letterSpacing: 0.6 * u,
          lineHeight: 1,
          backgroundImage: metalText,
          backgroundClip: "text",
          color: "transparent",
        },
      },
      "LONGO BUCCO",
    ),
    h(
      "div",
      {
        style: {
          marginTop: 2.4 * u,
          fontFamily: "Cinzel",
          fontWeight: 400,
          fontSize: 5 * u,
          letterSpacing: 1.6 * u,
          lineHeight: 1,
          color: C.textDark,
        },
      },
      "BEAUTY STUDIO",
    ),
    h(
      "div",
      {
        style: {
          marginTop: 3 * u,
          display: "flex",
          alignItems: "center",
          gap: 2 * u,
        },
      },
      h("div", { style: { width: 22 * u, height: Math.max(2, 0.25 * u), background: C.ringMid } }),
      h(Heart, { size: 4.2 * u, color: C.textDark }),
      h("div", { style: { width: 22 * u, height: Math.max(2, 0.25 * u), background: C.ringMid } }),
    ),
  );
}

async function render(element, width, height, fonts) {
  const res = new ImageResponse(element, { width, height, fonts });
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const fonts = [
    { name: "Cinzel", data: await font("Cinzel-Regular.ttf"), weight: 400, style: "normal" },
    { name: "Cinzel", data: await font("Cinzel-SemiBold.ttf"), weight: 600, style: "normal" },
    { name: "Playfair", data: await font("PlayfairDisplay-Regular.ttf"), weight: 400, style: "normal" },
    { name: "Pinyon", data: await font("PinyonScript-Regular.ttf"), weight: 400, style: "normal" },
  ];

  const brandDir = path.join(root, "public/brand");
  await mkdir(brandDir, { recursive: true });

  const W = 1024;
  const full = await render(h(FullLogo, { w: W }), W, Math.round(W * 1.02), fonts);
  const fullTrim = await sharp(full).trim({ threshold: 1 }).png().toBuffer();
  await writeFile(path.join(brandDir, "logo.png"), await sharp(fullTrim).resize({ width: 1024 }).png().toBuffer());
  await writeFile(path.join(brandDir, "logo-512.png"), await sharp(fullTrim).resize({ width: 512 }).png().toBuffer());

  const M = 1024;
  const markBuf = await render(
    h("div", { style: { width: M, height: M, display: "flex", alignItems: "center", justifyContent: "center" } }, h(Ring, { d: M - 16 })),
    M,
    M,
    fonts,
  );
  await writeFile(path.join(brandDir, "logo-mark.png"), markBuf);
  await writeFile(path.join(brandDir, "icon.png"), await sharp(markBuf).resize(512, 512).png().toBuffer());
  await writeFile(path.join(brandDir, "icon-192.png"), await sharp(markBuf).resize(192, 192).png().toBuffer());

  // Versões com fundo creme: maskable (PWA, monograma dentro da zona segura de 80%)
  // e apple-icon (iOS não aceita transparência e preencheria de preto).
  const onCream = async (size, scale) => {
    const inner = Math.round(size * scale);
    const mark = await sharp(markBuf).resize(inner, inner).png().toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: "#FBF1E5" } })
      .composite([{ input: mark, gravity: "center" }])
      .png()
      .toBuffer();
  };
  await writeFile(path.join(brandDir, "icon-maskable.png"), await onCream(512, 0.72));
  await writeFile(path.join(brandDir, "apple-icon.png"), await onCream(180, 0.86));

  for (const f of ["public/brand/logo.png", "public/brand/logo-512.png", "public/brand/logo-mark.png", "public/brand/icon.png", "public/brand/icon-192.png", "public/brand/icon-maskable.png", "public/brand/apple-icon.png"]) {
    const m = await sharp(path.join(root, f)).metadata();
    console.log(`${f}: ${m.width}x${m.height} alpha=${m.hasAlpha}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
