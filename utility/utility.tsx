export function deepClone<T>(seenData: T): T {
    return JSON.parse(JSON.stringify(seenData))
} 