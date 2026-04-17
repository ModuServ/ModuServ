type ModuServLogoProps = {
  variant?: "symbol" | "horizontal";
  className?: string;
};

export default function ModuServLogo({
  variant = "horizontal",
  className = "",
}: ModuServLogoProps) {
  const symbol = (
    <div className={`moduserv-logo-symbol ${className}`}>
      <span>M</span>
    </div>
  );

  if (variant === "symbol") {
    return symbol;
  }

  return (
    <div className={`moduserv-logo-horizontal ${className}`}>
      {symbol}
      <div className="moduserv-logo-wordmark">
        <span className="moduserv-logo-wordmark__title">ModuServ</span>
      </div>
    </div>
  );
}
