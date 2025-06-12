// allowed file types
export const allowedFileTypes = ["image/png", "image/jpg", "image/jpeg", "application/pdf"];

// file validation
export function validateFileTypes(files) {
  const validFiles = files.filter((file) => allowedFileTypes.includes(file.type));
  const isValid = validFiles.length === files.length;
  const error = isValid ? "" : "Only PNG, JPG, JPEG, and PDF files are allowed.";
  return { isValid, validFiles, error };
}

// phone number validation (10 digits, starts with 6-9)
export function validatePhoneNumber(phone) {
  const regex = /^[6-9]\d{9}$/;
  const isValid = regex.test(phone);
  const error = isValid ? "" : "Enter a valid 10-digit phone number.";
  return { isValid, error };
}

// Aadhaar number validation (12 digits)
export function validateAadhaarNumber(aadhaar) {
  const regex = /^\d{12}$/;
  const isValid = regex.test(aadhaar);
  const error = isValid ? "" : "Aadhaar number must be 12 digits.";
  return { isValid, error };
}

// Date of birth validation (must be past date, optional age check)
export function validateDOB(dob) {
  const inputDate = new Date(dob);
  const today = new Date();
  const isValid = inputDate instanceof Date && !isNaN(inputDate) && inputDate < today;

  const error = isValid ? "" : "Enter a valid date of birth.";
  return { isValid, error };
}
