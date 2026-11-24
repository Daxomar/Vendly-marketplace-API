// Short public codes:
//  - resellerCode: in store links, e.g. vendly.com/s/AMA42/gadgets
//  - vendorCode:   in join links,  e.g. vendly.com/join/TECHHUB
import { randomInt } from "node:crypto";

// Letters only, uppercase, from a name: "Ama Mensah" → "AMA"
function lettersFrom(name: string, length: number) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters || "VND").slice(0, length);
}

// "Ama Mensah" → "AMA42". Tries a few times; the caller checks uniqueness.
export async function generateResellerCode(name: string, isTaken: (code: string) => Promise<boolean>) {
  const prefix = lettersFrom(name, 4);
  for (let attempt = 0; attempt < 20; attempt++) {
    const digits = attempt < 10 ? randomInt(10, 100) : randomInt(100, 10000); // widen if busy
    const code = `${prefix}${digits}`;
    if (!(await isTaken(code))) return code;
  }
  throw new Error("Could not generate a unique reseller code");
}

// "Tech Hub GH" → "TECHHUBGH", then "TECHHUBGH2"... if taken
export async function generateVendorCode(businessName: string, isTaken: (code: string) => Promise<boolean>) {
  const base = lettersFrom(businessName, 10);
  let code = base;
  let n = 2;
  while (await isTaken(code)) {
    code = `${base}${n}`;
    n++;
  }
  return code;
}
