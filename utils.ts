
export function string_to_bytes(text: string) : number[] {
    const result : number[] = []

    for (const element of text) {
        result.push(element.charCodeAt(0))
    }

    return result

}