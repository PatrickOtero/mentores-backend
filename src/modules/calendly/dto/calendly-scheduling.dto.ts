import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetCalendlyAvailableTimesDto {
  @IsISO8601()
  @IsNotEmpty()
  startTime: string;

  @IsISO8601()
  @IsNotEmpty()
  endTime: string;
}

export class CreateCalendlyInviteeDto {
  @IsISO8601()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsOptional()
  schedulingUrl?: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CancelCalendlyScheduleDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
