function arrayBufferToBase64 (array) {
    let binary = '';
    const bytes = new Uint8Array(array);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = `data:image/png;base64,${window.btoa(binary)}`;
    return base64;
}
export default arrayBufferToBase64;
