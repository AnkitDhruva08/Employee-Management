

export const allowedFileTypes = ["image/png", "image/jpg", "image/jpeg", "application/pdf"];

export function validateFileTypes(files) {
  const validFiles = files.filter((file) => allowedFileTypes.includes(file.type));
  const isValid = validFiles.length === files.length;
  const error = isValid ? "" : "Only PNG, JPG, JPEG, and PDF files are allowed.";
  return { isValid, validFiles, error };
}
