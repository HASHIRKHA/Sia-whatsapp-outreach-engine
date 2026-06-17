"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spinText = spinText;
exports.isValidE164 = isValidE164;
function spinText(template, vars = {}) {
    let result = template;
    const MAX_PASSES = 50;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
        const prev = result;
        result = result.replace(/\{([^{}]*)\}/g, (_match, group) => {
            const options = group.split('|');
            if (options.length > 1) {
                return options[Math.floor(Math.random() * options.length)] ?? '';
            }
            const key = group.trim();
            return vars[key] !== undefined ? vars[key] : '';
        });
        if (result === prev)
            break;
    }
    return result;
}
function isValidE164(phone) {
    return /^\+[1-9]\d{6,14}$/.test(phone);
}
//# sourceMappingURL=spin.js.map