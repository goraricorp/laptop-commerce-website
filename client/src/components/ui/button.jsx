import { buttonVariants } from "@/lib/button-variants";
import PropTypes from "prop-types";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "cn";
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        }),
      )}
      {...props}
    />
  );
}
export { Button };
Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.string,
};
