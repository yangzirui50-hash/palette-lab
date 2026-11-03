const supportedTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxFileSize = 15 * 1024 * 1024

export function validateImageFile(file: File) {
  if (!supportedTypes.includes(file.type)) throw new Error('请选择 PNG、JPG 或 WebP 图片')
  if (file.size === 0) throw new Error('图片文件为空，请重新选择')
  if (file.size > maxFileSize) throw new Error('图片不能超过 15 MB')
}
