import { toggleVariants } from "@/lib/toggle-variants";
import PropTypes from "prop-types";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cn } from "cn";
function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        toggleVariants({
          variant,
          size,
          className,
        }),
      )}
      {...props}
    />
  );
}
export { Toggle };
Toggle.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.string,
};
