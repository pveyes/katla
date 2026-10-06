function toBase64(text: string): string {
  let binary = "";
  new TextEncoder().encode(text).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(base64: string): string {
  const binary = atob(base64);
  return new TextDecoder().decode(
    Uint8Array.from(binary, (c) => c.charCodeAt(0))
  );
}

export function encode(word: string): string {
  const base64 = toBase64(word);
  const equalSigns = base64.split("").filter((char) => char === "=").length;
  const withoutEq = base64.replace(/=/g, "");
  let newStr = "";
  for (let i = 0; i < withoutEq.length; i++) {
    newStr += String.fromCharCode(
      withoutEq.charCodeAt(i) + (i % 2 === 0 ? 1 : -1)
    );
  }

  return newStr + equalSigns;
}

export function decode(hash: string): string {
  const [equalSigns, ...chars] = hash.split("").reverse();
  const padding = "=".repeat(Number(equalSigns));
  const base64 =
    chars
      .reverse()
      .map((str, i) => {
        const charCode = str.charCodeAt(0) + (i % 2 === 0 ? -1 : 1);
        return String.fromCharCode(charCode);
      })
      .join("") + padding;
  return fromBase64(base64);
}

const HASHED_SEPARATOR = "::";

export function encodeHashed(
  num: number,
  latestAnswer: string,
  previousAnswer: string
) {
  return encode(
    [num, encode(latestAnswer), encode(previousAnswer)].join(HASHED_SEPARATOR)
  );
}

export function decodeHashed(hashed: string) {
  return decode(hashed).split(HASHED_SEPARATOR);
}
