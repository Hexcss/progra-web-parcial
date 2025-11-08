// src/modules/orders/dto/update-order.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export const ORDER_STATUS = [
  'created',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'canceled',
] as const;

export type OrderStatus = typeof ORDER_STATUS[number];

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: ORDER_STATUS })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value ?? '').toLowerCase())
  @IsIn(ORDER_STATUS as unknown as string[])
  status?: OrderStatus;
}
