import PropTypes from "prop-types";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
export function PasswordInput({
  className,
  showPasswordLabel = "Hiện mật khẩu",
  hidePasswordLabel = "Ẩn mật khẩu",
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput {...props} type={visible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff data-icon="inline-start" />
          ) : (
            <Eye data-icon="inline-start" />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
PasswordInput.propTypes = {
  className: PropTypes.string,
  showPasswordLabel: PropTypes.string,
  hidePasswordLabel: PropTypes.string,
};
