export const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;

/**
 * Retorna `true` se o arquivo estiver dentro do limite de tamanho permitido.
 * @param file Arquivo a ser validado
 * @param maxBytes Tamanho máximo em bytes (padrão: 1 MB)
 */
export function isFileSizeValid(file: File, maxBytes: number = MAX_IMAGE_SIZE_BYTES): boolean {
  return file.size <= maxBytes;
}

/**
 * Retorna `true` se o arquivo for JPG ou PNG.
 */
export function isFileTypeValid(file: File): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
}
