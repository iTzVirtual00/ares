export type DisplayFormat = "hex" | "unsigned" | "signed";
export type UnitSize = 1 | 2 | 4;

export function getCellWidthChars(bytes: number): number {
    const hexWidth = bytes * 2;
    const unsignedWidth = bytes === 1 ? 3 : bytes === 2 ? 5 : 10;
    const signedWidth = bytes === 1 ? 4 : bytes === 2 ? 6 : 11;
    return Math.max(hexWidth, unsignedWidth, signedWidth);
}

export function formatMemoryValue(value: number, bytes: number, format: DisplayFormat): string {
    switch (format) {
        case "hex": {
            let hex = "";
            for (let i = 0; i < bytes; i++) {
                hex += ((value >> (i * 8)) & 0xFF).toString(16).padStart(2, "0");
            }
            return hex;
        }
        case "unsigned":
            return (value >>> 0).toString();
        case "signed": {
            const shift = 32 - (bytes * 8);
            const signed = (value << shift) >> shift;
            return signed.toString();
        }
    }
}

export function formatRegister(value: number, format: DisplayFormat): string {
    switch (format) {
        case "hex": 
            return "0x" + (value >>> 0).toString(16).padStart(8, "0");
        case "unsigned": 
            return (value >>> 0).toString();
        case "signed": 
            return (value | 0).toString();
    }
}