export function errorHandler(err, req, res, next) {

  let status = err.statusCode || 500;
  let message = err.statusCode
    ? err.message
    : "Възникна грешка при обработката на заявката. Опитайте отново.";

  if (err?.type === "entity.too.large" || err?.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "Размерът на изпратения файл или заявка е твърде голям.";
  } else if (err?.name === "SequelizeUniqueConstraintError") {
    status = 409;
    message = "Запис с тези данни вече съществува.";
  }

  res.status(status).json({
    success: false,
    message,
  });
}
