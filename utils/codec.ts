export function encode(word: string): string {
  const base64 = Buffer.from(word).toString("base64");
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
  return Buffer.from(base64, "base64").toString();
}
