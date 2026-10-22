import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
export function Background({
  animationSpeed = 60,
  children,
  className,
  showRadialGradient = true,
  ...props
}) {
  return (
    <main>
      <div
        className={cn(
          "transition-bg relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-zinc-50 text-slate-950 dark:bg-zinc-900 dark:text-slate-50",
          className,
        )}
        {...props}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            "--animation-speed": `${animationSpeed}s`,
            "--aurora":
              "repeating-linear-gradient(100deg,var(--color-1)_10%,var(--color-2)_15%,var(--color-3)_20%,var(--color-4)_25%,var(--color-5)_30%)",
            "--black": "#000",
            "--color-1": "var(--professional-primary-2)",
            "--color-2": "var(--professional-primary-3)",
            "--color-3": "var(--professional-primary-4)",
            "--color-4": "var(--professional-primary-1)",
            "--color-5": "var(--professional-primary-5)",
            "--dark-gradient":
              "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",
            "--transparent": "transparent",
            "--white": "#fff",
            "--white-gradient":
              "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",
          }}
        >
          <div
            className={cn(
              `pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-50 blur-[10px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--color-1)_10%,var(--color-2)_15%,var(--color-3)_20%,var(--color-4)_25%,var(--color-5)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] dark:[background-image:var(--dark-gradient),var(--aurora)] dark:invert-0 after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,
              "after:[animation:aurora_var(--animation-speed)_linear_infinite]",
              showRadialGradient &&
                "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]",
            )}
          />
        </div>
        {children}
      </div>
    </main>
  );
}
Background.propTypes = {
  animationSpeed: PropTypes.number,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  className: PropTypes.string,
  showRadialGradient: PropTypes.bool,
};
