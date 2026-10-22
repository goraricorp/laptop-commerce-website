import pc from 'picocolors'

export function Logging(
  log, // : string,
  type, // : 'success' | 'info' | 'warning' | 'error' | 'continue',
  color, // : 'green' | 'blue' | 'yellow' | 'red' | 'magenta' | 'cyan'
) {
  const icon = {
    success: '✓',
    info: '◆',
    warning: '⚠',
    error: '⨯',
    continue: '→',
  };

  return `${pc[color](`${icon[type]}`)} ${log}`
}
