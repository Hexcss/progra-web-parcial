// src/modules/orders/dto/update-order.dto.ts
import { Field, InputType } from '@nestjs/graphql';
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

@InputType()
export class UpdateOrderDto {
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ enum: ORDER_STATUS })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value ?? '').toLowerCase())
  @IsIn(ORDER_STATUS as unknown as string[])
  status?: OrderStatus;
}
