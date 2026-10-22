import PropTypes from "prop-types";
import { cn } from "cn";
function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
export { Skeleton };
Skeleton.propTypes = {
  className: PropTypes.string,
};
