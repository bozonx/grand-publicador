
import { registerAs } from '@nestjs/config';
import { IsInt, IsString, IsIn, Min, Max, validateSync, IsOptional } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Application configuration schema.
 * Defines the structure and validation rules for the application's core settings.
 */
export class AppConfig {
  /**
   * The port number on which the server will listen.
   * Defined by SERVER_PORT environment variable.
   * Default: 8080
   */
  @IsInt()
  @Min(1)
  @Max(65535)
  public port!: number;

  /**
   * The host address to verify binding.
   * Defined by SERVER_HOST environment variable.
   * Default: 0.0.0.0
   */
  @IsString()
  public host!: string;

  /**
   * global prefix for all API routes.
   * Defined by SERVER_BASE_PATH environment variable.
   * Default: empty string (or api/v1 handling in main.ts)
   */
  @IsString()
  public basePath!: string;

  /**
   * The node environment mode.
   * Defined by NODE_ENV environment variable.
   * Values: 'development', 'production', 'test'
   * Default: 'production'
   */
  @IsIn(['development', 'production', 'test'])
  public nodeEnv!: string;

  /**
   * Logging level for the application.
   * Defined by LOG_LEVEL environment variable.
   * Values correspond to Pino log levels.
   * Default: 'warn'
   */
  @IsIn(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
  public logLevel!: string;

  /**
   * API Key for basic protection or internal communication.
   * Defined by AUTH_API_KEY or API_KEY environment variable.
   */
  @IsString()
  @IsOptional()
  public apiKey?: string;
}

export default registerAs('app', (): AppConfig => {
  // Transform environment variables to a typed configuration object
  const config = plainToClass(AppConfig, {
    port: parseInt(process.env.SERVER_PORT ?? '8080', 10),
    host: process.env.SERVER_HOST ?? '0.0.0.0',
    basePath: (process.env.SERVER_BASE_PATH ?? '').replace(/^\/+|\/+$/g, ''),
    nodeEnv: process.env.NODE_ENV ?? 'production',
    logLevel: process.env.LOG_LEVEL ?? 'warn',
    apiKey: process.env.AUTH_API_KEY ?? process.env.API_KEY, // Fallback for backward compatibility
  });

  // Perform synchronous validation of the configuration object
  const errors = validateSync(config, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map(err => Object.values(err.constraints ?? {}).join(', '));
    throw new Error(`App config validation error: ${errorMessages.join('; ')}`);
  }

  return config;
});
