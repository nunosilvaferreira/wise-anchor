export const SUPPORT_LEVEL_OPTIONS = [
  { value: "low", label: "Low Support" },
  { value: "moderate", label: "Moderate Support" },
  { value: "severe", label: "Severe Support" },
];

export function normalizeSupportLevel(value) {
  if (value === "low" || value === "severe") {
    return value;
  }

  return "moderate";
}

export function getAgeFromDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function qualifiesForCaregiverView({
  dateOfBirth,
  supportLevel,
}) {
  const normalizedSupportLevel = normalizeSupportLevel(supportLevel);
  const age = getAgeFromDateOfBirth(dateOfBirth);

  if (age !== null && age < 18) {
    return true;
  }

  return normalizedSupportLevel === "severe";
}

export function getSupportLevelLabel(value) {
  const match = SUPPORT_LEVEL_OPTIONS.find((option) => option.value === value);
  return match?.label ?? "Moderate Support";
}
