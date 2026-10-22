import PropTypes from "prop-types";
import { FieldError } from "@/components/ui/field";
export function AuthFieldError({ errors = [] }) {
  const message = errors.map(getErrorMessage).find(Boolean);
  if (!message) return null;
  return <FieldError>{message}</FieldError>;
}
function getErrorMessage(error) {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return null;
  if (typeof error.message === "string") return error.message;
  if (Array.isArray(error.issues))
    return error.issues.map(getErrorMessage).find(Boolean) ?? null;
  return (
    Object.values(error)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(getErrorMessage)
      .find(Boolean) ?? null
  );
}
AuthFieldError.propTypes = {
  errors: PropTypes.array,
};
